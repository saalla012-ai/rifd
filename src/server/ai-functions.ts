/**
 * Server functions for AI generation.
 * - generateText: text generation via Lovable AI Gateway (Gemini Flash by default).
 * - generateImage: image generation via Gemini image preview model.
 *
 * Both functions: enforce auth, check plan quotas, persist the result to
 * `generations`, and increment `usage_logs` for the current month.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { chatComplete, AIError } from "./lovable-ai";
import { buildTextSystemPrompt, buildImagePrompt, type StoreContext } from "./prompts";

const PLAN_LIMITS: Record<string, { text: number; image: number }> = {
  free: { text: 5, image: 0 },
  pro: { text: 1000, image: 60 },
  business: { text: 5000, image: 300 },
};

function currentMonth(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function loadProfileAndUsage(userId: string) {
  const month = currentMonth();
  const [{ data: profile }, { data: usage }] = await Promise.all([
    supabaseAdmin.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabaseAdmin
      .from("usage_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("month", month)
      .maybeSingle(),
  ]);
  return { profile, usage, month };
}

async function bumpUsage(userId: string, month: string, kind: "text" | "image") {
  // Upsert + increment
  const { data: existing } = await supabaseAdmin
    .from("usage_logs")
    .select("id, text_count, image_count")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();

  if (!existing) {
    await supabaseAdmin.from("usage_logs").insert({
      user_id: userId,
      month,
      text_count: kind === "text" ? 1 : 0,
      image_count: kind === "image" ? 1 : 0,
    });
    return;
  }
  await supabaseAdmin
    .from("usage_logs")
    .update({
      text_count: kind === "text" ? existing.text_count + 1 : existing.text_count,
      image_count: kind === "image" ? existing.image_count + 1 : existing.image_count,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);
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
    const userId = (context as { userId: string }).userId;
    const { profile, usage, month } = await loadProfileAndUsage(userId);

    const plan = (profile?.plan ?? "free") as keyof typeof PLAN_LIMITS;
    const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
    const used = usage?.text_count ?? 0;
    if (used >= limits.text) {
      throw new Error(
        `وصلت حدّ الباقة (${limits.text} توليدة شهرياً). رقّ باقتك للاستمرار.`
      );
    }

    const ctx: StoreContext = profile ?? {};
    const system = buildTextSystemPrompt(ctx, data.templateTitle);

    let result: string;
    try {
      const out = await chatComplete({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: data.prompt },
        ],
        temperature: 0.85,
      });
      result = out.text.trim();
      if (!result) throw new Error("لم يتم توليد محتوى");
    } catch (e) {
      if (e instanceof AIError) throw new Error(e.message);
      throw e;
    }

    // Persist generation + bump usage (in parallel — non-blocking integrity)
    await Promise.all([
      supabaseAdmin.from("generations").insert({
        user_id: userId,
        type: "text",
        prompt: data.prompt,
        result,
        template: data.templateId,
        model_used: "google/gemini-2.5-flash",
        metadata: { template_title: data.templateTitle },
      }),
      bumpUsage(userId, month, "text"),
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
    const userId = (context as { userId: string }).userId;
    const { profile, usage, month } = await loadProfileAndUsage(userId);

    const plan = (profile?.plan ?? "free") as keyof typeof PLAN_LIMITS;
    const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
    const used = usage?.image_count ?? 0;
    if (limits.image === 0) {
      throw new Error("توليد الصور متاح في الباقة الاحترافية فقط. رقّ باقتك.");
    }
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

    // Upload data URL to storage bucket
    const match = imageDataUrl.match(/^data:(image\/[a-z0-9+]+);base64,(.+)$/i);
    if (!match) throw new Error("صيغة الصورة غير مدعومة");
    const mime = match[1];
    const ext = mime.split("/")[1].replace("+xml", "");
    const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
    const filename = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: upErr } = await supabaseAdmin.storage
      .from("generated-images")
      .upload(filename, bytes, { contentType: mime, upsert: false });
    if (upErr) throw new Error(`فشل حفظ الصورة: ${upErr.message}`);

    const { data: pub } = supabaseAdmin.storage
      .from("generated-images")
      .getPublicUrl(filename);
    const publicUrl = pub.publicUrl;

    await Promise.all([
      supabaseAdmin.from("generations").insert({
        user_id: userId,
        type: "image",
        prompt: data.prompt,
        result: publicUrl,
        template: data.templateId,
        model_used: model,
        metadata: { template_title: data.templateTitle, quality: data.quality, storage_path: filename },
      }),
      bumpUsage(userId, month, "image"),
    ]);

    return {
      url: publicUrl,
      remaining: limits.image - used - 1,
    };
  });
