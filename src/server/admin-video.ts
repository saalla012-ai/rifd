import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertAdmin, logAdminAudit, type DbClient } from "@/server/admin-auth";
import type { Database, Json } from "@/integrations/supabase/types";
import { isValidVideoTierSelection } from "@/lib/plan-catalog";
import { FAL_VIDEO_TEST_MODELS, SAUDI_VIDEO_PERSONAS, SAUDI_VIDEO_TEST_SCENARIOS, buildSaudiFalTestPrompt, evaluateSaudiVideoImage } from "@/lib/saudi-video-test";

const ListAdminVideoJobsInput = z.object({
  status: z.enum(["all", "pending", "processing", "completed", "failed", "refunded"]).default("all"),
  limit: z.number().int().min(1).max(300).default(100),
});

const ProviderUpdateInput = z.object({
  providerKey: z.string().min(2).max(80),
  enabled: z.boolean().optional(),
  publicEnabled: z.boolean().optional(),
  priority: z.number().int().min(1).max(1000).optional(),
  cost5s: z.number().int().min(0).max(100000).optional(),
  cost8s: z.number().int().min(0).max(100000).optional(),
});

const TestProviderInput = z.object({
  providerKey: z.string().min(2).max(80),
});

const SaudiFalPromptPreviewInput = z.object({
  modelId: z.string().min(3).max(180).default("fal-ai/pixverse/v6/image-to-video"),
  personaId: z.enum(["male-young", "male-premium", "female-abaya", "retail-seller"]).default("male-young"),
  scenarioId: z.enum(["perfume", "abaya", "arabic-coffee", "electronics"]).default("perfume"),
  includeProductImage: z.boolean().default(true),
  includeVoice: z.boolean().default(true),
});

const SaudiFalModelTestInput = SaudiFalPromptPreviewInput.extend({
  personaImageUrl: z.string().url().max(2000),
  productImageUrl: z.string().url().max(2000).optional().or(z.literal("")),
});

const TestVideoRouterInput = z.object({
  quality: z.enum(["fast", "lite", "quality"]).default("fast"),
  aspectRatio: z.enum(["9:16", "1:1", "16:9"]).default("9:16"),
  durationSeconds: z.union([z.literal(5), z.literal(8)]).default(5),
  hasStartingFrame: z.boolean().default(false),
  imageCount: z.union([z.literal(0), z.literal(1), z.literal(2)]).default(0),
});

const CompleteManualVideoJobInput = z.object({
  jobId: z.string().uuid(),
  resultUrl: z.string().trim().url().max(2000),
});

const RefundVideoJobInput = z.object({
  jobId: z.string().uuid(),
  reason: z.string().trim().min(3).max(240).default("تعذر تنفيذ مهمة الفيديو يدوياً"),
});

type VideoJobStatus = Database["public"]["Enums"]["video_job_status"];
type VideoJobRow = Database["public"]["Tables"]["video_jobs"]["Row"];

export type AdminVideoJob = {
  id: string;
  user_id: string;
  user_email: string | null;
  user_store: string | null;
  prompt: string;
  quality: "fast" | "lite" | "quality";
  aspect_ratio: string;
  duration_seconds: number;
  status: VideoJobStatus;
  provider: string;
  provider_job_id: string | null;
  result_url: string | null;
  error_message: string | null;
  credits_charged: number;
  estimated_cost_usd: number | null;
  ledger_id: string | null;
  refund_ledger_id: string | null;
  metadata: Json | null;
  created_at: string;
  completed_at: string | null;
};

export type AdminVideoStats = {
  total: number;
  processing: number;
  completed: number;
  refunded: number;
  failed: number;
  creditsCharged: number;
  estimatedCostUsd: number;
};

type ProviderAttempt = {
  provider?: string;
  ok?: boolean;
  status?: string;
  latency_ms?: number;
  finished_at?: string;
  error?: string;
  reason?: string;
};

export type AdminVideoProviderConfig = {
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
  supports_two_images?: boolean;
  supports_voice?: boolean;
  mode: "api" | "bridge" | "manual";
  health_status: "active" | "inactive" | "testing" | "manual_required" | "unhealthy";
  last_success_at: string | null;
  last_error_at: string | null;
  last_error_message: string | null;
  metadata: Json;
  updated_at: string;
};

export type AdminVideoProviderAttemptSummary = {
  provider: string;
  total: number;
  success: number;
  failed: number;
  successRate: number;
  failureRate: number;
  avgLatencyMs: number | null;
  topError: string | null;
  lastStatus: string | null;
  lastAt: string | null;
};

export type AdminVideoProviderTestResult = {
  providerKey: string;
  ok: boolean;
  status: "active" | "manual_required" | "unhealthy";
  latencyMs: number;
  message: string;
  checkedAt: string;
};

export type SaudiFalPromptPreview = {
  prompt: string;
  model: typeof FAL_VIDEO_TEST_MODELS[number];
  persona: typeof SAUDI_VIDEO_PERSONAS[number];
  scenario: typeof SAUDI_VIDEO_TEST_SCENARIOS[number];
  imageEvaluation: { score: number; recommendation: string };
};

export type SaudiFalModelTestResult = SaudiFalPromptPreview & {
  ok: boolean;
  status: "submitted" | "completed" | "failed";
  requestId: string | null;
  resultUrl: string | null;
  latencyMs: number;
  estimatedCostUsd: number | null;
  error: string | null;
  checkedAt: string;
};

export type AdminVideoRouterTestResult = {
  ok: boolean;
  selectedProvider: string | null;
  checkedAt: string;
  candidates: Array<{ providerKey: string; displayName: string; priority: number; effectivePriority: number; mode: string; eligible: boolean; reason: string }>;
};

export type SaudiVideoPilotAuditResult = {
  checkedAt: string;
  totalTemplates: number;
  passCount: number;
  passRate: number;
  readyForPilot: boolean;
  sectorCoverage: string[];
  riskMix: Record<string, number>;
  findings: Array<{ templateId: string; label: string; sector: string; risk: string; score: number; issues: string[]; recommendation: string }>;
};

function toAdminVideoJob(row: VideoJobRow, profile?: { email: string | null; store_name: string | null } | null): AdminVideoJob {
  return {
    ...row,
    quality: row.quality as "fast" | "lite" | "quality",
    estimated_cost_usd: row.estimated_cost_usd === null ? null : Number(row.estimated_cost_usd),
    user_email: profile?.email ?? null,
    user_store: profile?.store_name ?? null,
  };
}

function isManualBridgeJob(row: VideoJobRow): boolean {
  const metadata = (row.metadata as Record<string, unknown> | null) ?? {};
  return row.provider === "google_flow_bridge" || metadata.manual_required === true;
}

function appendProviderAttempt(metadata: Json | null, attempt: ProviderAttempt) {
  const base = (metadata as Record<string, unknown> | null) ?? {};
  const attempts = Array.isArray(base.provider_attempts) ? base.provider_attempts : [];
  return {
    ...base,
    provider_attempts: [...attempts, { ...attempt, finished_at: new Date().toISOString() }],
    last_attempt_at: new Date().toISOString(),
  } as Json;
}

function appendConnectionTest(metadata: Json | null, result: AdminVideoProviderTestResult) {
  const base = (metadata as Record<string, unknown> | null) ?? {};
  const tests = Array.isArray(base.connection_tests) ? base.connection_tests.slice(-9) : [];
  return { ...base, connection_tests: [...tests, result], last_connection_test_at: result.checkedAt } as Json;
}

function providerEligibleForInput(provider: AdminVideoProviderConfig, input: z.infer<typeof TestVideoRouterInput>) {
  if (!isValidVideoTierSelection(input.quality, input.durationSeconds)) return { eligible: false, reason: "تركيبة الجودة/المدة غير معتمدة" };
  if (!provider.enabled) return { eligible: false, reason: "متوقف داخلياً" };
  if (!provider.public_enabled) return { eligible: false, reason: "غير متاح للطلبات" };
  if (!provider.supported_qualities.includes(input.quality)) return { eligible: false, reason: "الجودة غير مدعومة" };
  if (input.aspectRatio === "9:16" && !provider.supports_9_16) return { eligible: false, reason: "مقاس 9:16 غير مدعوم" };
  if (input.aspectRatio === "1:1" && !provider.supports_1_1) return { eligible: false, reason: "مقاس 1:1 غير مدعوم" };
  if (input.aspectRatio === "16:9" && !provider.supports_16_9) return { eligible: false, reason: "مقاس 16:9 غير مدعوم" };
  if (input.hasStartingFrame && !provider.supports_starting_frame) return { eligible: false, reason: "صورة البداية غير مدعومة" };
  if (input.imageCount > 0 && !provider.supports_starting_frame) return { eligible: false, reason: "مراجع الصور غير مدعومة" };
  if (input.imageCount > 1 && (provider.metadata as { supports_two_images?: boolean } | null)?.supports_two_images !== true) return { eligible: false, reason: "صورتان غير مدعومتين" };
  const cost = input.durationSeconds === 8 ? provider.cost_8s : provider.cost_5s;
  if (cost <= 0) return { eligible: false, reason: "تكلفة المدة غير مضبوطة" };
  return { eligible: true, reason: provider.health_status === "unhealthy" ? "مؤهل لكن مؤخر بسبب حالة غير صحية" : "جاهز للراوتر" };
}

function providerPriorityScore(provider: AdminVideoProviderConfig) {
  const healthPenalty = provider.health_status === "unhealthy" ? 10_000 : provider.health_status === "inactive" ? 20_000 : 0;
  return provider.priority + healthPenalty;
}

function providerSecretName(providerKey: string) {
  return ({
    fal_ai: "FAL_API_KEY",
    runway: "RUNWAY_API_KEY",
    luma: "LUMA_API_KEY",
    kling: "KLING_API_KEY",
  } as Record<string, string | undefined>)[providerKey];
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500);
}

async function refundVideoCreditsOnce(ledgerId: string | null) {
  if (!ledgerId) return { refundId: null as string | null, newlyRefunded: false };
  const { data: refundId, error } = await supabaseAdmin.rpc("refund_credits", { _ledger_id: ledgerId, _reason: "manual_video_refund" });
  if (!error) return { refundId: refundId as string, newlyRefunded: true };
  if (!/already_refunded/i.test(error.message)) throw new Error(`فشل رد النقاط: ${error.message}`);

  const { data: ledger } = await supabaseAdmin.from("credit_ledger").select("refund_ledger_id").eq("id", ledgerId).maybeSingle();
  return { refundId: ledger?.refund_ledger_id ?? null, newlyRefunded: false };
}

export const listAdminVideoJobs = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ListAdminVideoJobsInput.parse(input ?? {}))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<{ rows: AdminVideoJob[]; stats: AdminVideoStats }> => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    await assertAdmin(supabase, userId);

    let q = supabaseAdmin
      .from("video_jobs")
      .select("id, user_id, prompt, quality, aspect_ratio, duration_seconds, status, provider, provider_job_id, result_url, error_message, credits_charged, estimated_cost_usd, ledger_id, refund_ledger_id, metadata, created_at, completed_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (data.status !== "all") q = q.eq("status", data.status);

    const { data: rows, error } = await q;
    if (error) throw new Error(`فشل جلب مهام الفيديو: ${error.message}`);

    const userIds = Array.from(new Set((rows ?? []).map((r) => r.user_id)));
    const { data: profs } = userIds.length
      ? await supabaseAdmin.from("profiles").select("id, email, store_name").in("id", userIds)
      : { data: [] as { id: string; email: string | null; store_name: string | null }[] };
    const profMap = new Map((profs ?? []).map((p) => [p.id, p]));

    const statusList = ["processing", "completed", "refunded", "failed"] as const;
    const counts: Record<string, number> = { processing: 0, completed: 0, refunded: 0, failed: 0 };
    await Promise.all(
      statusList.map(async (status) => {
        const { count } = await supabaseAdmin.from("video_jobs").select("id", { count: "exact", head: true }).eq("status", status);
        counts[status] = count ?? 0;
      })
    );

    const { count: totalCount } = await supabaseAdmin.from("video_jobs").select("id", { count: "exact", head: true });
    const statsRows = rows ?? [];
    const stats: AdminVideoStats = {
      total: totalCount ?? statsRows.length,
      processing: counts.processing,
      completed: counts.completed,
      refunded: counts.refunded,
      failed: counts.failed,
      creditsCharged: statsRows.reduce((sum, r) => sum + (r.credits_charged ?? 0), 0),
      estimatedCostUsd: statsRows.reduce((sum, r) => sum + Number(r.estimated_cost_usd ?? 0), 0),
    };

    return {
      stats,
      rows: statsRows.map((r) => toAdminVideoJob(r as VideoJobRow, profMap.get(r.user_id))),
    };
  });

export const listVideoProviderConfigs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ providers: AdminVideoProviderConfig[] }> => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    await assertAdmin(supabase, userId);

    const { data, error } = await (supabaseAdmin as unknown as {
      from: (table: string) => { select: (columns: string) => { order: (column: string, opts: { ascending: boolean }) => Promise<{ data: unknown; error: { message: string } | null }> } };
    })
      .from("video_provider_configs")
      .select("provider_key, display_name_admin, enabled, public_enabled, supported_qualities, priority, cost_5s, cost_8s, supports_9_16, supports_1_1, supports_16_9, supports_starting_frame, mode, health_status, last_success_at, last_error_at, last_error_message, metadata, updated_at")
      .order("priority", { ascending: true });

    if (error) throw new Error(`فشل جلب إعدادات مزودي الفيديو: ${error.message}`);
    return { providers: (data as AdminVideoProviderConfig[] | null) ?? [] };
  });

export const listVideoProviderAttemptSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ attempts: AdminVideoProviderAttemptSummary[] }> => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    await assertAdmin(supabase, userId);

    const { data, error } = await supabaseAdmin
      .from("video_jobs")
      .select("provider, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(`فشل جلب سجل محاولات المزودين: ${error.message}`);

    const byProvider = new Map<string, { total: number; success: number; failed: number; latency: number[]; errors: Map<string, number>; lastStatus: string | null; lastAt: string | null }>();
    for (const row of data ?? []) {
      const metadata = (row.metadata as Record<string, unknown> | null) ?? {};
      const attempts = Array.isArray(metadata.provider_attempts) ? metadata.provider_attempts as ProviderAttempt[] : [{ provider: row.provider, ok: undefined, status: String(metadata.provider_status ?? "unknown"), finished_at: row.created_at }];
      for (const attempt of attempts) {
        const key = attempt.provider || row.provider || "unknown";
        const current = byProvider.get(key) ?? { total: 0, success: 0, failed: 0, latency: [], errors: new Map<string, number>(), lastStatus: null, lastAt: null };
        current.total += 1;
        if (attempt.ok === true) current.success += 1;
        if (attempt.ok === false) current.failed += 1;
        if (attempt.ok === false && attempt.error) current.errors.set(attempt.error, (current.errors.get(attempt.error) ?? 0) + 1);
        if (typeof attempt.latency_ms === "number" && Number.isFinite(attempt.latency_ms)) current.latency.push(attempt.latency_ms);
        const finishedAt = attempt.finished_at ?? row.created_at;
        if (!current.lastAt || new Date(finishedAt).getTime() > new Date(current.lastAt).getTime()) {
          current.lastAt = finishedAt;
          current.lastStatus = attempt.status ?? null;
        }
        byProvider.set(key, current);
      }
    }

    return {
      attempts: Array.from(byProvider.entries()).map(([provider, item]) => {
        const topError = Array.from(item.errors.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
        return {
          provider,
          total: item.total,
          success: item.success,
          failed: item.failed,
          successRate: item.total ? Math.round((item.success / item.total) * 100) : 0,
          failureRate: item.total ? Math.round((item.failed / item.total) * 100) : 0,
          avgLatencyMs: item.latency.length ? Math.round(item.latency.reduce((sum, value) => sum + value, 0) / item.latency.length) : null,
          topError,
          lastStatus: item.lastStatus,
          lastAt: item.lastAt,
        };
      }).sort((a, b) => b.total - a.total),
    };
  });

export const updateVideoProviderConfig = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ProviderUpdateInput.parse(input))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<{ provider: AdminVideoProviderConfig }> => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    await assertAdmin(supabase, userId);

    const patch: Record<string, unknown> = {};
    if (typeof data.enabled === "boolean") patch.enabled = data.enabled;
    if (typeof data.publicEnabled === "boolean") patch.public_enabled = data.publicEnabled;
    if (typeof data.priority === "number") patch.priority = data.priority;
    if (typeof data.cost5s === "number") patch.cost_5s = data.cost5s;
    if (typeof data.cost8s === "number") patch.cost_8s = data.cost8s;
    if (Object.keys(patch).length === 0) throw new Error("لا توجد تغييرات للحفظ");

    const { data: updated, error } = await (supabaseAdmin as unknown as {
      from: (table: string) => { update: (values: Record<string, unknown>) => { eq: (column: string, value: string) => { select: (columns: string) => { single: () => Promise<{ data: unknown; error: { message: string } | null }> } } } };
    })
      .from("video_provider_configs")
      .update(patch)
      .eq("provider_key", data.providerKey)
      .select("provider_key, display_name_admin, enabled, public_enabled, supported_qualities, priority, cost_5s, cost_8s, supports_9_16, supports_1_1, supports_16_9, supports_starting_frame, mode, health_status, last_success_at, last_error_at, last_error_message, metadata, updated_at")
      .single();

    if (error || !updated) throw new Error(`فشل حفظ إعدادات المزود: ${error?.message ?? "استجابة فارغة"}`);
    await logAdminAudit({
      adminId: userId,
      action: "update_video_provider_config",
      targetTable: "video_provider_configs",
      targetId: data.providerKey,
      after: patch as Json,
    });
    return { provider: updated as AdminVideoProviderConfig };
  });

export const testVideoProviderConnection = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TestProviderInput.parse(input))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<{ provider: AdminVideoProviderConfig; result: AdminVideoProviderTestResult }> => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    await assertAdmin(supabase, userId);

    const { data: current, error: readError } = await (supabaseAdmin as unknown as {
      from: (table: string) => { select: (columns: string) => { eq: (column: string, value: string) => { single: () => Promise<{ data: unknown; error: { message: string } | null }> } } };
    })
      .from("video_provider_configs")
      .select("provider_key, display_name_admin, enabled, public_enabled, supported_qualities, priority, cost_5s, cost_8s, supports_9_16, supports_1_1, supports_16_9, supports_starting_frame, mode, health_status, last_success_at, last_error_at, last_error_message, metadata, updated_at")
      .eq("provider_key", data.providerKey)
      .single();
    if (readError || !current) throw new Error(`فشل جلب المزود: ${readError?.message ?? "غير موجود"}`);

    const provider = current as AdminVideoProviderConfig;
    const startedAt = Date.now();
    const checkedAt = new Date().toISOString();
    let result: AdminVideoProviderTestResult;

    if (!provider.enabled) {
      result = { providerKey: provider.provider_key, ok: false, status: "unhealthy", latencyMs: Date.now() - startedAt, message: "المزود متوقف داخلياً", checkedAt };
    } else if (provider.mode === "manual" || provider.mode === "bridge") {
      result = { providerKey: provider.provider_key, ok: true, status: "manual_required", latencyMs: Date.now() - startedAt, message: "الجسر اليدوي جاهز ويحتاج تنفيذ بشري عند الطلب", checkedAt };
    } else if (providerSecretName(provider.provider_key)) {
      const secretName = providerSecretName(provider.provider_key)!;
      const tokenReady = Boolean(process.env[secretName]);
      const implemented = provider.provider_key === "fal_ai";
      result = {
        providerKey: provider.provider_key,
        ok: tokenReady && implemented,
        status: tokenReady && implemented ? "active" : "unhealthy",
        latencyMs: Date.now() - startedAt,
        message: !tokenReady ? `مفتاح ${secretName} غير متوفر` : implemented ? "مفتاح المزود موجود والراوتر قادر على استخدامه" : "المفتاح موجود لكن موصل التنفيذ لم يُفعّل بعد",
        checkedAt,
      };
    } else {
      result = { providerKey: provider.provider_key, ok: false, status: "unhealthy", latencyMs: Date.now() - startedAt, message: "المزود غير موصول براوتر التنفيذ بعد", checkedAt };
    }

    const patch = {
      health_status: result.status,
      last_success_at: result.ok ? result.checkedAt : provider.last_success_at,
      last_error_at: result.ok ? null : result.checkedAt,
      last_error_message: result.ok ? null : result.message,
      metadata: appendConnectionTest(provider.metadata, result),
    };

    const { data: updated, error } = await (supabaseAdmin as unknown as {
      from: (table: string) => { update: (values: Record<string, unknown>) => { eq: (column: string, value: string) => { select: (columns: string) => { single: () => Promise<{ data: unknown; error: { message: string } | null }> } } } };
    })
      .from("video_provider_configs")
      .update(patch)
      .eq("provider_key", provider.provider_key)
      .select("provider_key, display_name_admin, enabled, public_enabled, supported_qualities, priority, cost_5s, cost_8s, supports_9_16, supports_1_1, supports_16_9, supports_starting_frame, mode, health_status, last_success_at, last_error_at, last_error_message, metadata, updated_at")
      .single();
    if (error || !updated) throw new Error(`فشل حفظ نتيجة الاختبار: ${error?.message ?? "استجابة فارغة"}`);

    await logAdminAudit({ adminId: userId, action: "test_video_provider_connection", targetTable: "video_provider_configs", targetId: provider.provider_key, after: result as unknown as Json });
    return { provider: updated as AdminVideoProviderConfig, result };
  });

export const previewSaudiFalVideoTestPrompt = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SaudiFalPromptPreviewInput.parse(input ?? {}))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<SaudiFalPromptPreview> => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    await assertAdmin(supabase, userId);

    const model = FAL_VIDEO_TEST_MODELS.find((item) => item.id === data.modelId) ?? FAL_VIDEO_TEST_MODELS[0];
    const persona = SAUDI_VIDEO_PERSONAS.find((item) => item.id === data.personaId) ?? SAUDI_VIDEO_PERSONAS[0];
    const scenario = SAUDI_VIDEO_TEST_SCENARIOS.find((item) => item.id === data.scenarioId) ?? SAUDI_VIDEO_TEST_SCENARIOS[0];
    const prompt = buildSaudiFalTestPrompt({ personaBrief: persona.brief, scenarioId: scenario.id, includeProductImage: data.includeProductImage, includeVoice: data.includeVoice && model.supportsVoice });
    const imageEvaluation = evaluateSaudiVideoImage({ hasProductImage: data.includeProductImage, personaLabel: persona.label });

    return { prompt, model, persona, scenario, imageEvaluation };
  });

export const runSaudiFalVideoModelTest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SaudiFalModelTestInput.parse(input ?? {}))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<SaudiFalModelTestResult> => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    await assertAdmin(supabase, userId);
    const token = process.env.FAL_API_KEY;
    if (!token) throw new Error("مفتاح fal.ai غير متوفر في الأسرار");

    const model = FAL_VIDEO_TEST_MODELS.find((item) => item.id === data.modelId) ?? FAL_VIDEO_TEST_MODELS[0];
    const persona = SAUDI_VIDEO_PERSONAS.find((item) => item.id === data.personaId) ?? SAUDI_VIDEO_PERSONAS[0];
    const scenario = SAUDI_VIDEO_TEST_SCENARIOS.find((item) => item.id === data.scenarioId) ?? SAUDI_VIDEO_TEST_SCENARIOS[0];
    const includeProductImage = Boolean(data.includeProductImage && data.productImageUrl && model.supportsProductImage);
    const prompt = buildSaudiFalTestPrompt({ personaBrief: persona.brief, scenarioId: scenario.id, includeProductImage, includeVoice: data.includeVoice && model.supportsVoice });
    const imageEvaluation = evaluateSaudiVideoImage({ hasProductImage: includeProductImage, personaLabel: persona.label });
    const startedAt = Date.now();
    const checkedAt = new Date().toISOString();

    try {
      const response = await fetch(`https://fal.run/${model.id}`, {
        method: "POST",
        headers: { Authorization: `Key ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          aspect_ratio: "9:16",
          duration: "5s",
          resolution: "540p",
          image_url: includeProductImage ? data.productImageUrl : data.personaImageUrl,
          negative_prompt: "distorted face, deformed hands, unreadable Arabic text, white cutout background, unrealistic product",
          generate_audio_switch: model.supportsVoice,
          generate_multi_clip_switch: true,
          thinking_type: "enabled",
        }),
      });
      const text = await response.text();
      let result: { request_id?: string; video?: { url?: string }; video_url?: string; url?: string; error?: string } = {};
      try { result = text ? JSON.parse(text) as typeof result : {}; } catch { result = { error: text.slice(0, 500) }; }
      if (!response.ok || result.error) throw new Error(result.error || `fal.ai ${response.status}: ${text.slice(0, 500)}`);
      const resultUrl = result.video?.url ?? result.video_url ?? result.url ?? null;
      const out = { ok: true, status: resultUrl ? "completed" : "submitted", requestId: result.request_id ?? null, resultUrl, latencyMs: Date.now() - startedAt, estimatedCostUsd: model.estimatedUsd, error: null, checkedAt, prompt, model, persona, scenario, imageEvaluation } satisfies SaudiFalModelTestResult;
      await logAdminAudit({ adminId: userId, action: "run_saudi_fal_video_model_test", targetTable: "video_provider_configs", targetId: model.id, after: out as unknown as Json });
      return out;
    } catch (error) {
      const out = { ok: false, status: "failed", requestId: null, resultUrl: null, latencyMs: Date.now() - startedAt, estimatedCostUsd: model.estimatedUsd, error: errorMessage(error), checkedAt, prompt, model, persona, scenario, imageEvaluation } satisfies SaudiFalModelTestResult;
      await logAdminAudit({ adminId: userId, action: "run_saudi_fal_video_model_test_failed", targetTable: "video_provider_configs", targetId: model.id, after: out as unknown as Json });
      return out;
    }
  });

export const testVideoRouterDryRun = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TestVideoRouterInput.parse(input ?? {}))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<AdminVideoRouterTestResult> => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    await assertAdmin(supabase, userId);

    const { data: rows, error } = await (supabaseAdmin as unknown as {
      from: (table: string) => { select: (columns: string) => { order: (column: string, opts: { ascending: boolean }) => Promise<{ data: unknown; error: { message: string } | null }> } };
    })
      .from("video_provider_configs")
      .select("provider_key, display_name_admin, enabled, public_enabled, supported_qualities, priority, cost_5s, cost_8s, supports_9_16, supports_1_1, supports_16_9, supports_starting_frame, mode, health_status, last_success_at, last_error_at, last_error_message, metadata, updated_at")
      .order("priority", { ascending: true });
    if (error) throw new Error(`فشل اختبار الراوتر: ${error.message}`);

    const providers = ((rows as AdminVideoProviderConfig[] | null) ?? []).sort((a, b) => providerPriorityScore(a) - providerPriorityScore(b));
    const candidates = providers.map((provider) => {
      const readiness = providerEligibleForInput(provider, data);
      return { providerKey: provider.provider_key, displayName: provider.display_name_admin, priority: provider.priority, effectivePriority: providerPriorityScore(provider), mode: provider.mode, eligible: readiness.eligible, reason: readiness.reason };
    });
    const selected = candidates.find((candidate) => candidate.eligible) ?? null;
    const result = { ok: Boolean(selected), selectedProvider: selected?.providerKey ?? null, checkedAt: new Date().toISOString(), candidates };

    await logAdminAudit({ adminId: userId, action: "test_video_router_dry_run", targetTable: "video_provider_configs", targetId: selected?.providerKey ?? "none", after: result as unknown as Json });
    return result;
  });

export const completeManualVideoJob = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CompleteManualVideoJobInput.parse(input))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<{ job: AdminVideoJob }> => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    await assertAdmin(supabase, userId);

    const { data: current, error: readError } = await supabaseAdmin
      .from("video_jobs")
      .select("*")
      .eq("id", data.jobId)
      .single();
    if (readError || !current) throw new Error(`فشل جلب مهمة الفيديو: ${readError?.message ?? "غير موجودة"}`);
    if (current.status !== "processing") throw new Error("لا يمكن إكمال مهمة ليست قيد المعالجة");
    if (!isManualBridgeJob(current as VideoJobRow)) throw new Error("هذه المهمة ليست مخصصة للتنفيذ اليدوي");

    const metadata = {
      ...(appendProviderAttempt(current.metadata, { provider: current.provider, ok: true, status: "manual_completed" }) as Record<string, unknown>),
      manual_completed_by: userId,
      manual_completed_at: new Date().toISOString(),
      provider_status: "succeeded",
    };

    const { data: updated, error } = await supabaseAdmin
      .from("video_jobs")
      .update({ status: "completed", result_url: data.resultUrl, completed_at: new Date().toISOString(), error_message: null, metadata: metadata as Json })
      .eq("id", data.jobId)
      .eq("status", "processing")
      .select("*")
      .single();

    if (error || !updated) throw new Error(`فشل إكمال مهمة الفيديو: ${error?.message ?? "استجابة فارغة"}`);
    await logAdminAudit({ adminId: userId, action: "complete_manual_video_job", targetTable: "video_jobs", targetId: data.jobId, after: { result_url: data.resultUrl } as Json });
    return { job: toAdminVideoJob(updated as VideoJobRow) };
  });

export const refundManualVideoJob = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => RefundVideoJobInput.parse(input))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<{ job: AdminVideoJob }> => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    await assertAdmin(supabase, userId);

    const { data: current, error: readError } = await supabaseAdmin.from("video_jobs").select("*").eq("id", data.jobId).single();
    if (readError || !current) throw new Error(`فشل جلب مهمة الفيديو: ${readError?.message ?? "غير موجودة"}`);
    if (current.status !== "processing") throw new Error("لا يمكن رد نقاط مهمة ليست قيد المعالجة");
    if (!isManualBridgeJob(current as VideoJobRow)) throw new Error("هذه المهمة ليست مخصصة للتنفيذ اليدوي");

    const { refundId, newlyRefunded } = await refundVideoCreditsOnce(current.ledger_id);
    const metadata = {
      ...(appendProviderAttempt(current.metadata, { provider: current.provider, ok: false, status: "manual_refunded", error: data.reason }) as Record<string, unknown>),
      manual_refunded_by: userId,
      manual_refunded_at: new Date().toISOString(),
      manual_refund_reason: data.reason,
    };

    const { data: updated, error } = await supabaseAdmin
      .from("video_jobs")
      .update({ status: "refunded", refund_ledger_id: refundId ?? current.refund_ledger_id, error_message: data.reason, metadata: metadata as Json })
      .eq("id", data.jobId)
      .select("*")
      .single();

    if (error || !updated) throw new Error(`فشل تحديث المهمة بعد رد النقاط: ${error?.message ?? "استجابة فارغة"}`);
    await logAdminAudit({ adminId: userId, action: "refund_manual_video_job", targetTable: "video_jobs", targetId: data.jobId, after: { reason: data.reason, refund_ledger_id: refundId } as Json });
    return { job: toAdminVideoJob(updated as VideoJobRow) };
  });
