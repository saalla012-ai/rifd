import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { consume, refund, videoCost, type VideoQuality, InsufficientCreditsError } from "./credits";

const VIDEO_MODEL_BY_QUALITY: Record<VideoQuality, string> = {
  fast: "google/veo-3-fast",
  quality: "google/veo-3",
};

const VIDEO_ESTIMATED_COST_USD: Record<VideoQuality, number> = {
  fast: 0.5,
  quality: 1.5,
};

const MAX_PROCESSING_MINUTES = 20;
const PROCESSING_LIMIT_PER_USER = 2;

const TERMINAL_PROVIDER_STATUSES = new Set(["succeeded", "failed", "canceled"]);

type DbClient = SupabaseClient<Database>;
type VideoJobRow = Database["public"]["Tables"]["video_jobs"]["Row"];

const videoInputSchema = z.object({
  prompt: z.string().trim().min(10, "اكتب وصف فيديو أوضح").max(1800, "وصف الفيديو طويل جداً"),
  quality: z.enum(["fast", "quality"]),
  aspectRatio: z.enum(["9:16", "1:1", "16:9"]).default("9:16"),
  durationSeconds: z.union([z.literal(5), z.literal(8)]).default(5),
  startingFrameUrl: z.string().url().optional().or(z.literal("")),
});

function videoCreditError(e: unknown): Error {
  if (e instanceof InsufficientCreditsError) {
    return new Error(
      `INSUFFICIENT_CREDITS: رصيد نقاط الفيديو لا يكفي (تحتاج ${e.required} نقطة فيديو). اشحن نقاط فيديو إضافية أو رقّ باقتك.`
    );
  }
  return e instanceof Error ? e : new Error(String(e));
}

function publicVideoError(e: unknown): Error {
  const msg = e instanceof Error ? e.message : String(e);
  if (/INSUFFICIENT_CREDITS|insufficient_credits/i.test(msg)) return videoCreditError(e);
  if (/too_many_processing_video_jobs/i.test(msg)) return new Error("لديك مهمتا فيديو قيد المعالجة حالياً. انتظر اكتمال إحداهما قبل إنشاء فيديو جديد.");
  if (/إعداد مزوّد الفيديو غير مكتمل/i.test(msg)) return new Error("خدمة الفيديو غير جاهزة حالياً. جرّب لاحقاً أو تواصل مع الدعم.");
  if (/فشل مزوّد الفيديو|Replicate|provider|prediction|fetch failed/i.test(msg)) return new Error("تعذر الاتصال بخدمة الفيديو حالياً. تم حفظ الحالة ورد النقاط عند الحاجة.");
  return e instanceof Error ? e : new Error("فشل تنفيذ عملية الفيديو");
}

async function countProcessingJobs(userId: string) {
  const { count, error } = await supabaseAdmin
    .from("video_jobs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "processing");
  if (error) throw new Error(`فشل التحقق من المهام النشطة: ${error.message}`);
  return count ?? 0;
}

async function createReplicatePrediction(input: z.infer<typeof videoInputSchema>) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("إعداد مزوّد الفيديو غير مكتمل");

  const model = VIDEO_MODEL_BY_QUALITY[input.quality];
  const response = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "wait=60",
    },
    body: JSON.stringify({
      input: {
        prompt: input.prompt,
        aspect_ratio: input.aspectRatio,
        duration: input.durationSeconds,
        image: input.startingFrameUrl || undefined,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`فشل مزوّد الفيديو (${response.status}): ${text.slice(0, 300)}`);
  }

  const prediction = await response.json() as {
    id?: string;
    status?: string;
    output?: string | string[];
    error?: string;
  };

  if (prediction.error) throw new Error(`فشل مزوّد الفيديو: ${prediction.error}`);
  const output = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  return {
    providerJobId: prediction.id ?? null,
    status: prediction.status ?? "processing",
    resultUrl: typeof output === "string" ? output : null,
  };
}

async function getReplicatePrediction(predictionId: string) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("إعداد مزوّد الفيديو غير مكتمل");
  const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`فشل تحديث حالة الفيديو (${response.status}): ${text.slice(0, 300)}`);
  }
  const prediction = await response.json() as { status?: string; output?: string | string[]; error?: string };
  const output = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  return { status: prediction.status ?? "processing", resultUrl: typeof output === "string" ? output : null, error: prediction.error };
}

export const generateVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => videoInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    const cost = videoCost(data.quality);
    let ledgerId: string | null = null;
    let jobId: string | null = null;

    try {
      const processingCount = await countProcessingJobs(userId);
      if (processingCount >= PROCESSING_LIMIT_PER_USER) throw new Error("too_many_processing_video_jobs");

      const charge = await consume(supabase, cost, "consume_video", {
        quality: data.quality,
        aspect_ratio: data.aspectRatio,
        duration_seconds: data.durationSeconds,
        provider: "replicate",
        credit_scope: "video",
      });
      ledgerId = charge.ledgerId;

      const { data: inserted, error: insertError } = await supabaseAdmin
        .from("video_jobs")
        .insert({
          user_id: userId,
          prompt: data.prompt,
          quality: data.quality,
          aspect_ratio: data.aspectRatio,
          duration_seconds: data.durationSeconds,
          starting_frame_url: data.startingFrameUrl || null,
          credits_charged: cost,
          ledger_id: ledgerId,
          status: "processing",
          provider: "replicate",
          estimated_cost_usd: VIDEO_ESTIMATED_COST_USD[data.quality],
          metadata: { source: "dashboard_generate_video", model: VIDEO_MODEL_BY_QUALITY[data.quality] },
        })
        .select("*")
        .single();

      if (insertError || !inserted) throw new Error(`فشل إنشاء مهمة الفيديو: ${insertError?.message ?? "استجابة فارغة"}`);
      const job = inserted as VideoJobRow;
      jobId = job.id;

      const prediction = await createReplicatePrediction(data);
      const finalStatus = prediction.resultUrl ? "completed" : "processing";
      const finalUrl = prediction.resultUrl;

      const { data: updated, error: updateError } = await supabaseAdmin
        .from("video_jobs")
        .update({
          provider_job_id: prediction.providerJobId ?? null,
          result_url: finalUrl,
          status: finalStatus,
          completed_at: finalStatus === "completed" ? new Date().toISOString() : null,
          metadata: {
            ...(job.metadata as Record<string, unknown> | null),
            provider_status: prediction.status,
          },
        })
        .eq("id", job.id)
        .select("*")
        .single();

      if (updateError || !updated) throw new Error(`فشل تحديث مهمة الفيديو: ${updateError?.message ?? "استجابة فارغة"}`);

      return {
        job: updated as VideoJobRow,
        creditsCharged: cost,
        remainingTotal: charge.remainingTotal,
        pending: finalStatus === "processing",
      };
    } catch (e) {
      const refundLedgerId = ledgerId ? await refund(supabase, ledgerId, "video_generation_failed") : null;
      if (jobId) {
        await supabaseAdmin
          .from("video_jobs")
          .update({
            status: "refunded",
            refund_ledger_id: refundLedgerId,
            error_message: publicVideoError(e).message,
            metadata: { failure_stage: "generate_video", original_error: e instanceof Error ? e.message.slice(0, 500) : String(e).slice(0, 500) },
          })
          .eq("id", jobId);
      }
      throw publicVideoError(e);
    }
  });

export const listVideoJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    const { data, error } = await supabase
      .from("video_jobs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(`فشل جلب الفيديوهات: ${error.message}`);
    return { jobs: (data as VideoJobRow[] | null) ?? [] };
  });

export const refreshVideoJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ jobId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    const { data: job, error } = await supabase
      .from("video_jobs")
      .select("*")
      .eq("id", data.jobId)
      .eq("user_id", userId)
      .single();
    if (error || !job) throw new Error(`فشل جلب مهمة الفيديو: ${error?.message ?? "غير موجودة"}`);
    const row = job as VideoJobRow;
    if (!row.provider_job_id || row.status !== "processing") return { job: row };

    const prediction = await getReplicatePrediction(row.provider_job_id);
    if (prediction.status === "failed" || prediction.status === "canceled") {
      if (row.ledger_id) await refund(supabase, row.ledger_id, "video_generation_failed");
      const { data: updated, error: updateError } = await supabaseAdmin
        .from("video_jobs")
        .update({ status: "refunded", error_message: prediction.error ?? "فشل توليد الفيديو لدى المزود" })
        .eq("id", row.id)
        .select("*")
        .single();
      if (updateError || !updated) throw new Error(`فشل تحديث مهمة الفيديو: ${updateError?.message ?? "استجابة فارغة"}`);
      return { job: updated as VideoJobRow };
    }

    if (prediction.status === "succeeded" && prediction.resultUrl) {
      const { data: updated, error: updateError } = await supabaseAdmin
        .from("video_jobs")
        .update({ status: "completed", result_url: prediction.resultUrl, completed_at: new Date().toISOString() })
        .eq("id", row.id)
        .select("*")
        .single();
      if (updateError || !updated) throw new Error(`فشل تحديث مهمة الفيديو: ${updateError?.message ?? "استجابة فارغة"}`);
      return { job: updated as VideoJobRow };
    }

    return { job: row };
  });
