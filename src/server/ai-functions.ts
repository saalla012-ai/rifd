/**
 * Server functions for AI generation.
 * - generateText: text generation via Lovable AI Gateway (Gemini Flash by default).
 * - generateImage: image generation via Gemini image preview model.
 *
 * Both functions: enforce auth, check plan quotas, persist the result to
 * `generations`, and increment `usage_logs` for the current month.
 *
 * IMPORTANT: All DB ops use the authenticated client from `requireSupabaseAuth`
 * middleware (RLS-scoped to the calling user). We do NOT use the service-role
 * admin client here because (a) it's not needed — every row is user-owned, and
 * (b) the service-role key is not injected into the Worker runtime.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { chatComplete, AIError } from "./lovable-ai";
import { estimateTextCost, estimateImageCost } from "./cost";
import { buildTextSystemPrompt, buildImagePrompt, type StoreContext } from "./prompts";
import { currentRiyadhMonth } from "@/lib/usage-month";

type DbClient = SupabaseClient<Database>;

const FALLBACK_LIMITS: Record<string, { text: number; image: number }> = {
  free: { text: 5, image: 2 },
  pro: { text: 1000, image: 60 },
  business: { text: 5000, image: 300 },
};

// مفتاح شهر الاستخدام بتوقيت الرياض (UTC+3) لتفادي فارق 3 ساعات في حدود الشهر.
function currentMonth(): string {
  return currentRiyadhMonth();
}

async function loadPlanLimits(
  db: DbClient,
  plan: string
): Promise<{ text: number; image: number }> {
  const { data } = await db
    .from("plan_limits")
    .select("kind, monthly_limit")
    .eq("plan", plan as "free" | "pro" | "business");
  if (!data || data.length === 0) return FALLBACK_LIMITS[plan] ?? FALLBACK_LIMITS.free;
  const out = { text: 0, image: 0 };
  for (const row of data) {
    if (row.kind === "text") out.text = row.monthly_limit;
    else if (row.kind === "image") out.image = row.monthly_limit;
  }
  return out;
}

async function loadProfileAndUsage(db: DbClient, userId: string) {
  const month = currentMonth();
  const [{ data: profile }, { data: usage }] = await Promise.all([
    db.from("profiles").select("*").eq("id", userId).maybeSingle(),
    db
      .from("usage_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("month", month)
      .maybeSingle(),
  ]);
  return { profile, usage, month };
}

async function bumpUsage(
  db: DbClient,
  _userId: string,
  month: string,
  kind: "text" | "image"
) {
  // Atomic UPSERT via SECURITY DEFINER RPC — race-condition safe.
  const { error } = await db.rpc("bump_usage", { _month: month, _kind: kind });
  if (error) throw new Error(`فشل تحديث العداد: ${error.message}`);
}

// ============================================================
// generateText
// ============================================================
export const generateText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { prompt: string; templateTitle: string; templateId: string }) => {
      if (!input.prompt?.trim()) throw new Error("الموضوع مطلوب");
      if (input.prompt.length > 2000) throw new Error("الموضوع طويل جداً");
      return input;
    }
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    const { profile, usage, month } = await loadProfileAndUsage(supabase, userId);

    const plan = (profile?.plan ?? "free") as string;
    const limits = await loadPlanLimits(supabase, plan);
    const used = usage?.text_count ?? 0;
    if (used >= limits.text) {
      throw new Error(
        `وصلت حدّ الباقة (${limits.text} توليدة شهرياً). رقّ باقتك للاستمرار.`
      );
    }

    const ctx: StoreContext = profile ?? {};
    const system = buildTextSystemPrompt(ctx, data.templateTitle);

    let result: string;
    let aiUsage = { prompt_tokens: null as number | null, completion_tokens: null as number | null, total_tokens: null as number | null };
    const modelName = "google/gemini-2.5-flash";
    try {
      const out = await chatComplete({
        model: modelName,
        messages: [
          { role: "system", content: system },
          { role: "user", content: data.prompt },
        ],
        temperature: 0.85,
      });
      result = out.text.trim();
      aiUsage = out.usage;
      if (!result) throw new Error("لم يتم توليد محتوى");
    } catch (e) {
      if (e instanceof AIError) throw new Error(e.message);
      throw e;
    }

    const cost = estimateTextCost(modelName, aiUsage);

    await Promise.all([
      supabase.from("generations").insert({
        user_id: userId,
        type: "text",
        prompt: data.prompt,
        result,
        template: data.templateId,
        model_used: modelName,
        prompt_tokens: aiUsage.prompt_tokens,
        completion_tokens: aiUsage.completion_tokens,
        total_tokens: aiUsage.total_tokens,
        estimated_cost_usd: cost,
        metadata: { template_title: data.templateTitle },
      }),
      bumpUsage(supabase, userId, month, "text"),
    ]);

    return {
      result,
      remaining: limits.text - used - 1,
    };
  });

// ============================================================
// generateImage
// ============================================================
export const generateImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      prompt: string;
      templateTitle: string;
      templateId: string;
      quality: "flash" | "pro";
    }) => {
      if (!input.prompt?.trim()) throw new Error("وصف الصورة مطلوب");
      if (input.prompt.length > 1500) throw new Error("الوصف طويل جداً");
      if (!["flash", "pro"].includes(input.quality)) throw new Error("جودة غير صحيحة");
      return input;
    }
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    const { profile, usage, month } = await loadProfileAndUsage(supabase, userId);

    const plan = (profile?.plan ?? "free") as string;
    const limits = await loadPlanLimits(supabase, plan);
    const used = usage?.image_count ?? 0;
    if (used >= limits.image) {
      throw new Error(
        `وصلت حدّ صور باقتك (${limits.image} صورة شهرياً). رقّ باقتك للاستمرار.`
      );
    }

    const ctx: StoreContext = profile ?? {};
    const fullPrompt = buildImagePrompt(ctx, data.prompt, data.templateTitle);

    const model =
      data.quality === "pro"
        ? "google/gemini-3-pro-image-preview"
        : "google/gemini-3.1-flash-image-preview";

    let imageDataUrl: string;
    try {
      const out = await chatComplete({
        model,
        messages: [{ role: "user", content: fullPrompt }],
        modalities: ["image", "text"],
      });
      imageDataUrl = out.images[0];
      if (!imageDataUrl) throw new Error("لم يتم توليد صورة");
    } catch (e) {
      if (e instanceof AIError) throw new Error(e.message);
      throw e;
    }

    // Upload data URL to storage bucket (RLS-scoped: user can only write to their own folder)
    const match = imageDataUrl.match(/^data:(image\/[a-z0-9+]+);base64,(.+)$/i);
    if (!match) throw new Error("صيغة الصورة غير مدعومة");
    const mime = match[1];
    const ext = mime.split("/")[1].replace("+xml", "");
    const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
    const filename = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("generated-images")
      .upload(filename, bytes, { contentType: mime, upsert: false });
    if (upErr) throw new Error(`فشل حفظ الصورة: ${upErr.message}`);

    const { data: pub } = supabase.storage
      .from("generated-images")
      .getPublicUrl(filename);
    const publicUrl = pub.publicUrl;

    const cost = estimateImageCost(model);

    await Promise.all([
      supabase.from("generations").insert({
        user_id: userId,
        type: "image",
        prompt: data.prompt,
        result: publicUrl,
        template: data.templateId,
        model_used: model,
        estimated_cost_usd: cost,
        metadata: { template_title: data.templateTitle, quality: data.quality, storage_path: filename },
      }),
      bumpUsage(supabase, userId, month, "image"),
    ]);

    return {
      url: publicUrl,
      remaining: limits.image - used - 1,
    };
  });

// ============================================================
// editImage — يأخذ صورة input + تعليمات تعديل، يرجع صورة معدّلة
// يستخدم نفس حصة image_count.
// ============================================================
export const editImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      imageDataUrl: string;
      prompt: string;
      templateTitle: string;
      templateId: string;
    }) => {
      if (!input.imageDataUrl?.startsWith("data:image/")) {
        throw new Error("صيغة الصورة غير صحيحة");
      }
      // ~10MB كحد أقصى للـbase64 (≈ 7.5MB صورة فعلية)
      if (input.imageDataUrl.length > 14_000_000) {
        throw new Error("حجم الصورة كبير جداً (الحد الأقصى ~10MB)");
      }
      if (!input.prompt?.trim()) throw new Error("اكتب وصف التعديل");
      if (input.prompt.length > 1500) throw new Error("الوصف طويل جداً");
      return input;
    }
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    const { profile, usage, month } = await loadProfileAndUsage(supabase, userId);

    const plan = (profile?.plan ?? "free") as string;
    const limits = await loadPlanLimits(supabase, plan);
    const used = usage?.image_count ?? 0;
    if (used >= limits.image) {
      throw new Error(
        `وصلت حدّ صور باقتك (${limits.image} صورة شهرياً). رقّ باقتك للاستمرار.`
      );
    }

    const ctx: StoreContext = profile ?? {};
    const brandHint = ctx.brand_color
      ? ` Use brand accent color ${ctx.brand_color} where appropriate.`
      : "";
    const fullPrompt = `${data.prompt}. Maintain photorealistic quality, clean composition, professional e-commerce look.${brandHint}`;

    const model = "google/gemini-3.1-flash-image-preview";

    let editedDataUrl: string;
    try {
      const out = await chatComplete({
        model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: fullPrompt },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
        modalities: ["image", "text"],
      });
      editedDataUrl = out.images[0];
      if (!editedDataUrl) throw new Error("لم يتم توليد صورة معدّلة");
    } catch (e) {
      if (e instanceof AIError) throw new Error(e.message);
      throw e;
    }

    // Upload edited image to storage
    const match = editedDataUrl.match(/^data:(image\/[a-z0-9+]+);base64,(.+)$/i);
    if (!match) throw new Error("صيغة الصورة الناتجة غير مدعومة");
    const mime = match[1];
    const ext = mime.split("/")[1].replace("+xml", "");
    const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
    const filename = `${userId}/edited-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("generated-images")
      .upload(filename, bytes, { contentType: mime, upsert: false });
    if (upErr) throw new Error(`فشل حفظ الصورة: ${upErr.message}`);

    const { data: pub } = supabase.storage
      .from("generated-images")
      .getPublicUrl(filename);
    const publicUrl = pub.publicUrl;

    const editCost = estimateImageCost(model);

    await Promise.all([
      supabase.from("generations").insert({
        user_id: userId,
        type: "image_enhance",
        prompt: data.prompt,
        result: publicUrl,
        template: data.templateId,
        model_used: model,
        estimated_cost_usd: editCost,
        metadata: {
          template_title: data.templateTitle,
          storage_path: filename,
        },
      }),
      bumpUsage(supabase, userId, month, "image"),
    ]);

    return {
      url: publicUrl,
      remaining: limits.image - used - 1,
    };
  });

// ============================================================
// getUserMonthlyCost — يجمّع تكلفة وتوكنز المستخدم خلال شهر معيّن
// (افتراضياً الشهر الحالي بتوقيت الرياض). يُستخدم لتقارير لاحقة.
// ============================================================
export const getUserMonthlyCost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { month?: string }) => input ?? {})
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    const month = data.month ?? currentMonth();
    const [year, mon] = month.split("-").map((n) => parseInt(n, 10));
    if (!year || !mon) throw new Error("صيغة الشهر غير صحيحة (YYYY-MM)");
    // حدود الشهر بتوقيت الرياض ⇒ تحويل لـUTC بطرح 3 ساعات
    const startUtc = new Date(Date.UTC(year, mon - 1, 1, -3, 0, 0));
    const endUtc = new Date(Date.UTC(year, mon, 1, -3, 0, 0));

    const { data: rows, error } = await supabase
      .from("generations")
      .select("type, total_tokens, estimated_cost_usd")
      .eq("user_id", userId)
      .gte("created_at", startUtc.toISOString())
      .lt("created_at", endUtc.toISOString());

    if (error) throw new Error(`تعذّر جلب تقرير الكلفة: ${error.message}`);

    const acc = {
      month,
      total_tokens: 0,
      total_cost_usd: 0,
      by_type: {} as Record<string, { count: number; tokens: number; cost: number }>,
    };
    for (const r of rows ?? []) {
      acc.total_tokens += r.total_tokens ?? 0;
      acc.total_cost_usd += Number(r.estimated_cost_usd ?? 0);
      const t = r.type as string;
      acc.by_type[t] ??= { count: 0, tokens: 0, cost: 0 };
      acc.by_type[t].count += 1;
      acc.by_type[t].tokens += r.total_tokens ?? 0;
      acc.by_type[t].cost += Number(r.estimated_cost_usd ?? 0);
    }
    // تقريب الكلفة لـ6 منازل
    acc.total_cost_usd = Math.round(acc.total_cost_usd * 1_000_000) / 1_000_000;
    return acc;
  });
