import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  consume,
  getRefundLedgerId,
  operationalSwitchEnabled,
  refund,
  videoCost,
  type VideoQuality,
  type VideoDuration,
  InsufficientCreditsError,
} from "./credits";
import { PLAN_CREDIT_POLICY, isValidVideoTierSelection } from "@/lib/plan-catalog";
import { SAUDI_VIDEO_LAUNCH_TEMPLATE_IDS, SAUDI_VIDEO_MEDIUM_TEST_TEMPLATE_IDS, buildSaudiVideoMediumTestSample, withSaudiPromptAdherence } from "@/lib/saudi-video-test";

const MAX_PROCESSING_MINUTES = 20;
const PROCESSING_LIMIT_PER_USER = 2;
const TERMINAL_PROVIDER_STATUSES = new Set(["succeeded", "failed", "canceled"]);

const DEFAULT_ESTIMATED_COST_USD: Record<VideoQuality, number> = {
  fast: 0.2,
  lite: 0.25,
  quality: 0.45,
};

function estimatedVideoCostUsd(quality: VideoQuality, durationSeconds: VideoDuration) {
  if (!isValidVideoTierSelection(quality, durationSeconds)) throw new Error("invalid_video_tier_duration");
  return DEFAULT_ESTIMATED_COST_USD[quality];
}

type DbClient = SupabaseClient<Database>;
type VideoJobRow = Database["public"]["Tables"]["video_jobs"]["Row"];
type VideoProviderMode = "api" | "bridge" | "manual";
type ProviderStatus = "succeeded" | "processing" | "failed" | "canceled";

type VideoProviderConfig = {
  provider_key: string;
  display_name_admin: string;
  enabled: boolean;
  public_enabled: boolean;
  supported_qualities: string[];
  priority: number;
  cost_5s: number;
  cost_8s: number;
  supports_9_16: boolean;
  supports_1_1: boolean;
  supports_16_9: boolean;
  supports_starting_frame: boolean;
  mode: VideoProviderMode;
  health_status: string;
  metadata: Record<string, unknown> | null;
};

type ProviderCreateResult = {
  providerJobId: string | null;
  status: ProviderStatus;
  resultUrl: string | null;
  manualRequired?: boolean;
  estimatedCostUsd?: number | null;
  metadata?: Record<string, unknown>;
};

type ProviderRefreshResult = {
  status: ProviderStatus;
  resultUrl: string | null;
  error?: string | null;
  metadata?: Record<string, unknown>;
};

type ProviderAttempt = {
  provider: string;
  ok: boolean;
  status?: ProviderStatus | "skipped";
  mode?: VideoProviderMode;
  priority?: number;
  started_at: string;
  finished_at: string;
  latency_ms: number;
  provider_job_id?: string | null;
  manual_required?: boolean;
  error?: string;
  reason?: string;
};

type VideoInput = z.infer<typeof videoInputSchema> & { watermarkRequired?: boolean };

type VideoEntitlement = {
  video_fast_allowed: boolean;
  video_quality_allowed: boolean;
  max_video_duration_seconds: number;
};

type VideoProvider = {
  key: string;
  createJob(input: VideoInput, config: VideoProviderConfig): Promise<ProviderCreateResult>;
  refreshJob(providerJobId: string, row: VideoJobRow): Promise<ProviderRefreshResult>;
};

async function getVideoEntitlement(db: DbClient): Promise<VideoEntitlement> {
  const { data, error } = await db.rpc("plan_entitlement_for_user");
  if (error) throw new Error(`فشل التحقق من صلاحيات الفيديو: ${error.message}`);
  const row = data as VideoEntitlement | null;
  return {
    video_fast_allowed: row?.video_fast_allowed ?? false,
    video_quality_allowed: row?.video_quality_allowed ?? false,
    max_video_duration_seconds: row?.max_video_duration_seconds ?? 5,
  };
}

function assertVideoEntitlement(entitlement: VideoEntitlement, input: z.infer<typeof videoInputSchema>) {
  if (!isValidVideoTierSelection(input.quality, input.durationSeconds)) throw new Error("invalid_video_tier_duration");
  if (!entitlement.video_fast_allowed) throw new Error("video_fast_not_allowed");
  if (input.quality === "quality" && !entitlement.video_quality_allowed) throw new Error("video_quality_not_allowed");
  if (input.durationSeconds > entitlement.max_video_duration_seconds) throw new Error("video_duration_not_allowed");
}

function mediumTestSampleFromInput(input: Pick<z.infer<typeof videoInputSchema>, "source" | "mediumTestSampleId">) {
  if (input.source !== "medium-test" || !input.mediumTestSampleId) return null;
  const sampleNumber = Number(input.mediumTestSampleId.replace("pilot-", ""));
  if (!Number.isInteger(sampleNumber) || sampleNumber < 1 || sampleNumber > SAUDI_VIDEO_MEDIUM_TEST_TEMPLATE_IDS.length) return null;
  return buildSaudiVideoMediumTestSample(sampleNumber - 1);
}

function assertProductImagePolicy(plan: string | null | undefined, input: z.infer<typeof videoInputSchema>) {
  if (input.source === "medium-test") {
    const sample = mediumTestSampleFromInput(input);
    if (sample?.requiresProductImage && !input.productImageUrl) throw new Error("product_image_required_for_medium_test_video");
    return;
  }
  if (PLAN_CREDIT_POLICY.paidPlansRequireProductImageForVideo && plan && plan !== "free" && !input.productImageUrl) {
    throw new Error("product_image_required_for_paid_video");
  }
}

function assertLaunchTemplatePolicy(templateId?: string, source?: "medium-test", mediumTestTemplateId?: string, mediumTestSampleId?: string, quality?: VideoQuality, durationSeconds?: VideoDuration, aspectRatio?: string, selectedPersonaId?: string, prompt?: string) {
  if (source === "medium-test") {
    if (templateId !== "custom") throw new Error("invalid_medium_test_template");
    if (!mediumTestTemplateId || !mediumTestSampleId) throw new Error("invalid_medium_test_template");
    const sampleIndex = SAUDI_VIDEO_MEDIUM_TEST_TEMPLATE_IDS.findIndex((id) => id === mediumTestTemplateId);
    const expectedSampleId = sampleIndex >= 0 ? `pilot-${String(sampleIndex + 1).padStart(2, "0")}` : null;
    if (!expectedSampleId || mediumTestSampleId !== expectedSampleId) throw new Error("invalid_medium_test_template");
    const expectedSample = buildSaudiVideoMediumTestSample(sampleIndex);
    if (quality !== expectedSample.quality || durationSeconds !== expectedSample.durationSeconds || aspectRatio !== expectedSample.expectedAspectRatio || selectedPersonaId !== expectedSample.personaId) {
      throw new Error("invalid_medium_test_template");
    }
    if (prompt?.trim() !== expectedSample.finalPrompt.trim()) {
      throw new Error("invalid_medium_test_prompt");
    }
    return "custom";
  }
  if (!templateId) return "custom";
  if ((SAUDI_VIDEO_LAUNCH_TEMPLATE_IDS as readonly string[]).includes(templateId)) return templateId;
  throw new Error("video_template_not_publicly_approved");
}

class ProviderCommittedFailure extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderCommittedFailure";
  }
}

const videoInputSchema = z.object({
  prompt: z.string().trim().min(10, "اكتب وصف فيديو أوضح").max(1800, "وصف الفيديو طويل جداً"),
  quality: z.enum(["fast", "lite", "quality"]),
  aspectRatio: z.enum(["9:16", "1:1", "16:9"]).default("9:16"),
  durationSeconds: z.union([z.literal(5), z.literal(8)]).default(5),
  startingFrameUrl: z.string().url().optional().or(z.literal("")),
  speakerImageUrl: z.string().url().optional().or(z.literal("")),
  productImageUrl: z.string().url().optional().or(z.literal("")),
  selectedPersonaId: z.string().trim().max(80).optional().or(z.literal("")),
  selectedTemplateId: z.string().trim().max(100).optional().or(z.literal("")),
  campaignPackId: z.string().uuid().optional(),
  source: z.enum(["medium-test"]).optional(),
  mediumTestSampleId: z.string().trim().max(40).optional().or(z.literal("")),
  mediumTestTemplateId: z.string().trim().max(100).optional().or(z.literal("")),
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
    return new Error(`INSUFFICIENT_CREDITS: رصيد نقاط الفيديو لا يكفي (تحتاج ${e.required} نقطة فيديو). اشحن نقاط فيديو إضافية أو رقّ باقتك.`);
  }
  return e instanceof Error ? e : new Error(String(e));
}

function publicVideoError(e: unknown): Error {
  const msg = e instanceof Error ? e.message : String(e);
  if (/video_fast_not_allowed/i.test(msg)) return new Error("VIDEO_NOT_ALLOWED: الفيديو غير متاح في باقتك الحالية. رقّ الباقة أو اشحن نقاطاً بعد التفعيل.");
  if (/video_quality_not_allowed/i.test(msg)) return new Error("VIDEO_QUALITY_NOT_ALLOWED: الجودة الاحترافية متاحة في باقات Pro وBusiness.");
  if (/video_duration_not_allowed/i.test(msg)) return new Error("VIDEO_DURATION_NOT_ALLOWED: مدة 8 ثوانٍ غير متاحة في باقتك الحالية.");
  if (/product_image_required_for_medium_test_video/i.test(msg)) return new Error("PRODUCT_IMAGE_REQUIRED: صورة المنتج إلزامية لهذه العينة الداخلية حتى يكون اختبار الالتزام عادلاً وقابلاً للاعتماد.");
  if (/product_image_required_for_paid_video/i.test(msg)) return new Error("PRODUCT_IMAGE_REQUIRED: صورة المنتج مطلوبة في الباقات المدفوعة حتى يظهر المنتج بوضوح داخل الإعلان.");
  if (/video_template_not_publicly_approved/i.test(msg)) return new Error("VIDEO_TEMPLATE_LOCKED: هذا القالب ما زال احتياطياً ولن يُفتح قبل اكتمال بيانات الاستخدام الفعلية.");
  if (/invalid_medium_test_prompt/i.test(msg)) return new Error("VIDEO_TEMPLATE_LOCKED: برومبت الاختبار الداخلي غير مطابق للمصفوفة المعتمدة.");
  if (/invalid_medium_test_template/i.test(msg)) return new Error("VIDEO_TEMPLATE_LOCKED: معرف قالب الاختبار الداخلي غير مطابق للمصفوفة المعتمدة.");
  if (/invalid_video_tier_duration/i.test(msg)) return new Error("VIDEO_DURATION_NOT_ALLOWED: اختر سريع 5 ثوانٍ أو إعلاني/احترافي 8 ثوانٍ فقط.");
  if (/INSUFFICIENT_CREDITS|insufficient_credits/i.test(msg)) return videoCreditError(e);
  if (/too_many_processing_video_jobs/i.test(msg)) return new Error("لديك مهمتا فيديو قيد المعالجة حالياً. انتظر اكتمال إحداهما قبل إنشاء فيديو جديد.");
  if (/no_video_provider_available|إعداد مزوّد الفيديو غير مكتمل/i.test(msg)) return new Error("خدمة الفيديو غير جاهزة حالياً. جرّب لاحقاً أو تواصل مع الدعم.");
  if (/فشل مزوّد الفيديو|provider|prediction|fetch failed/i.test(msg)) return new Error("تعذر الاتصال بخدمة الفيديو حالياً. تم حفظ الحالة ورد النقاط عند الحاجة.");
  return e instanceof Error ? e : new Error("فشل تنفيذ عملية الفيديو");
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500);
}

function personaPrompt(personaId?: string) {
  return ({
    "male-young": "متحدث سعودي شاب بثوب أبيض وشماغ أبيض، أسلوب UGC طبيعي وموثوق.",
    "male-premium": "رجل سعودي أنيق بثوب رسمي وشماغ أحمر، أسلوب إعلان فاخر وواثق.",
    "female-abaya": "متحدثة سعودية بعباءة وحجاب، أسلوب راقٍ ومحتشم مناسب للتجارة الإلكترونية.",
    "retail-seller": "بائع سعودي داخل متجر حديث، أسلوب توصية منتج مباشر ودافئ.",
  } as Record<string, string>)[personaId ?? ""] ?? "";
}

function buildSaudiVideoPrompt(input: VideoInput) {
  const persona = personaPrompt(input.selectedPersonaId);
  const imageBrief = [
    input.speakerImageUrl ? "استخدم صورة الشخص كمرجع للشخصية المتحدثة." : persona,
    input.productImageUrl ? "اجعل صورة المنتج مرجعاً واضحاً للمنتج داخل الإعلان." : "",
  ].filter(Boolean).join(" ");
  const prompt = [
    "إعلان فيديو سعودي قصير عالي التحويل للسوق السعودي. صوت عربي سعودي واضح وطبيعي إذا كان الصوت مدعوماً. بنية الإعلان: خطاف قوي، فائدة ملموسة، لقطة منتج جذابة، دعوة إجراء مباشرة. حافظ على مظهر محتشم وواقعي وابتعد عن المبالغة غير الموثوقة.",
    imageBrief,
    input.prompt,
    input.watermarkRequired ? "أضف علامة مائية صغيرة ونظيفة بحروف لاتينية فقط: RIFD في الزاوية السفلية، بدون أي نص عربي داخل الفيديو." : "",
  ].filter(Boolean).join("\n\n");
  return withSaudiPromptAdherence(prompt);
}

function primaryReferenceImage(input: VideoInput) {
  return input.productImageUrl || input.speakerImageUrl || input.startingFrameUrl || undefined;
}

function mergeMetadata(current: Json | null | undefined, patch?: Record<string, unknown>) {
  return { ...((current as Record<string, unknown> | null) ?? {}), ...(patch ?? {}) } as Json;
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

function providerSupports(config: VideoProviderConfig, input: z.infer<typeof videoInputSchema>) {
  const supportsQuality = config.supported_qualities.includes(input.quality);
  const supportsAspect =
    (input.aspectRatio === "9:16" && config.supports_9_16) ||
    (input.aspectRatio === "1:1" && config.supports_1_1) ||
    (input.aspectRatio === "16:9" && config.supports_16_9);
  const needsReferenceImage = Boolean(input.startingFrameUrl || input.speakerImageUrl || input.productImageUrl);
  const needsTwoImages = Boolean(input.speakerImageUrl && input.productImageUrl);
  const canCollapseToPrimaryImage = config.provider_key === "fal_ai" && config.metadata?.model_family === "pixverse_v6";
  const supportsTwoImages = !needsTwoImages || canCollapseToPrimaryImage || ((config.metadata?.supports_two_images as boolean | undefined) === true);
  const supportsFrame = !needsReferenceImage || config.supports_starting_frame;
  const cost = input.durationSeconds === 8 ? config.cost_8s : config.cost_5s;
  return config.enabled && config.public_enabled && supportsQuality && supportsAspect && supportsFrame && supportsTwoImages && cost > 0;
}

function providerPriorityScore(config: VideoProviderConfig) {
  const healthPenalty = config.health_status === "unhealthy" ? 10_000 : config.health_status === "inactive" ? 20_000 : 0;
  return config.priority + healthPenalty;
}

async function loadProviderConfigs(input: z.infer<typeof videoInputSchema>) {
  const { data, error } = await (supabaseAdmin as unknown as {
    from: (table: string) => {
      select: (columns: string) => { eq: (column: string, value: unknown) => { order: (column: string, opts: { ascending: boolean }) => Promise<{ data: unknown; error: { message: string } | null }> } };
    };
  })
    .from("video_provider_configs")
    .select("provider_key, display_name_admin, enabled, public_enabled, supported_qualities, priority, cost_5s, cost_8s, supports_9_16, supports_1_1, supports_16_9, supports_starting_frame, mode, health_status, metadata")
    .eq("enabled", true)
    .order("priority", { ascending: true });

  if (error) {
    console.error(`video_provider_configs read failed: ${error.message}`);
    return [];
  }

  const rows = ((data as VideoProviderConfig[] | null) ?? [])
    .filter((config) => providerSupports(config, input))
    .sort((a, b) => providerPriorityScore(a) - providerPriorityScore(b));
  return rows;
}

async function markProviderFailure(providerKey: string, error: unknown) {
  await (supabaseAdmin as unknown as { from: (table: string) => { update: (values: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<{ error: { message: string } | null }> } } })
    .from("video_provider_configs")
    .update({
      health_status: "unhealthy",
      last_error_at: new Date().toISOString(),
      last_error_message: error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500),
    })
    .eq("provider_key", providerKey);
}

function videoDurationPayload(durationSeconds: VideoDuration) {
  return durationSeconds;
}

async function markProviderSuccess(providerKey: string) {
  await (supabaseAdmin as unknown as { from: (table: string) => { update: (values: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<{ error: { message: string } | null }> } } })
    .from("video_provider_configs")
    .update({ health_status: "active", last_success_at: new Date().toISOString(), last_error_message: null })
    .eq("provider_key", providerKey);
}

const FAL_MODEL_BY_QUALITY: Record<VideoQuality, string> = {
  fast: "fal-ai/pixverse/v6/image-to-video",
  lite: "fal-ai/pixverse/v6/image-to-video",
  quality: "fal-ai/pixverse/v6/image-to-video",
};

const PIXVERSE_RESOLUTION_BY_QUALITY: Record<VideoQuality, string> = {
  fast: "360p",
  lite: "540p",
  quality: "720p",
};

const PIXVERSE_NEGATIVE_PROMPT = "distorted face, deformed hands, extra fingers, unreadable Arabic text, misspelled text, western clothing, immodest styling, unrealistic product, duplicated product, plain white cutout background, shaky low quality footage, exaggerated claims";

const falProvider: VideoProvider = {
  key: "fal_ai",
  async createJob(input) {
    const token = process.env.FAL_API_KEY;
    if (!token) throw new Error("إعداد مزوّد الفيديو غير مكتمل");
    const model = FAL_MODEL_BY_QUALITY[input.quality];
      const finalProviderPrompt = buildSaudiVideoPrompt(input);
      const response = await fetch(`https://fal.run/${model}`, {
      method: "POST",
      headers: { Authorization: `Key ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
          prompt: finalProviderPrompt,
        aspect_ratio: input.aspectRatio,
        duration: videoDurationPayload(input.durationSeconds),
        resolution: PIXVERSE_RESOLUTION_BY_QUALITY[input.quality],
        image_url: primaryReferenceImage(input),
        negative_prompt: PIXVERSE_NEGATIVE_PROMPT,
        generate_audio_switch: true,
        generate_multi_clip_switch: input.quality !== "fast",
        thinking_type: input.quality === "fast" ? "auto" : "enabled",
      }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`فشل مزوّد الفيديو (${response.status}): ${text.slice(0, 300)}`);
    }
    const result = await response.json() as { request_id?: string; video?: { url?: string }; video_url?: string; url?: string; status?: string; error?: string };
    if (result.error) throw new Error(`فشل مزوّد الفيديو: ${result.error}`);
    const resultUrl = result.video?.url ?? result.video_url ?? result.url ?? null;
    return { providerJobId: result.request_id ?? null, status: resultUrl ? "succeeded" : "processing", resultUrl, estimatedCostUsd: estimatedVideoCostUsd(input.quality, input.durationSeconds), metadata: { model, resolution: PIXVERSE_RESOLUTION_BY_QUALITY[input.quality], audio_requested: true, final_provider_prompt: finalProviderPrompt, prompt_adherence_required: true, fal_result_shape: Object.keys(result) } };
  },
  async refreshJob(_providerJobId, row) {
    return { status: row.result_url ? "succeeded" : "processing", resultUrl: row.result_url };
  },
};

function futureApiProvider(key: string, secretName: string): VideoProvider {
  return {
    key,
    async createJob() {
      if (!process.env[secretName]) throw new Error(`إعداد مزوّد الفيديو غير مكتمل: ${secretName}`);
      throw new Error(`provider_not_implemented:${key}`);
    },
    async refreshJob() {
      if (!process.env[secretName]) throw new Error(`إعداد مزوّد الفيديو غير مكتمل: ${secretName}`);
      throw new Error(`provider_refresh_not_implemented:${key}`);
    },
  };
}

const PROVIDERS: Record<string, VideoProvider> = {
  fal_ai: falProvider,
  runway: futureApiProvider("runway", "RUNWAY_API_KEY"),
  luma: futureApiProvider("luma", "LUMA_API_KEY"),
  kling: futureApiProvider("kling", "KLING_API_KEY"),
};

async function createProviderJob(input: VideoInput, jobId: string) {
  const configs = await loadProviderConfigs(input);
  const attempts: ProviderAttempt[] = [];

  for (const config of configs) {
    const startedAt = new Date();
    const provider = PROVIDERS[config.provider_key];
    if (!provider) {
      attempts.push({
        provider: config.provider_key,
        ok: false,
        status: "skipped",
        mode: config.mode,
        priority: config.priority,
        started_at: startedAt.toISOString(),
        finished_at: new Date().toISOString(),
        latency_ms: 0,
        reason: "provider_not_implemented",
      });
      continue;
    }

    try {
      const result = await provider.createJob(input, config);
      if (result.status === "failed" || result.status === "canceled") {
        const message = "فشل مزوّد الفيديو أثناء إنشاء المهمة";
        throw result.providerJobId ? new ProviderCommittedFailure(message) : new Error(message);
      }
      if (result.status === "succeeded" && !result.resultUrl) {
        const message = "فشل مزوّد الفيديو: لم يتم إرجاع رابط الفيديو النهائي";
        throw result.providerJobId ? new ProviderCommittedFailure(message) : new Error(message);
      }
      await markProviderSuccess(config.provider_key);
      const finishedAt = new Date();
      return {
        config,
        result,
        attempts: [
          ...attempts,
          {
            provider: config.provider_key,
            ok: true,
            status: result.status,
            mode: config.mode,
            priority: config.priority,
            started_at: startedAt.toISOString(),
            finished_at: finishedAt.toISOString(),
            latency_ms: finishedAt.getTime() - startedAt.getTime(),
            provider_job_id: result.providerJobId,
            manual_required: result.manualRequired === true,
          },
        ],
      };
    } catch (error) {
      const finishedAt = new Date();
      const committed = error instanceof ProviderCommittedFailure;
      attempts.push({
        provider: config.provider_key,
        ok: false,
        status: "failed",
        mode: config.mode,
        priority: config.priority,
        started_at: startedAt.toISOString(),
        finished_at: finishedAt.toISOString(),
        latency_ms: finishedAt.getTime() - startedAt.getTime(),
        error: errorMessage(error),
        reason: committed ? "provider_job_committed" : "pre_submit_or_create_failed",
      });
      await markProviderFailure(config.provider_key, error);
      const { data: current } = await supabaseAdmin.from("video_jobs").select("metadata").eq("id", jobId).maybeSingle();
      await supabaseAdmin.from("video_jobs").update({ metadata: mergeMetadata(current?.metadata, { provider_attempts: attempts, last_attempt_at: finishedAt.toISOString(), failover_halted: committed }) }).eq("id", jobId);
      if (committed) throw error;
    }
  }

  throw new Error("no_video_provider_available");
}

async function markProcessingJobRefunded(params: { jobId: string; refundLedgerId: string | null; errorMessage: string; metadata?: Record<string, unknown> }) {
  const { data: currentMetadataRow } = await supabaseAdmin.from("video_jobs").select("metadata").eq("id", params.jobId).maybeSingle();
  const updatePayload: Database["public"]["Tables"]["video_jobs"]["Update"] = {
    status: "refunded",
    error_message: params.errorMessage,
    ...(params.refundLedgerId ? { refund_ledger_id: params.refundLedgerId } : {}),
    metadata: mergeMetadata(currentMetadataRow?.metadata, params.metadata),
  };

  const { data, error } = await supabaseAdmin.from("video_jobs").update(updatePayload).eq("id", params.jobId).eq("status", "processing").select("*").maybeSingle();
  if (error) throw new Error(`فشل تحديث مهمة الفيديو: ${error.message}`);
  if (data) return data as VideoJobRow;

  const { data: current, error: readError } = await supabaseAdmin.from("video_jobs").select("*").eq("id", params.jobId).single();
  if (readError || !current) throw new Error(`فشل جلب مهمة الفيديو بعد الاسترداد: ${readError?.message ?? "غير موجودة"}`);
  return current as VideoJobRow;
}

async function markProcessingJobCompleted(params: { jobId: string; resultUrl: string; metadata?: Record<string, unknown> }) {
  const { data: currentMetadataRow } = await supabaseAdmin.from("video_jobs").select("metadata").eq("id", params.jobId).maybeSingle();
  const { data, error } = await supabaseAdmin
    .from("video_jobs")
    .update({ status: "completed", result_url: params.resultUrl, completed_at: new Date().toISOString(), metadata: mergeMetadata(currentMetadataRow?.metadata, params.metadata) })
    .eq("id", params.jobId)
    .eq("status", "processing")
    .select("*")
    .maybeSingle();

  if (error) throw new Error(`فشل تحديث مهمة الفيديو: ${error.message}`);
  if (data) return data as VideoJobRow;

  const { data: current, error: readError } = await supabaseAdmin.from("video_jobs").select("*").eq("id", params.jobId).single();
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

    try {
      if (!(await operationalSwitchEnabled(supabase, "video_enabled"))) throw new Error("video_fast_not_allowed");
      if (data.quality === "quality" && !(await operationalSwitchEnabled(supabase, "video_quality_enabled"))) throw new Error("video_quality_not_allowed");
      const entitlement = await getVideoEntitlement(supabase);
      assertVideoEntitlement(entitlement, data);
      const { data: profile } = await supabase.from("profiles").select("plan").eq("id", userId).maybeSingle();
      assertProductImagePolicy(profile?.plan, data);
      const processingCount = await countProcessingJobs(userId);
      if (processingCount >= PROCESSING_LIMIT_PER_USER) throw new Error("too_many_processing_video_jobs");
      const campaignPack = await assertCampaignPackOwner(supabase, userId, data.campaignPackId);
      const baseMetadata = campaignMetadata(campaignPack);
      const selectedTemplateId = assertLaunchTemplatePolicy(data.selectedTemplateId, data.source, data.mediumTestTemplateId, data.mediumTestSampleId, data.quality, data.durationSeconds, data.aspectRatio, data.selectedPersonaId, data.prompt);
      const mediumTestMetadata = data.source === "medium-test"
        ? {
            source: "admin_medium_video_test",
            medium_test: true,
            medium_test_sample_id: data.mediumTestSampleId || null,
            medium_test_template_id: data.mediumTestTemplateId || null,
            medium_test_product_image_required: mediumTestSampleFromInput(data)?.requiresProductImage ?? false,
          }
        : {};
      const watermarkRequired = profile?.plan === "free";
      const productImageRequired = data.source === "medium-test" ? (mediumTestSampleFromInput(data)?.requiresProductImage ?? false) : profile?.plan !== "free";
      const providerInput = { ...data, watermarkRequired } satisfies VideoInput;

      const charge = await consume(supabase, cost, "consume_video", {
        quality: data.quality,
        aspect_ratio: data.aspectRatio,
        duration_seconds: data.durationSeconds,
        credit_scope: "video",
        ...baseMetadata,
        ...mediumTestMetadata,
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
          speaker_image_url: data.speakerImageUrl || null,
          product_image_url: data.productImageUrl || null,
          selected_persona_id: data.selectedPersonaId || null,
          credits_charged: cost,
          ledger_id: ledgerId,
          status: "processing",
          provider: "router",
          estimated_cost_usd: estimatedVideoCostUsd(data.quality, data.durationSeconds),
          metadata: { ...baseMetadata, ...mediumTestMetadata, router_version: 2, duration_aware_pricing: true, saudi_prompt_layer: true, selected_template_id: selectedTemplateId, launch_template: selectedTemplateId !== "custom", plan_credit_rollover: false, watermark_required: watermarkRequired, watermark_strategy: watermarkRequired ? "provider_prompt_overlay" : "none", product_image_required: productImageRequired, prompt_adherence_required: true, prompt_adherence_gate: "80%+" },
        })
        .select("*")
        .single();

      if (insertError || !inserted) throw new Error(`فشل إنشاء مهمة الفيديو: ${insertError?.message ?? "استجابة فارغة"}`);
      const job = inserted as VideoJobRow;
      jobId = job.id;

      const routed = await createProviderJob(providerInput, job.id);
      const finalStatus = routed.result.resultUrl ? "completed" : "processing";
      const metadata = {
        ...(job.metadata as Record<string, unknown> | null),
        ...(routed.result.metadata ?? {}),
        provider_attempts: routed.attempts,
        provider_status: routed.result.status,
        provider_mode: routed.config.mode,
        manual_required: routed.result.manualRequired === true,
      };

      const { data: updated, error: updateError } = await supabaseAdmin
        .from("video_jobs")
        .update({
          provider: routed.config.provider_key,
          provider_job_id: routed.result.providerJobId,
          result_url: routed.result.resultUrl,
          status: finalStatus,
          completed_at: finalStatus === "completed" ? new Date().toISOString() : null,
          estimated_cost_usd: routed.result.estimatedCostUsd ?? estimatedVideoCostUsd(data.quality, data.durationSeconds),
          metadata: metadata as Json,
        })
        .eq("id", job.id)
        .select("*")
        .single();

      if (updateError || !updated) throw new Error(`فشل تحديث مهمة الفيديو: ${updateError?.message ?? "استجابة فارغة"}`);

      return { job: updated as VideoJobRow, creditsCharged: cost, remainingTotal: charge.remainingTotal, pending: finalStatus === "processing" };
    } catch (e) {
      const refundLedgerId = ledgerId ? await refund(supabaseAdmin, ledgerId, "video_generation_failed") : null;
      const effectiveRefundLedgerId = refundLedgerId ?? (ledgerId ? await getRefundLedgerId(supabaseAdmin, ledgerId) : null);
      if (jobId) {
        const { data: failedJob } = await supabaseAdmin.from("video_jobs").select("metadata").eq("id", jobId).maybeSingle();
        await markProcessingJobRefunded({
          jobId,
          refundLedgerId: effectiveRefundLedgerId,
          errorMessage: publicVideoError(e).message,
          metadata: {
            ...((failedJob?.metadata as Record<string, unknown> | null) ?? {}),
            failure_stage: "generate_video",
            original_error: errorMessage(e),
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
    const { data, error } = await supabase.from("video_jobs").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20);
    if (error) throw new Error(`فشل جلب الفيديوهات: ${error.message}`);
    return { jobs: (data as VideoJobRow[] | null) ?? [] };
  });

export const refreshVideoJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ jobId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    const { data: job, error } = await supabase.from("video_jobs").select("*").eq("id", data.jobId).eq("user_id", userId).single();
    if (error || !job) throw new Error(`فشل جلب مهمة الفيديو: ${error?.message ?? "غير موجودة"}`);
    const row = job as VideoJobRow;
    if (row.status !== "processing") return { job: row };
    if (!row.provider_job_id) return { job: row };

    const createdAt = new Date(row.created_at).getTime();
    const isStale = Number.isFinite(createdAt) && Date.now() - createdAt > MAX_PROCESSING_MINUTES * 60_000;
    if (isStale) {
      const refundLedgerId = row.ledger_id ? await refund(supabaseAdmin, row.ledger_id, "video_generation_timeout") : null;
      const effectiveRefundLedgerId = refundLedgerId ?? (row.ledger_id ? await getRefundLedgerId(supabaseAdmin, row.ledger_id) : null);
      const updated = await markProcessingJobRefunded({ jobId: row.id, refundLedgerId: effectiveRefundLedgerId, errorMessage: "تأخر توليد الفيديو أكثر من المتوقع، وتم رد النقاط تلقائياً." });
      return { job: updated };
    }

    const provider = PROVIDERS[row.provider];
    if (!provider) throw new Error("مزود الفيديو المستخدم في هذه المهمة لم يعد مدعوماً");
    let prediction: ProviderRefreshResult;
    try {
      prediction = await provider.refreshJob(row.provider_job_id, row);
      await markProviderSuccess(row.provider);
    } catch (e) {
      await markProviderFailure(row.provider, e);
      await supabaseAdmin
        .from("video_jobs")
        .update({ metadata: mergeMetadata(row.metadata, { last_check_error: errorMessage(e), last_checked_at: new Date().toISOString() }) })
        .eq("id", row.id);
      throw publicVideoError(e);
    }

    if (!TERMINAL_PROVIDER_STATUSES.has(prediction.status)) {
      await supabaseAdmin
        .from("video_jobs")
        .update({ metadata: mergeMetadata(row.metadata, { ...(prediction.metadata ?? {}), provider_status: prediction.status, last_checked_at: new Date().toISOString() }) })
        .eq("id", row.id);
    }

    if (prediction.status === "failed" || prediction.status === "canceled") {
      const refundLedgerId = row.ledger_id ? await refund(supabaseAdmin, row.ledger_id, "video_generation_failed") : null;
      const effectiveRefundLedgerId = refundLedgerId ?? (row.ledger_id ? await getRefundLedgerId(supabaseAdmin, row.ledger_id) : null);
      const updated = await markProcessingJobRefunded({ jobId: row.id, refundLedgerId: effectiveRefundLedgerId, errorMessage: prediction.error ?? "فشل توليد الفيديو لدى المزود" });
      return { job: updated };
    }

    if (prediction.status === "succeeded" && prediction.resultUrl) {
      const updated = await markProcessingJobCompleted({ jobId: row.id, resultUrl: prediction.resultUrl, metadata: { ...(row.metadata as Record<string, unknown> | null), ...(prediction.metadata ?? {}), provider_status: prediction.status } });
      return { job: updated };
    }

    return { job: row };
  });
