import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertAdmin, logAdminAudit, type DbClient } from "@/server/admin-auth";
import type { Database, Json } from "@/integrations/supabase/types";

const ListAdminVideoJobsInput = z.object({
  status: z.enum(["all", "pending", "processing", "completed", "failed", "refunded"]).default("all"),
  limit: z.number().int().min(1).max(300).default(100),
});

const ProviderUpdateInput = z.object({
  providerKey: z.string().min(2).max(80),
  enabled: z.boolean().optional(),
  publicEnabled: z.boolean().optional(),
  priority: z.number().int().min(1).max(1000).optional(),
});

type VideoJobStatus = Database["public"]["Enums"]["video_job_status"];

export type AdminVideoJob = {
  id: string;
  user_id: string;
  user_email: string | null;
  user_store: string | null;
  prompt: string;
  quality: "fast" | "quality";
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
  mode: "api" | "bridge" | "manual";
  health_status: "active" | "inactive" | "testing" | "manual_required" | "unhealthy";
  last_success_at: string | null;
  last_error_at: string | null;
  last_error_message: string | null;
  metadata: Json;
  updated_at: string;
};

export const listAdminVideoJobs = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ListAdminVideoJobsInput.parse(input ?? {}))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<{ rows: AdminVideoJob[]; stats: AdminVideoStats }> => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    await assertAdmin(supabase, userId);

    let q = supabaseAdmin
      .from("video_jobs")
      .select("id, user_id, prompt, quality, aspect_ratio, duration_seconds, status, provider, provider_job_id, result_url, error_message, credits_charged, estimated_cost_usd, ledger_id, refund_ledger_id, created_at, completed_at")
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
      rows: statsRows.map((r) => {
        const p = profMap.get(r.user_id);
        return {
          ...r,
          quality: r.quality as "fast" | "quality",
          estimated_cost_usd: r.estimated_cost_usd === null ? null : Number(r.estimated_cost_usd),
          user_email: p?.email ?? null,
          user_store: p?.store_name ?? null,
        };
      }),
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
