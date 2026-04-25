import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { consume, consumeVideoDailyQuota, getRefundLedgerId, operationalSwitchEnabled, refund, releaseVideoDailyQuota, videoCost, type VideoQuality, type VideoDuration, InsufficientCreditsError, VideoDailyQuotaExceededError } from "./credits";

const VIDEO_MODEL_BY_QUALITY: Record<VideoQuality, string> = {
  fast: "google/veo-3-fast",
  quality: "google/veo-3",
};

const VIDEO_ESTIMATED_COST_USD: Record<VideoQuality, Record<VideoDuration, number>> = {
  fast: { 5: 0.5, 8: 0.8 },
  quality: { 5: 2.0, 8: 3.2 },
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
  campaignPackId: z.string().uuid().optional(),
});

async function assertCampaignPackOwner(db: DbClient, userId: string, campaignPackId?: string) {
  if (!campaignPackId) return null;
  const { data, error } = await db
    .from("campaign_packs")
    .select("id, product, goal, channel")
    .eq("id", campaignPackId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) throw new Error("حزمة الحملة غير موجودة أو لا تملك صلاحية استخدامها");
  return data;
}

function campaignMetadata(pack: Awaited<ReturnType<typeof assertCampaignPackOwner>>) {
  return pack
    ? { source: "campaign_studio", campaign_pack_id: pack.id, campaign_product: pack.product, campaign_goal: pack.goal, campaign_channel: pack.channel }
    : { source: "dashboard_generate_video" };
}

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
  if (/video_fast_not_allowed/i.test(msg)) return new Error("VIDEO_NOT_ALLOWED: الفيديو غير متاح في باقتك الحالية. رقّ الباقة أو اشحن نقاطاً بعد التفعيل.");
  if (/video_quality_not_allowed/i.test(msg)) return new Error("VIDEO_QUALITY_NOT_ALLOWED: جودة Quality متاحة في باقات Growth وما فوق.");
  if (/video_duration_not_allowed/i.test(msg)) return new Error("VIDEO_DURATION_NOT_ALLOWED: مدة 8 ثوانٍ غير متاحة في باقتك الحالية.");
  if (/INSUFFICIENT_CREDITS|insufficient_credits/i.test(msg)) return videoCreditError(e);
  if (e instanceof VideoDailyQuotaExceededError || /video_daily_quota_exceeded/i.test(msg)) return new Error("VIDEO_DAILY_LIMIT: وصلت إلى حد توليد الفيديو اليومي في باقتك. جرّب غداً أو رقّ الباقة.");
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

async function markProcessingJobRefunded(params: {
  jobId: string;
  refundLedgerId: string | null;
  errorMessage: string;
  metadata?: Record<string, unknown>;
}) {
  const updatePayload: Database["public"]["Tables"]["video_jobs"]["Update"] = {
    status: "refunded",
    error_message: params.errorMessage,
    ...(params.refundLedgerId ? { refund_ledger_id: params.refundLedgerId } : {}),
    ...(params.metadata ? { metadata: params.metadata as Json } : {}),
  };

  const { data, error } = await supabaseAdmin
    .from("video_jobs")
    .update(updatePayload)
    .eq("id", params.jobId)
    .eq("status", "processing")
    .select("*")
    .maybeSingle();

  if (error) throw new Error(`فشل تحديث مهمة الفيديو: ${error.message}`);
  if (data) return data as VideoJobRow;

  const { data: current, error: readError } = await supabaseAdmin
    .from("video_jobs")
    .select("*")
    .eq("id", params.jobId)
    .single();
  if (readError || !current) throw new Error(`فشل جلب مهمة الفيديو بعد الاسترداد: ${readError?.message ?? "غير موجودة"}`);
  return current as VideoJobRow;
}

async function markProcessingJobCompleted(params: {
  jobId: string;
  resultUrl: string;
  metadata?: Record<string, unknown>;
}) {
  const { data, error } = await supabaseAdmin
    .from("video_jobs")
    .update({
      status: "completed",
      result_url: params.resultUrl,
      completed_at: new Date().toISOString(),
      ...(params.metadata ? { metadata: params.metadata as Json } : {}),
    })
    .eq("id", params.jobId)
    .eq("status", "processing")
    .select("*")
    .maybeSingle();

  if (error) throw new Error(`فشل تحديث مهمة الفيديو: ${error.message}`);
  if (data) return data as VideoJobRow;

  const { data: current, error: readError } = await supabaseAdmin
    .from("video_jobs")
    .select("*")
    .eq("id", params.jobId)
    .single();
  if (readError || !current) throw new Error(`فشل جلب مهمة الفيديو بعد الإكمال: ${readError?.message ?? "غير موجودة"}`);
  return current as VideoJobRow;
}

export const generateVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => videoInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    const cost = videoCost(data.quality, data.durationSeconds);
    let ledgerId: string | null = null;
    let jobId: string | null = null;
    let dailyQuotaConsumed = false;

    try {
      if (!(await operationalSwitchEnabled(supabase, "video_enabled"))) throw new Error("video_fast_not_allowed");
      if (data.quality === "quality" && !(await operationalSwitchEnabled(supabase, "video_quality_enabled"))) throw new Error("video_quality_not_allowed");
      const processingCount = await countProcessingJobs(userId);
      if (processingCount >= PROCESSING_LIMIT_PER_USER) throw new Error("too_many_processing_video_jobs");
      const campaignPack = await assertCampaignPackOwner(supabase, userId, data.campaignPackId);

      const dailyQuota = await consumeVideoDailyQuota(supabase, data.quality, data.durationSeconds);
      dailyQuotaConsumed = true;

      const charge = await consume(supabase, cost, "consume_video", {
        quality: data.quality,
        aspect_ratio: data.aspectRatio,
        duration_seconds: data.durationSeconds,
        daily_video_used: dailyQuota.used,
        daily_video_cap: dailyQuota.cap,
        provider: "replicate",
        credit_scope: "video",
        ...campaignMetadata(campaignPack),
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
          estimated_cost_usd: VIDEO_ESTIMATED_COST_USD[data.quality][data.durationSeconds],
          metadata: { ...campaignMetadata(campaignPack), model: VIDEO_MODEL_BY_QUALITY[data.quality], duration_aware_pricing: true },
        })
        .select("*")
        .single();

      if (insertError || !inserted) throw new Error(`فشل إنشاء مهمة الفيديو: ${insertError?.message ?? "استجابة فارغة"}`);
      const job = inserted as VideoJobRow;
      jobId = job.id;

      const prediction = await createReplicatePrediction(data);
      if (prediction.status === "failed" || prediction.status === "canceled") {
        throw new Error("فشل مزوّد الفيديو أثناء إنشاء المهمة");
      }
      if (prediction.status === "succeeded" && !prediction.resultUrl) {
        throw new Error("فشل مزوّد الفيديو: لم يتم إرجاع رابط الفيديو النهائي");
      }

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
      const refundLedgerId = ledgerId ? await refund(supabaseAdmin, ledgerId, "video_generation_failed") : null;
      const effectiveRefundLedgerId = refundLedgerId ?? (ledgerId ? await getRefundLedgerId(supabaseAdmin, ledgerId) : null);
      if (dailyQuotaConsumed && (!ledgerId || refundLedgerId)) await releaseVideoDailyQuota(supabaseAdmin, userId);
      if (jobId) {
        await markProcessingJobRefunded({
          jobId,
          refundLedgerId: effectiveRefundLedgerId,
          errorMessage: publicVideoError(e).message,
          metadata: {
            failure_stage: "generate_video",
            original_error: e instanceof Error ? e.message.slice(0, 500) : String(e).slice(0, 500),
            refund_ledger_id: effectiveRefundLedgerId,
          },
        });
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

    const createdAt = new Date(row.created_at).getTime();
    const isStale = Number.isFinite(createdAt) && Date.now() - createdAt > MAX_PROCESSING_MINUTES * 60_000;
    if (isStale) {
      const refundLedgerId = row.ledger_id ? await refund(supabaseAdmin, row.ledger_id, "video_generation_timeout") : null;
      const effectiveRefundLedgerId = refundLedgerId ?? (row.ledger_id ? await getRefundLedgerId(supabaseAdmin, row.ledger_id) : null);
      if (refundLedgerId) await releaseVideoDailyQuota(supabaseAdmin, userId);
      const updated = await markProcessingJobRefunded({
        jobId: row.id,
        refundLedgerId: effectiveRefundLedgerId,
        errorMessage: "تأخر توليد الفيديو أكثر من المتوقع، وتم رد النقاط تلقائياً.",
      });
      return { job: updated };
    }

    let prediction: Awaited<ReturnType<typeof getReplicatePrediction>>;
    try {
      prediction = await getReplicatePrediction(row.provider_job_id);
    } catch (e) {
      await supabaseAdmin
        .from("video_jobs")
        .update({
          metadata: {
            ...(row.metadata as Record<string, unknown> | null),
            last_check_error: e instanceof Error ? e.message.slice(0, 500) : String(e).slice(0, 500),
            last_checked_at: new Date().toISOString(),
          },
        })
        .eq("id", row.id);
      throw publicVideoError(e);
    }
    if (!TERMINAL_PROVIDER_STATUSES.has(prediction.status)) {
      await supabaseAdmin
        .from("video_jobs")
        .update({ metadata: { ...(row.metadata as Record<string, unknown> | null), provider_status: prediction.status, last_checked_at: new Date().toISOString() } })
        .eq("id", row.id);
    }
    if (prediction.status === "failed" || prediction.status === "canceled") {
      const refundLedgerId = row.ledger_id ? await refund(supabaseAdmin, row.ledger_id, "video_generation_failed") : null;
      const effectiveRefundLedgerId = refundLedgerId ?? (row.ledger_id ? await getRefundLedgerId(supabaseAdmin, row.ledger_id) : null);
      if (refundLedgerId) await releaseVideoDailyQuota(supabaseAdmin, userId);
      const updated = await markProcessingJobRefunded({
        jobId: row.id,
        refundLedgerId: effectiveRefundLedgerId,
        errorMessage: prediction.error ?? "فشل توليد الفيديو لدى المزود",
      });
      return { job: updated };
    }

    if (prediction.status === "succeeded" && prediction.resultUrl) {
      const updated = await markProcessingJobCompleted({
        jobId: row.id,
        resultUrl: prediction.resultUrl,
        metadata: { ...(row.metadata as Record<string, unknown> | null), provider_status: prediction.status },
      });
      return { job: updated };
    }

    return { job: row };
  });
