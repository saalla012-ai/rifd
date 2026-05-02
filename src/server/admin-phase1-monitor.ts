/**
 * Admin Phase 1 Monitor — server function يجمع KPIs المرحلة الأولى:
 *  - معدل الـrefund اليومي (هدف <15%)
 *  - عدد fallbacks ناجحة بين المزودين
 *  - حالة kill-switch الحالية لكل مزود
 *  - نسبة Free → Paid conversion
 *  - أعلى 5 error_categories
 *  - Launch Bonus stats (المستفيدون / المتبقي من 100)
 *
 * محمي بـrequireSupabaseAuth + assertAdmin. يستخدم authenticated client
 * (RLS-scoped) — كل الجداول المُستعلَم عنها تسمح للأدمن بالقراءة الكاملة.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin, type DbClient } from "@/server/admin-auth";

export type Phase1Monitor = {
  generated_at: string;
  window_hours: 24;
  refund: {
    total_jobs: number;
    refunded_jobs: number;
    refund_rate_pct: number;
    target_pct: 15;
    is_healthy: boolean;
  };
  providers: Array<{
    provider: string;
    enabled: boolean;
    priority: number;
    success_24h: number;
    fail_24h: number;
    fail_rate_pct: number;
    last_failure_at: string | null;
    kill_switch_active: boolean;
  }>;
  fallbacks: {
    jobs_with_fallback: number;
    successful_fallback: number;
    fallback_success_rate_pct: number;
  };
  conversion: {
    free_users: number;
    paid_users: number;
    conversion_rate_pct: number;
  };
  top_errors: Array<{ category: string; count: number; pct: number }>;
  launch_bonus: {
    total_granted: number;
    remaining: number;
    cap: number;
  };
};

type AttemptEntry = { provider?: string; ok?: boolean; status?: string };

export const getPhase1Monitor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Phase1Monitor> => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    await assertAdmin(supabase, userId);

    const adb = supabase as unknown as {
      from: (t: string) => any;
      rpc: (name: string, params?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
    };

    const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    // 1) Refund metrics (24h)
    const { data: jobsRaw } = await adb
      .from("video_jobs")
      .select("id, status, refund_ledger_id, error_category, metadata, created_at")
      .gte("created_at", since24h);

    const jobs = (jobsRaw ?? []) as Array<{
      id: string;
      status: string;
      refund_ledger_id: string | null;
      error_category: string | null;
      metadata: Record<string, unknown> | null;
    }>;
    const totalJobs = jobs.length;
    const refundedJobs = jobs.filter((j) => j.refund_ledger_id != null).length;
    const refundRate = totalJobs === 0 ? 0 : (refundedJobs / totalJobs) * 100;

    // 2) Provider configs + fail_24h
    const { data: providersRaw } = await adb
      .from("video_provider_configs")
      .select("provider_key, enabled, priority")
      .order("priority", { ascending: false });

    const providers: Phase1Monitor["providers"] = [];
    const providerKeys = ((providersRaw ?? []) as Array<{ provider_key: string; enabled: boolean; priority: number }>);

    for (const p of providerKeys) {
      // count success/fail from job metadata.provider_attempts
      let success = 0;
      let fail = 0;
      let lastFailureAt: string | null = null;
      for (const job of jobs) {
        const attempts = (job.metadata?.provider_attempts as AttemptEntry[] | undefined) ?? [];
        for (const a of attempts) {
          if (a.provider !== p.provider_key) continue;
          if (a.ok) success += 1;
          else fail += 1;
        }
      }
      const total = success + fail;
      const failRate = total === 0 ? 0 : (fail / total) * 100;

      // kill switch event still open?
      const { data: ks } = await adb
        .from("provider_kill_switch_events")
        .select("triggered_at, restored_at")
        .eq("provider_key", p.provider_key)
        .order("triggered_at", { ascending: false })
        .limit(1);
      const ksRow = (ks as Array<{ triggered_at: string; restored_at: string | null }> | null)?.[0];
      const killActive = Boolean(ksRow && ksRow.restored_at == null);

      providers.push({
        provider: p.provider_key,
        enabled: p.enabled,
        priority: p.priority,
        success_24h: success,
        fail_24h: fail,
        fail_rate_pct: Math.round(failRate * 10) / 10,
        last_failure_at: lastFailureAt,
        kill_switch_active: killActive,
      });
    }

    // 3) Fallbacks: jobs where provider_attempts has >1 entries and final ok
    let jobsWithFallback = 0;
    let successfulFallback = 0;
    for (const job of jobs) {
      const attempts = (job.metadata?.provider_attempts as AttemptEntry[] | undefined) ?? [];
      if (attempts.length > 1) {
        jobsWithFallback += 1;
        if (job.status === "completed") successfulFallback += 1;
      }
    }
    const fallbackRate = jobsWithFallback === 0 ? 0 : (successfulFallback / jobsWithFallback) * 100;

    // 4) Conversion (lifetime — proxy)
    const { count: freeCount } = await adb
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("plan", "free");
    const { count: paidCount } = await adb
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .neq("plan", "free");
    const totalUsers = (freeCount ?? 0) + (paidCount ?? 0);
    const convRate = totalUsers === 0 ? 0 : ((paidCount ?? 0) / totalUsers) * 100;

    // 5) Top error categories (24h)
    const errorCounts = new Map<string, number>();
    for (const j of jobs) {
      if (!j.error_category) continue;
      errorCounts.set(j.error_category, (errorCounts.get(j.error_category) ?? 0) + 1);
    }
    const totalErrors = Array.from(errorCounts.values()).reduce((a, b) => a + b, 0);
    const topErrors = Array.from(errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({
        category,
        count,
        pct: totalErrors === 0 ? 0 : Math.round((count / totalErrors) * 1000) / 10,
      }));

    // 6) Launch bonus stats
    const { data: bonusData } = await adb.rpc("get_launch_bonus_stats");
    const bonusRow = (bonusData as Array<{ total_granted: number; remaining: number; cap: number }> | null)?.[0] ?? {
      total_granted: 0,
      remaining: 100,
      cap: 100,
    };

    return {
      generated_at: new Date().toISOString(),
      window_hours: 24,
      refund: {
        total_jobs: totalJobs,
        refunded_jobs: refundedJobs,
        refund_rate_pct: Math.round(refundRate * 10) / 10,
        target_pct: 15,
        is_healthy: refundRate < 15,
      },
      providers,
      fallbacks: {
        jobs_with_fallback: jobsWithFallback,
        successful_fallback: successfulFallback,
        fallback_success_rate_pct: Math.round(fallbackRate * 10) / 10,
      },
      conversion: {
        free_users: freeCount ?? 0,
        paid_users: paidCount ?? 0,
        conversion_rate_pct: Math.round(convRate * 10) / 10,
      },
      top_errors: topErrors,
      launch_bonus: bonusRow,
    };
  });
