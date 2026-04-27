import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin, logAdminAudit, type DbClient } from "@/server/admin-auth";
import type { Database, Json } from "@/integrations/supabase/types";
import { isValidVideoTierSelection } from "@/lib/plan-catalog";
import { FAL_VIDEO_TEST_MODELS, SAUDI_VIDEO_LAUNCH_DECISION, SAUDI_VIDEO_LAUNCH_TEMPLATE_IDS, SAUDI_VIDEO_MEDIUM_TEST_PLAN, SAUDI_VIDEO_MEDIUM_TEST_TEMPLATE_IDS, SAUDI_VIDEO_PERSONAS, SAUDI_VIDEO_PROMPT_ADHERENCE_SCORECARD, SAUDI_VIDEO_PROMPT_TEMPLATES, SAUDI_VIDEO_TEST_SCENARIOS, buildSaudiFalTestPrompt, evaluateSaudiVideoImage, withSaudiPromptAdherence } from "@/lib/saudi-video-test";

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

const EvaluatePilotSampleInput = z.object({
  sampleId: z.enum(SAUDI_VIDEO_MEDIUM_TEST_TEMPLATE_IDS.map((_, index) => `pilot-${String(index + 1).padStart(2, "0")}`) as [string, ...string[]]),
  resultUrl: z.string().trim().url().max(2000).optional().or(z.literal("")),
  productClarity: z.number().int().min(1).max(5),
  sceneAdherence: z.number().int().min(1).max(5),
  motionAdherence: z.number().int().min(1).max(5),
  saudiDialect: z.number().int().min(1).max(5),
  negativeSafety: z.number().int().min(1).max(5),
  publishReadiness: z.number().int().min(1).max(5),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});


async function getSupabaseAdmin() {
  const mod = await import("@/integrations/supabase/client.server");
  return mod.supabaseAdmin;
}

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

export type SaudiLaunchTemplatePerformance = {
  templateId: string;
  total: number;
  completed: number;
  processing: number;
  refunded: number;
  failed: number;
  publishableRate: number;
  failureRate: number;
  avgCostUsd: number | null;
  minSampleReached: boolean;
  expansionEligible: boolean;
  decision: "collecting" | "watch" | "eligible";
  gateNotes: string[];
  lastAt: string | null;
};

const LAUNCH_TEMPLATE_MIN_SAMPLE_SIZE = 20;
const LAUNCH_TEMPLATE_MAX_FAILURE_RATE = 12;
const LAUNCH_TEMPLATE_MAX_AVG_COST_USD = 0.5;

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

export type SaudiVideoPilotMatrixResult = {
  checkedAt: string;
  testLevel: "medium" | "full";
  totalSamples: number;
  estimatedCostUsd: number;
  requiredPublishableRate: number;
  readinessGate: string;
  samples: Array<{
    sampleId: string;
    templateId: string;
    label: string;
    sector: string;
    personaId: string;
    personaLabel: string;
    quality: "fast" | "lite" | "quality";
    durationSeconds: 5 | 8;
    expectedAspectRatio: "9:16" | "1:1" | "16:9";
    requiresProductImage: boolean;
    objective: string;
    technicalGate: string[];
    mustPass: string[];
    scorecard: string[];
    promptAdherenceGate: string;
      finalPrompt: string;
      generationPayload: {
        prompt: string;
        quality: "fast" | "lite" | "quality";
        aspectRatio: "9:16" | "1:1" | "16:9";
        durationSeconds: 5 | 8;
        selectedPersonaId: string;
        selectedTemplateId: "custom";
        requiresProductImage: boolean;
      };
  }>;
};

export type SaudiVideoPilotEvaluationResult = {
  sampleId: string;
  resultUrl?: string;
  productClarity: number;
  sceneAdherence: number;
  motionAdherence: number;
  saudiDialect: number;
  negativeSafety: number;
  publishReadiness: number;
  notes?: string;
  score: number;
  decision: "publishable" | "minor_revision" | "reject_or_reprompt";
  gateReason: string;
  evaluatedAt: string;
};

export type SaudiVideoMediumBatchResult = {
  checkedAt: string;
  totalPlanned: number;
  generated: number;
  completed: number;
  evaluated: number;
  publishable: number;
  needsRevision: number;
  rejected: number;
  minimumPublishable: number;
  commercialValidityRate: number;
  processing: number;
  failedOrRefunded: number;
  missingProductImage: number;
  remainingToGenerate: number;
  remainingToEvaluate: number;
  operationalBlockingIssues: number;
  commercialRejectedIssues: number;
  blockingIssues: number;
  estimatedCostUsd: number;
  executionRate: number;
  completionRate: number;
  releaseGate: "not_started" | "running" | "ready_for_review" | "needs_iteration" | "ready_for_expansion" | "blocked";
  releaseGateReason: string;
  nextAction: string;
  samples: Array<{
    sampleId: string;
    templateId: string;
    label: string;
    sector: string;
    requiredProductImage: boolean;
    jobId: string | null;
    status: VideoJobStatus | "not_generated";
    resultUrl: string | null;
    creditsCharged: number | null;
    estimatedCostUsd: number | null;
    evaluationScore: number | null;
    releaseDecision: "publishable" | "minor_revision" | "reject_or_reprompt" | null;
    createdAt: string | null;
    issue: string | null;
  }>;
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
  return metadata.manual_required === true;
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
  const metadata = (provider.metadata as { supports_two_images?: boolean; model_family?: string } | null) ?? {};
  const pixverseCanCollapseReferences = provider.provider_key === "fal_ai" && metadata.model_family === "pixverse_v6";
  if (input.imageCount > 1 && !pixverseCanCollapseReferences && metadata.supports_two_images !== true) return { eligible: false, reason: "صورتان غير مدعومتين" };
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
  const { data: refundId, error } = await (await getSupabaseAdmin()).rpc("refund_credits", { _ledger_id: ledgerId, _reason: "manual_video_refund" });
  if (!error) return { refundId: refundId as string, newlyRefunded: true };
  if (!/already_refunded/i.test(error.message)) throw new Error(`فشل رد النقاط: ${error.message}`);

  const { data: ledger } = await (await getSupabaseAdmin()).from("credit_ledger").select("refund_ledger_id").eq("id", ledgerId).maybeSingle();
  return { refundId: ledger?.refund_ledger_id ?? null, newlyRefunded: false };
}

export const listAdminVideoJobs = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ListAdminVideoJobsInput.parse(input ?? {}))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<{ rows: AdminVideoJob[]; stats: AdminVideoStats }> => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    await assertAdmin(supabase, userId);
    const admin = await getSupabaseAdmin();

    let q = admin
      .from("video_jobs")
      .select("id, user_id, prompt, quality, aspect_ratio, duration_seconds, status, provider, provider_job_id, result_url, error_message, credits_charged, estimated_cost_usd, ledger_id, refund_ledger_id, metadata, created_at, completed_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (data.status !== "all") q = q.eq("status", data.status);

    const { data: rows, error } = await q;
    if (error) throw new Error(`فشل جلب مهام الفيديو: ${error.message}`);

    const statsRows = ((rows ?? []) as VideoJobRow[]);
    const userIds = Array.from(new Set(statsRows.map((r) => r.user_id)));
    const { data: profs } = userIds.length
      ? await admin.from("profiles").select("id, email, store_name").in("id", userIds)
      : { data: [] as { id: string; email: string | null; store_name: string | null }[] };
    const profMap = new Map((profs ?? []).map((p) => [p.id, p]));

    const statusList = ["processing", "completed", "refunded", "failed"] as const;
    const counts: Record<string, number> = { processing: 0, completed: 0, refunded: 0, failed: 0 };
    await Promise.all(
      statusList.map(async (status) => {
        const { count } = await admin.from("video_jobs").select("id", { count: "exact", head: true }).eq("status", status);
        counts[status] = count ?? 0;
      })
    );

    const { count: totalCount } = await admin.from("video_jobs").select("id", { count: "exact", head: true });
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
      rows: statsRows.map((r) => toAdminVideoJob(r, profMap.get(r.user_id))),
    };
  });

export const listVideoProviderConfigs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ providers: AdminVideoProviderConfig[] }> => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    await assertAdmin(supabase, userId);

    const { data, error } = await (await getSupabaseAdmin() as unknown as {
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

    const { data, error } = await (await getSupabaseAdmin())
      .from("video_jobs")
      .select("provider, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(`فشل جلب سجل محاولات المزودين: ${error.message}`);

    const byProvider = new Map<string, { total: number; success: number; failed: number; latency: number[]; errors: Map<string, number>; lastStatus: string | null; lastAt: string | null }>();
    for (const row of data ?? []) {
      const metadata = (row.metadata as Record<string, unknown> | null) ?? {};
      const attempts: ProviderAttempt[] = Array.isArray(metadata.provider_attempts) ? metadata.provider_attempts as ProviderAttempt[] : [{ provider: row.provider, ok: undefined, status: String(metadata.provider_status ?? "unknown"), finished_at: row.created_at }];
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

export const listSaudiLaunchTemplatePerformance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ templates: SaudiLaunchTemplatePerformance[] }> => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    await assertAdmin(supabase, userId);
    const { data, error } = await (await getSupabaseAdmin())
      .from("video_jobs")
      .select("status, estimated_cost_usd, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(`فشل جلب أداء قوالب الإطلاق: ${error.message}`);

    const byTemplate = new Map<string, { total: number; completed: number; processing: number; refunded: number; failed: number; costs: number[]; lastAt: string | null }>();
    for (const row of data ?? []) {
      const metadata = (row.metadata as Record<string, unknown> | null) ?? {};
      const templateId = typeof metadata.selected_template_id === "string" ? metadata.selected_template_id : "custom";
      if (templateId === "custom") continue;
      const current = byTemplate.get(templateId) ?? { total: 0, completed: 0, processing: 0, refunded: 0, failed: 0, costs: [], lastAt: null };
      current.total += 1;
      if (row.status === "completed") current.completed += 1;
      if (row.status === "processing") current.processing += 1;
      if (row.status === "refunded") current.refunded += 1;
      if (row.status === "failed") current.failed += 1;
      if (row.estimated_cost_usd !== null && Number.isFinite(Number(row.estimated_cost_usd))) current.costs.push(Number(row.estimated_cost_usd));
      if (!current.lastAt || new Date(row.created_at).getTime() > new Date(current.lastAt).getTime()) current.lastAt = row.created_at;
      byTemplate.set(templateId, current);
    }

    for (const templateId of SAUDI_VIDEO_LAUNCH_TEMPLATE_IDS) {
      if (!byTemplate.has(templateId)) byTemplate.set(templateId, { total: 0, completed: 0, processing: 0, refunded: 0, failed: 0, costs: [], lastAt: null });
    }

    return {
      templates: Array.from(byTemplate.entries()).map(([templateId, item]) => {
        const publishableRate = item.total ? Math.round((item.completed / item.total) * 100) : 0;
        const failureRate = item.total ? Math.round(((item.failed + item.refunded) / item.total) * 100) : 0;
        const avgCostUsd = item.costs.length ? Number((item.costs.reduce((sum, cost) => sum + cost, 0) / item.costs.length).toFixed(3)) : null;
        const gateNotes = [
          item.total >= LAUNCH_TEMPLATE_MIN_SAMPLE_SIZE ? "حجم العينة كافٍ" : `نحتاج ${Math.max(LAUNCH_TEMPLATE_MIN_SAMPLE_SIZE - item.total, 0).toLocaleString("ar-SA")} توليدات إضافية`,
          publishableRate >= SAUDI_VIDEO_LAUNCH_DECISION.minimumPublishableScore ? "نسبة الإكمال ضمن البوابة" : "نسبة الإكمال أقل من بوابة 80%",
          failureRate <= LAUNCH_TEMPLATE_MAX_FAILURE_RATE ? "الفشل/الاسترداد تحت السيطرة" : "الفشل أو الاسترداد مرتفع",
          avgCostUsd === null || avgCostUsd <= LAUNCH_TEMPLATE_MAX_AVG_COST_USD ? "التكلفة مستقرة" : "متوسط التكلفة أعلى من الحد التشغيلي",
        ];
        const minSampleReached = item.total >= LAUNCH_TEMPLATE_MIN_SAMPLE_SIZE;
        const expansionEligible = minSampleReached && publishableRate >= SAUDI_VIDEO_LAUNCH_DECISION.minimumPublishableScore && failureRate <= LAUNCH_TEMPLATE_MAX_FAILURE_RATE && (avgCostUsd === null || avgCostUsd <= LAUNCH_TEMPLATE_MAX_AVG_COST_USD);
        return { templateId, total: item.total, completed: item.completed, processing: item.processing, refunded: item.refunded, failed: item.failed, publishableRate, failureRate, avgCostUsd, minSampleReached, expansionEligible, decision: expansionEligible ? "eligible" : minSampleReached ? "watch" : "collecting", gateNotes, lastAt: item.lastAt } satisfies SaudiLaunchTemplatePerformance;
      }).sort((a, b) => Number(b.expansionEligible) - Number(a.expansionEligible) || b.total - a.total || b.publishableRate - a.publishableRate),
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

    const { data: updated, error } = await (await getSupabaseAdmin() as unknown as {
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

    const { data: current, error: readError } = await (await getSupabaseAdmin() as unknown as {
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

    const { data: updated, error } = await (await getSupabaseAdmin() as unknown as {
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

    const { data: rows, error } = await (await getSupabaseAdmin() as unknown as {
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

export const auditSaudiVideoPilotLibrary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SaudiVideoPilotAuditResult> => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    await assertAdmin(supabase, userId);

    const findings = SAUDI_VIDEO_PROMPT_TEMPLATES.map((template) => {
      const issues: string[] = [];
      const prompt = template.prompt;
      if (!/الصوت:/.test(prompt)) issues.push("لا يحتوي تعليمات صوت واضحة");
      if (!/تجنب:/.test(prompt)) issues.push("لا يحتوي قيود منع التشوهات");
      if (!/النصوص العربية المرئية/.test(prompt)) issues.push("لا يمنع النص العربي المرئي بوضوح");
      if (!/المنتج/.test(prompt)) issues.push("تركيز المنتج غير كافٍ");
      if (prompt.length < 280) issues.push("البرومبت قصير وقد يعطي نتيجة عامة");
      const score = Math.max(0, 100 - issues.length * 14 - (template.risk === "عالٍ" ? 8 : template.risk === "متوسط" ? 3 : 0));
      return {
        templateId: template.id,
        label: template.label,
        sector: template.sector,
        risk: template.risk,
        score,
        issues,
        recommendation: issues.length === 0 ? "جاهز للاختبار العملي" : "راجعه قبل اعتماده ضمن عينات الإطلاق",
      };
    });
    const passCount = findings.filter((item) => item.score >= 80).length;
    const result: SaudiVideoPilotAuditResult = {
      checkedAt: new Date().toISOString(),
      totalTemplates: findings.length,
      passCount,
      passRate: Math.round((passCount / Math.max(findings.length, 1)) * 100),
      readyForPilot: passCount >= 24,
      sectorCoverage: Array.from(new Set(findings.map((item) => item.sector))).sort((a, b) => a.localeCompare(b, "ar")),
      riskMix: findings.reduce<Record<string, number>>((acc, item) => ({ ...acc, [item.risk]: (acc[item.risk] ?? 0) + 1 }), {}),
      findings,
    };

    await logAdminAudit({ adminId: userId, action: "audit_saudi_video_pilot_library", targetTable: "video_provider_configs", targetId: "saudi_prompt_library", after: result as unknown as Json });
    return result;
  });

export const buildSaudiVideoPilotMatrix = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SaudiVideoPilotMatrixResult> => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    await assertAdmin(supabase, userId);

    const selectedTemplates = [...SAUDI_VIDEO_MEDIUM_TEST_TEMPLATE_IDS];
    const personas = ["male-premium", "female-abaya", "retail-seller", "male-young"] as const;
    const samples = selectedTemplates.map((templateId, index) => {
      const template = SAUDI_VIDEO_PROMPT_TEMPLATES.find((item) => item.id === templateId) ?? SAUDI_VIDEO_PROMPT_TEMPLATES[index];
      const persona = SAUDI_VIDEO_PERSONAS.find((item) => item.id === personas[index % personas.length]) ?? SAUDI_VIDEO_PERSONAS[0];
      const quality: "fast" | "lite" | "quality" = index < 4 ? "fast" : index < 11 ? "lite" : "quality";
      const durationSeconds: 5 | 8 = quality === "fast" ? 5 : 8;
      const expectedAspectRatio: "9:16" | "1:1" | "16:9" = "9:16";
      const mustPass = template.risk === "عالٍ"
        ? ["لا ادعاءات حساسة", "سلامة اليدين والوجه", "قابلية نشر مشروطة بمراجعة بشرية"]
        : ["ظهور المنتج خلال أول ثانيتين", "لهجة سعودية طبيعية", "لا نص عربي مشوّه"];
      const finalPrompt = withSaudiPromptAdherence([
        template.prompt,
        `هدف العينة ${index + 1}: ${quality === "quality" ? "اختبار إعلان مدفوع عالي الجودة" : quality === "lite" ? "اختبار إعلان يومي قابل للنشر" : "اختبار سريع لسلامة الفكرة"}.`,
        `الشخصية المرجعية: ${persona.brief}`,
        "يجب تسجيل النتيجة في مصفوفة الاختبار المتوسط قبل فتح القالب للعامة.",
      ].join("\n\n"));
      return {
        sampleId: `pilot-${String(index + 1).padStart(2, "0")}`,
        templateId: template.id,
        label: template.label,
        sector: template.sector,
        personaId: persona.id,
        personaLabel: persona.label,
        quality,
        durationSeconds,
        expectedAspectRatio,
        requiresProductImage: quality !== "fast",
        objective: quality === "quality" ? "قياس صلاحية إعلان مدفوع عالي الجودة" : quality === "lite" ? "قياس إعلان يومي قابل للنشر" : "قياس سرعة الفكرة وسلامة الهوية السعودية",
        technicalGate: [`النسبة المطلوبة للإطلاق: ${expectedAspectRatio}`, `المدة المطلوبة: ${durationSeconds} ثوانٍ`, "H.264 MP4 قابل للنشر", "لا اعتماد تجاري لأي عينة تخرج مربعة أو أفقية ضمن مصفوفة الإطلاق"],
        mustPass,
        scorecard: SAUDI_VIDEO_PROMPT_ADHERENCE_SCORECARD.map((item) => `${item.label} ${item.weight}%`),
        promptAdherenceGate: "لا يُقبل القالب إذا تجاهل المنتج أو الصوت أو الحركة الأساسية حتى لو كان الفيديو جميلاً بصرياً.",
        finalPrompt,
        generationPayload: { prompt: finalPrompt, quality, aspectRatio: expectedAspectRatio, durationSeconds, selectedPersonaId: persona.id, selectedTemplateId: "custom" as const, requiresProductImage: quality !== "fast" },
      };
    });
    const result: SaudiVideoPilotMatrixResult = {
      checkedAt: new Date().toISOString(),
      testLevel: "medium",
      totalSamples: samples.length,
      estimatedCostUsd: Number(samples.reduce((sum, sample) => sum + (sample.quality === "quality" ? 0.45 : sample.quality === "lite" ? 0.25 : 0.2), 0).toFixed(2)),
      requiredPublishableRate: 80,
      readinessGate: `اختبار متوسط ${SAUDI_VIDEO_MEDIUM_TEST_PLAN.sampleRange} عينة بتكلفة تقريبية ${SAUDI_VIDEO_MEDIUM_TEST_PLAN.estimatedCostUsd}$: لا نفتح القوالب الاحتياطية إلا بعد قياس تنفيذ البرومبت بدقة؛ ${SAUDI_VIDEO_MEDIUM_TEST_PLAN.decisionGate}`,
      samples,
    };

    await logAdminAudit({ adminId: userId, action: "build_saudi_video_pilot_matrix", targetTable: "video_provider_configs", targetId: "saudi_pilot_matrix", after: result as unknown as Json });
    return result;
  });

export const auditSaudiVideoMediumBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SaudiVideoMediumBatchResult> => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    await assertAdmin(supabase, userId);

    const { data: rows, error } = await (await getSupabaseAdmin() as unknown as {
      from: (table: string) => { select: (columns: string) => { contains: (column: string, value: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> } };
    })
      .from("video_jobs")
      .select("id, status, result_url, credits_charged, estimated_cost_usd, product_image_url, error_message, metadata, created_at")
      .contains("metadata", { medium_test: true });
    if (error) throw new Error(`فشل تدقيق دفعة الاختبار المتوسط: ${error.message}`);

    const jobsBySample = new Map<string, Pick<VideoJobRow, "id" | "status" | "result_url" | "credits_charged" | "estimated_cost_usd" | "product_image_url" | "error_message" | "metadata" | "created_at">>();
    for (const row of (rows as Array<Pick<VideoJobRow, "id" | "status" | "result_url" | "credits_charged" | "estimated_cost_usd" | "product_image_url" | "error_message" | "metadata" | "created_at">> | null) ?? []) {
      const metadata = (row.metadata as Record<string, unknown> | null) ?? {};
      const sampleId = typeof metadata.medium_test_sample_id === "string" ? metadata.medium_test_sample_id : "";
      const current = sampleId ? jobsBySample.get(sampleId) : null;
      if (sampleId && (!current || new Date(row.created_at).getTime() > new Date(current.created_at).getTime())) jobsBySample.set(sampleId, row);
    }

    const personas = ["male-premium", "female-abaya", "retail-seller", "male-young"] as const;
    const samples = SAUDI_VIDEO_MEDIUM_TEST_TEMPLATE_IDS.map((templateId, index) => {
      const template = SAUDI_VIDEO_PROMPT_TEMPLATES.find((item) => item.id === templateId) ?? SAUDI_VIDEO_PROMPT_TEMPLATES[index];
      const quality: "fast" | "lite" | "quality" = index < 4 ? "fast" : index < 11 ? "lite" : "quality";
      const sampleId = `pilot-${String(index + 1).padStart(2, "0")}`;
      const job = jobsBySample.get(sampleId) ?? null;
      const metadata = (job?.metadata as Record<string, unknown> | null) ?? {};
      const evaluation = (metadata.medium_test_evaluation as { score?: unknown } | null) ?? null;
      const releaseDecision: "publishable" | "minor_revision" | "reject_or_reprompt" | null = metadata.medium_test_release_decision === "publishable" || metadata.medium_test_release_decision === "minor_revision" || metadata.medium_test_release_decision === "reject_or_reprompt" ? metadata.medium_test_release_decision : null;
      const requiredProductImage = quality !== "fast";
      const missingProductImage = Boolean(job && requiredProductImage && !job.product_image_url);
      const status: VideoJobStatus | "not_generated" = job?.status ?? "not_generated";
      return {
        sampleId,
        templateId: template.id,
        label: template.label,
        sector: template.sector,
        personaId: personas[index % personas.length],
        requiredProductImage,
        jobId: job?.id ?? null,
        status,
        resultUrl: job?.result_url ?? null,
        creditsCharged: job?.credits_charged ?? null,
        estimatedCostUsd: job?.estimated_cost_usd === null || job?.estimated_cost_usd === undefined ? null : Number(job.estimated_cost_usd),
        evaluationScore: typeof evaluation?.score === "number" ? evaluation.score : null,
        releaseDecision,
        createdAt: job?.created_at ?? null,
        issue: !job ? "لم تُولد العينة بعد" : missingProductImage ? "صورة المنتج الإلزامية غير مرفقة" : job.error_message,
      };
    });
    const generated = samples.filter((sample) => sample.jobId).length;
    const completed = samples.filter((sample) => sample.status === "completed" && sample.resultUrl).length;
    const processing = samples.filter((sample) => sample.status === "processing" || sample.status === "pending").length;
    const failedOrRefunded = samples.filter((sample) => sample.status === "failed" || sample.status === "refunded" || sample.status === "cancelled").length;
    const missingProductImage = samples.filter((sample) => sample.issue === "صورة المنتج الإلزامية غير مرفقة").length;
    const remainingToGenerate = samples.length - generated;
    const executionRate = Math.round((generated / Math.max(samples.length, 1)) * 100);
    const completionRate = Math.round((completed / Math.max(samples.length, 1)) * 100);
    const evaluated = samples.filter((sample) => sample.releaseDecision).length;
    const publishable = samples.filter((sample) => sample.releaseDecision === "publishable").length;
    const needsRevision = samples.filter((sample) => sample.releaseDecision === "minor_revision").length;
    const rejected = samples.filter((sample) => sample.releaseDecision === "reject_or_reprompt").length;
    const remainingToEvaluate = samples.length - evaluated;
    const operationalBlockingIssues = missingProductImage + failedOrRefunded;
    const commercialRejectedIssues = rejected;
    const blockingIssues = operationalBlockingIssues + commercialRejectedIssues;
    const minimumPublishable = Math.ceil(samples.length * 0.8);
    const commercialValidityRate = Math.round((publishable / Math.max(samples.length, 1)) * 100);
    const releaseGate: SaudiVideoMediumBatchResult["releaseGate"] = generated === 0 ? "not_started" : blockingIssues > 0 ? "blocked" : evaluated === samples.length && publishable >= minimumPublishable ? "ready_for_expansion" : evaluated === samples.length ? "needs_iteration" : completed === samples.length ? "ready_for_review" : "running";
    const releaseGateReason = releaseGate === "not_started"
      ? "لم تُسجّل أي مهمة موسومة للاختبار المتوسط بعد؛ لا يوجد دليل عملي يسمح بقرار تجاري."
      : releaseGate === "blocked"
        ? operationalBlockingIssues > 0 ? "الدفعة متوقفة تشغيلياً بسبب فشل/استرداد أو نقص صورة منتج؛ أصلح العينة قبل احتساب القرار التجاري." : "الدفعة متوقفة تجارياً بسبب عينة مرفوضة؛ لا توسع قبل إعادة صياغة البرومبت وإعادة توليد العينة."
        : releaseGate === "ready_for_expansion"
          ? "اكتمل تقييم الدفعة وحققت بوابة 80%+؛ القوالب الصالحة جاهزة لاختبار تكرار أوسع قبل الفتح العام."
        : releaseGate === "needs_iteration"
          ? "اكتمل التقييم لكن نسبة القوالب الصالحة أقل من بوابة 80%؛ يلزم ضبط البرومبتات قبل أي توسع."
        : releaseGate === "ready_for_review"
          ? "كل العينات المخططة اكتملت ولديها نتائج؛ انتقل الآن إلى تقييم كل فيديو ببوابة 80%+."
          : "الدفعة بدأت لكنها لم تكتمل؛ أكمل توليد العينات الناقصة أو حدّث المهام قيد المعالجة.";
    const nextAction = releaseGate === "not_started"
      ? "افتح مصفوفة الاختبار، ولّد العينات بالترتيب من pilot-01 إلى pilot-12، وارفع صورة منتج لكل عينة موسومة كإلزامية."
      : releaseGate === "blocked"
        ? "أصلح العينات المتوقفة أولاً: أعد توليد ما فشل، وأرفق صورة منتج واضحة للعينات الإعلانية/الاحترافية قبل التقييم."
        : releaseGate === "ready_for_expansion"
          ? "انقل العينات القابلة للنشر فقط إلى اختبار 5 عينات إضافية لكل قالب، واترك القوالب ذات التعديل أو الرفض مخفية."
        : releaseGate === "needs_iteration"
          ? "ابدأ بإعادة صياغة عينات التعديل، ثم أعد توليدها كدفعة مصغرة قبل تكرار اختبار التوسيع."
        : releaseGate === "ready_for_review"
          ? "قيّم كل عينة عبر نموذج التقييم: المنتج، المشهد، الحركة، اللهجة، الممنوعات، وقابلية النشر؛ لا تعتمد إلا 80%+."
          : "تابع توليد العينات غير المكتملة ثم اضغط تدقيق الدفعة حتى تتحول الحالة إلى جاهزة للتقييم.";
    const result: SaudiVideoMediumBatchResult = { checkedAt: new Date().toISOString(), totalPlanned: samples.length, generated, completed, evaluated, publishable, needsRevision, rejected, minimumPublishable, commercialValidityRate, processing, failedOrRefunded, missingProductImage, remainingToGenerate, remainingToEvaluate, operationalBlockingIssues, commercialRejectedIssues, blockingIssues, estimatedCostUsd: Number(samples.reduce((sum, sample) => sum + (sample.estimatedCostUsd ?? 0), 0).toFixed(2)), executionRate, completionRate, releaseGate, releaseGateReason, nextAction, samples };

    await logAdminAudit({ adminId: userId, action: "audit_saudi_video_medium_batch", targetTable: "video_jobs", targetId: "saudi_medium_batch", after: result as unknown as Json });
    return result;
  });

export const evaluateSaudiVideoPilotSample = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => EvaluatePilotSampleInput.parse(input))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<SaudiVideoPilotEvaluationResult> => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    await assertAdmin(supabase, userId);
    const admin = await getSupabaseAdmin();
    const weights = { productClarity: 25, sceneAdherence: 20, motionAdherence: 15, saudiDialect: 15, negativeSafety: 15, publishReadiness: 10 } as const;
    const weightedScore =
      data.productClarity * weights.productClarity +
      data.sceneAdherence * weights.sceneAdherence +
      data.motionAdherence * weights.motionAdherence +
      data.saudiDialect * weights.saudiDialect +
      data.negativeSafety * weights.negativeSafety +
      data.publishReadiness * weights.publishReadiness;
    const score = Math.round(weightedScore / 5);
    const hardFail = data.productClarity <= 2 || data.saudiDialect <= 2 || data.negativeSafety <= 2;
    const decision = hardFail ? "reject_or_reprompt" : score >= 80 ? "publishable" : score >= 65 ? "minor_revision" : "reject_or_reprompt";
    const gateReason = hardFail ? "رفض مؤقت: تجاهل المنتج أو الصوت أو ظهرت مخالفة/تشوه قوي." : score >= 80 ? "جاهز لتكرار أوسع ضمن بوابة 80%+." : score >= 65 ? "يحتاج ضبط برومبت قبل أي فتح عام." : "يبقى مخفياً ويعاد توليده بعد إعادة صياغة كبيرة.";
    const sampleNumber = Number(data.sampleId.replace("pilot-", ""));
    const expectedTemplateId = SAUDI_VIDEO_MEDIUM_TEST_TEMPLATE_IDS[sampleNumber - 1];
    const expectedQuality = sampleNumber <= 4 ? "fast" : sampleNumber <= 11 ? "lite" : "quality";
    const result = { ...data, resultUrl: data.resultUrl || undefined, notes: data.notes || undefined, score, decision, gateReason, evaluatedAt: new Date().toISOString() } satisfies SaudiVideoPilotEvaluationResult;
    const { data: jobs } = await admin
      .from("video_jobs")
      .select("id, status, result_url, product_image_url, metadata, created_at")
      .contains("metadata", { medium_test: true, medium_test_sample_id: data.sampleId, medium_test_template_id: expectedTemplateId })
      .order("created_at", { ascending: false })
      .limit(1);
    const job = jobs?.[0] as Pick<VideoJobRow, "id" | "status" | "result_url" | "product_image_url" | "metadata" | "created_at"> | undefined;
    if (!job) throw new Error("لا يمكن تقييم عينة لم تُولد بعد ضمن مصفوفة الاختبار المتوسط الرسمية.");
    if (job.status !== "completed" || !job.result_url) throw new Error("لا يمكن تقييم العينة قبل اكتمال الفيديو ووجود رابط نتيجة صالح.");
    if (expectedQuality !== "fast" && !job.product_image_url) throw new Error("لا يمكن تقييم عينة إعلانية/احترافية دون صورة منتج فعلية.");
    if (data.resultUrl && data.resultUrl !== job.result_url) throw new Error("رابط النتيجة لا يطابق آخر فيديو رسمي لهذه العينة.");
    const metadata = (job.metadata as Record<string, unknown> | null) ?? {};
    const canonicalResult = { ...result, resultUrl: job.result_url } satisfies SaudiVideoPilotEvaluationResult;
    const { error: updateError } = await admin
      .from("video_jobs")
      .update({ metadata: { ...metadata, medium_test_evaluation: canonicalResult, medium_test_release_decision: decision, medium_test_evaluated_at: canonicalResult.evaluatedAt } as Json })
      .eq("id", job.id);
    if (updateError) throw new Error(`فشل حفظ تقييم العينة داخل مهمة الفيديو: ${updateError.message}`);
    await logAdminAudit({ adminId: userId, action: "evaluate_saudi_video_pilot_sample", targetTable: "video_jobs", targetId: job.id, after: canonicalResult as unknown as Json });
    return canonicalResult;
  });
