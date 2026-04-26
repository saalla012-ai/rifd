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

const MAX_PROCESSING_MINUTES = 20;
const PROCESSING_LIMIT_PER_USER = 2;
const TERMINAL_PROVIDER_STATUSES = new Set(["succeeded", "failed", "canceled"]);

const REPLICATE_MODEL_BY_QUALITY: Record<VideoQuality, string> = {
  fast: "google/veo-3-fast",
  lite: "google/veo-3-fast",
  quality: "google/veo-3",
};

const DEFAULT_ESTIMATED_COST_USD: Record<VideoQuality, Record<VideoDuration, number>> = {
  fast: { 5: 0.5, 8: 0.8 },
  lite: { 5: 0.8, 8: 1.2 },
  quality: { 5: 2.0, 8: 3.2 },
};

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

type VideoEntitlement = {
  video_fast_allowed: boolean;
  video_quality_allowed: boolean;
  max_video_duration_seconds: number;
};

type VideoProvider = {
  key: string;
  createJob(input: z.infer<typeof videoInputSchema>, config: VideoProviderConfig): Promise<ProviderCreateResult>;
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
  if (!entitlement.video_fast_allowed) throw new Error("video_fast_not_allowed");
  if (input.quality === "quality" && !entitlement.video_quality_allowed) throw new Error("video_quality_not_allowed");
  if (input.durationSeconds > entitlement.max_video_duration_seconds) throw new Error("video_duration_not_allowed");
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
    return new Error(`INSUFFICIENT_CREDITS: رصيد نقاط الفيديو لا يكفي (تحتاج ${e.required} نقطة فيديو). اشحن نقاط فيديو إضافية أو رقّ باقتك.`);
  }
  return e instanceof Error ? e : new Error(String(e));
}

function publicVideoError(e: unknown): Error {
  const msg = e instanceof Error ? e.message : String(e);
  if (/video_fast_not_allowed/i.test(msg)) return new Error("VIDEO_NOT_ALLOWED: الفيديو غير متاح في باقتك الحالية. رقّ الباقة أو اشحن نقاطاً بعد التفعيل.");
  if (/video_quality_not_allowed/i.test(msg)) return new Error("VIDEO_QUALITY_NOT_ALLOWED: الجودة الاحترافية متاحة في باقات Pro وBusiness.");
  if (/video_duration_not_allowed/i.test(msg)) return new Error("VIDEO_DURATION_NOT_ALLOWED: مدة 8 ثوانٍ غير متاحة في باقتك الحالية.");
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

function buildSaudiVideoPrompt(input: z.infer<typeof videoInputSchema>) {
  const persona = personaPrompt(input.selectedPersonaId);
  const imageBrief = [
    input.speakerImageUrl ? "استخدم صورة الشخص كمرجع للشخصية المتحدثة." : persona,
    input.productImageUrl ? "اجعل صورة المنتج مرجعاً واضحاً للمنتج داخل الإعلان." : "",
  ].filter(Boolean).join(" ");
  return [
    "إعلان فيديو سعودي قصير عالي التحويل للسوق السعودي. صوت عربي سعودي واضح وطبيعي إذا كان الصوت مدعوماً. بنية الإعلان: خطاف قوي، فائدة ملموسة، لقطة منتج جذابة، دعوة إجراء مباشرة. حافظ على مظهر محتشم وواقعي وابتعد عن المبالغة غير الموثوقة.",
    imageBrief,
    input.prompt,
  ].filter(Boolean).join("\n\n");
}

function primaryReferenceImage(input: z.infer<typeof videoInputSchema>) {
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
  const supportsTwoImages = !needsTwoImages || ((config.metadata?.supports_two_images as boolean | undefined) === true);
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
    return [defaultReplicateConfig()];
  }

  const rows = ((data as VideoProviderConfig[] | null) ?? [])
    .filter((config) => providerSupports(config, input))
    .sort((a, b) => providerPriorityScore(a) - providerPriorityScore(b));
  return rows.length > 0 ? rows : [defaultReplicateConfig()].filter((config) => providerSupports(config, input));
}

function defaultReplicateConfig(): VideoProviderConfig {
  return {
    provider_key: "replicate",
    display_name_admin: "Replicate / Google Veo via Replicate",
    enabled: true,
    public_enabled: true,
    supported_qualities: ["fast", "lite", "quality"],
    priority: 10,
    cost_5s: 150,
    cost_8s: 240,
    supports_9_16: true,
    supports_1_1: true,
    supports_16_9: true,
    supports_starting_frame: true,
    mode: "api",
    health_status: "active",
    metadata: { fallback: true },
  };
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
  return durationSeconds === 8 ? "8s" : "5s";
}

async function markProviderSuccess(providerKey: string) {
  await (supabaseAdmin as unknown as { from: (table: string) => { update: (values: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<{ error: { message: string } | null }> } } })
    .from("video_provider_configs")
    .update({ health_status: "active", last_success_at: new Date().toISOString(), last_error_message: null })
    .eq("provider_key", providerKey);
}

const replicateProvider: VideoProvider = {
  key: "replicate",
  async createJob(input) {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) throw new Error("إعداد مزوّد الفيديو غير مكتمل");

    const model = REPLICATE_MODEL_BY_QUALITY[input.quality];
    const response = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: "wait=60" },
      body: JSON.stringify({
        input: {
          prompt: buildSaudiVideoPrompt(input),
          aspect_ratio: input.aspectRatio,
          duration: input.durationSeconds,
          image: primaryReferenceImage(input),
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`فشل مزوّد الفيديو (${response.status}): ${text.slice(0, 300)}`);
    }

    const prediction = await response.json() as { id?: string; status?: string; output?: string | string[]; error?: string };
    if (prediction.error) throw new Error(`فشل مزوّد الفيديو: ${prediction.error}`);
    const output = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    return {
      providerJobId: prediction.id ?? null,
      status: (prediction.status ?? "processing") as ProviderStatus,
      resultUrl: typeof output === "string" ? output : null,
      estimatedCostUsd: DEFAULT_ESTIMATED_COST_USD[input.quality][input.durationSeconds],
      metadata: { model },
    };
  },
  async refreshJob(providerJobId) {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) throw new Error("إعداد مزوّد الفيديو غير مكتمل");
    const response = await fetch(`https://api.replicate.com/v1/predictions/${providerJobId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`فشل تحديث حالة الفيديو (${response.status}): ${text.slice(0, 300)}`);
    }
    const prediction = await response.json() as { status?: string; output?: string | string[]; error?: string };
    const output = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    return { status: (prediction.status ?? "processing") as ProviderStatus, resultUrl: typeof output === "string" ? output : null, error: prediction.error };
  },
};

const FAL_MODEL_BY_QUALITY: Record<VideoQuality, string> = {
  fast: "fal-ai/veo3/fast",
  lite: "fal-ai/veo3/fast",
  quality: "fal-ai/veo3",
};

const falProvider: VideoProvider = {
  key: "fal_ai",
  async createJob(input) {
    const token = process.env.FAL_API_KEY;
    if (!token) throw new Error("إعداد مزوّد الفيديو غير مكتمل");
    const model = FAL_MODEL_BY_QUALITY[input.quality];
    const response = await fetch(`https://fal.run/${model}`, {
      method: "POST",
      headers: { Authorization: `Key ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: buildSaudiVideoPrompt(input),
        aspect_ratio: input.aspectRatio,
        duration: videoDurationPayload(input.durationSeconds),
        image_url: primaryReferenceImage(input),
        speaker_image_url: input.speakerImageUrl || undefined,
        product_image_url: input.productImageUrl || undefined,
      }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`فشل مزوّد الفيديو (${response.status}): ${text.slice(0, 300)}`);
    }
    const result = await response.json() as { request_id?: string; video?: { url?: string }; video_url?: string; url?: string; status?: string; error?: string };
    if (result.error) throw new Error(`فشل مزوّد الفيديو: ${result.error}`);
    const resultUrl = result.video?.url ?? result.video_url ?? result.url ?? null;
    return { providerJobId: result.request_id ?? null, status: resultUrl ? "succeeded" : "processing", resultUrl, estimatedCostUsd: DEFAULT_ESTIMATED_COST_USD[input.quality][input.durationSeconds], metadata: { model, fal_result_shape: Object.keys(result) } };
  },
  async refreshJob(_providerJobId, row) {
    return { status: row.result_url ? "succeeded" : "processing", resultUrl: row.result_url };
  },
};

const manualBridgeProvider: VideoProvider = {
  key: "google_flow_bridge",
  async createJob(_input, config) {
    return {
      providerJobId: null,
      status: "processing",
      resultUrl: null,
      manualRequired: true,
      estimatedCostUsd: null,
      metadata: { mode: config.mode, manual_required: true },
    };
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
  replicate: replicateProvider,
  google_flow_bridge: manualBridgeProvider,
  google_veo_api: futureApiProvider("google_veo_api", "GOOGLE_VEO_API_KEY"),
  runway: futureApiProvider("runway", "RUNWAY_API_KEY"),
  luma: futureApiProvider("luma", "LUMA_API_KEY"),
  kling: futureApiProvider("kling", "KLING_API_KEY"),
};

async function createProviderJob(input: z.infer<typeof videoInputSchema>, jobId: string) {
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
      assertVideoEntitlement(await getVideoEntitlement(supabase), data);
      const processingCount = await countProcessingJobs(userId);
      if (processingCount >= PROCESSING_LIMIT_PER_USER) throw new Error("too_many_processing_video_jobs");
      const campaignPack = await assertCampaignPackOwner(supabase, userId, data.campaignPackId);
      const baseMetadata = campaignMetadata(campaignPack);

      const charge = await consume(supabase, cost, "consume_video", {
        quality: data.quality,
        aspect_ratio: data.aspectRatio,
        duration_seconds: data.durationSeconds,
        credit_scope: "video",
        ...baseMetadata,
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
          estimated_cost_usd: DEFAULT_ESTIMATED_COST_USD[data.quality][data.durationSeconds],
          metadata: { ...baseMetadata, router_version: 2, duration_aware_pricing: true, saudi_prompt_layer: true },
        })
        .select("*")
        .single();

      if (insertError || !inserted) throw new Error(`فشل إنشاء مهمة الفيديو: ${insertError?.message ?? "استجابة فارغة"}`);
      const job = inserted as VideoJobRow;
      jobId = job.id;

      const routed = await createProviderJob(data, job.id);
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
          estimated_cost_usd: routed.result.estimatedCostUsd ?? DEFAULT_ESTIMATED_COST_USD[data.quality][data.durationSeconds],
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

    const provider = PROVIDERS[row.provider] ?? replicateProvider;
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
