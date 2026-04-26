import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Activity, AlertTriangle, ArrowUpDown, CheckCircle2, Clapperboard, Loader2, RefreshCw, Wifi } from "lucide-react";
import { toast } from "sonner";
import { AdminGuard, adminBeforeLoad } from "@/components/admin-guard";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { VIDEO_QUALITY_LABELS } from "@/lib/plan-catalog";
import { cn } from "@/lib/utils";
import { listVideoProviderAttemptSummary, listVideoProviderConfigs, testVideoProviderConnection, testVideoRouterDryRun, updateVideoProviderConfig, type AdminVideoProviderAttemptSummary, type AdminVideoProviderConfig, type AdminVideoRouterTestResult } from "@/server/admin-video";

export const Route = createFileRoute("/admin/video-providers")({
  beforeLoad: adminBeforeLoad,
  head: () => ({ meta: [{ title: "مزودو الفيديو — رِفد" }] }),
  component: () => (
    <AdminGuard loadingLabel="جاري تحميل مركز مزودي الفيديو…">
      <AdminVideoProvidersPage />
    </AdminGuard>
  ),
});

const HEALTH_LABEL: Record<string, string> = {
  active: "نشط",
  inactive: "متوقف",
  testing: "تجربة",
  manual_required: "يحتاج تدخل يدوي",
  unhealthy: "غير صحي",
};

const HEALTH_TONE: Record<string, string> = {
  active: "bg-success/15 text-success",
  inactive: "bg-muted text-muted-foreground",
  testing: "bg-primary/15 text-primary",
  manual_required: "bg-gold/15 text-gold",
  unhealthy: "bg-destructive/15 text-destructive",
};

function fmtDate(value: string | null) {
  return value ? new Date(value).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" }) : "—";
}

function AdminVideoProvidersPage() {
  const fetchProviders = useServerFn(listVideoProviderConfigs);
  const fetchAttempts = useServerFn(listVideoProviderAttemptSummary);
  const updateProvider = useServerFn(updateVideoProviderConfig);
  const testProvider = useServerFn(testVideoProviderConnection);
  const testRouter = useServerFn(testVideoRouterDryRun);
  const [providers, setProviders] = useState<AdminVideoProviderConfig[]>([]);
  const [attempts, setAttempts] = useState<AdminVideoProviderAttemptSummary[]>([]);
  const [routerResult, setRouterResult] = useState<AdminVideoRouterTestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [testingRouter, setTestingRouter] = useState(false);

  async function authHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("لا توجد جلسة");
    return { Authorization: `Bearer ${session.access_token}` };
  }

  async function load() {
    setLoading(true);
    try {
      const headers = await authHeaders();
      const [providerResult, attemptResult] = await Promise.all([fetchProviders({ headers }), fetchAttempts({ headers })]);
      setProviders(providerResult.providers);
      setAttempts(attemptResult.attempts);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل تحميل مزودي الفيديو");
    } finally {
      setLoading(false);
    }
  }

  async function save(providerKey: string, patch: { enabled?: boolean; publicEnabled?: boolean; priority?: number; cost5s?: number; cost8s?: number }) {
    setSavingKey(providerKey);
    try {
      const headers = await authHeaders();
      const result = await updateProvider({ data: { providerKey, ...patch }, headers });
      setProviders((current) => current.map((provider) => provider.provider_key === providerKey ? result.provider : provider).sort((a, b) => a.priority - b.priority));
      toast.success("تم حفظ إعدادات المزود");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل حفظ إعدادات المزود");
    } finally {
      setSavingKey(null);
    }
  }

  async function testConnection(providerKey: string) {
    setTestingKey(providerKey);
    try {
      const headers = await authHeaders();
      const result = await testProvider({ data: { providerKey }, headers });
      setProviders((current) => current.map((provider) => provider.provider_key === providerKey ? result.provider : provider));
      toast[result.result.ok ? "success" : "error"](result.result.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل اختبار اتصال المزود");
    } finally {
      setTestingKey(null);
    }
  }

  async function testRouterPath() {
    setTestingRouter(true);
    try {
      const headers = await authHeaders();
      const scenarios = [
        { quality: "fast", aspectRatio: "9:16", durationSeconds: 5, hasStartingFrame: false },
        { quality: "lite", aspectRatio: "9:16", durationSeconds: 8, hasStartingFrame: true },
        { quality: "quality", aspectRatio: "16:9", durationSeconds: 8, hasStartingFrame: true },
      ] as const;
      const result = await testRouter({ data: scenarios[0], headers });
      await Promise.all(scenarios.slice(1).map((scenario) => testRouter({ data: scenario, headers })));
      setRouterResult(result);
      toast[result.ok ? "success" : "error"](result.ok ? "تم اختبار 3 مسارات للراوتر" : "لا يوجد مزود مؤهل للمسار الأساسي");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل اختبار الراوتر");
    } finally {
      setTestingRouter(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold">
            <Clapperboard className="h-6 w-6 text-primary" /> مركز مزودي الفيديو
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">تحكم داخلي بالمزودين، الأولوية، الصحة، والتفعيل دون كشف أي اسم تقني للمستخدم.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="default" size="sm" onClick={() => void testRouterPath()} disabled={loading || testingRouter}>
            {testingRouter ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />} اختبار الراوتر
          </Button>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> تحديث
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/video-jobs"><Activity className="h-4 w-4" /> مهام الفيديو</Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <>
          {routerResult && <RouterResultPanel result={routerResult} />}
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            {attempts.slice(0, 3).map((attempt) => <AttemptCard key={attempt.provider} attempt={attempt} />)}
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {providers.map((provider) => {
              const saving = savingKey === provider.provider_key;
              return (
                <article key={provider.provider_key} className="rounded-xl border border-border bg-card p-4 shadow-soft">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-extrabold">{provider.display_name_admin}</h2>
                      <Badge className={cn(HEALTH_TONE[provider.health_status] ?? "bg-muted")}>{HEALTH_LABEL[provider.health_status] ?? provider.health_status}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{provider.provider_key} · {provider.mode === "manual" ? "جسر يدوي" : provider.mode === "bridge" ? "جسر شبه آلي" : "API"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(saving || testingKey === provider.provider_key) && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                    <Button type="button" variant="outline" size="sm" onClick={() => void testConnection(provider.provider_key)} disabled={saving || testingKey === provider.provider_key}>
                      {provider.health_status === "active" ? <CheckCircle2 className="h-4 w-4" /> : <Wifi className="h-4 w-4" />} اختبار الاتصال
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <ControlRow label="تفعيل المزود" hint="يدخل ضمن الراوتر الداخلي">
                    <Switch checked={provider.enabled} disabled={saving} onCheckedChange={(checked) => void save(provider.provider_key, { enabled: checked })} />
                  </ControlRow>
                  <ControlRow label="متاح للطلبات" hint="إيقافه يمنع استخدامه للمستخدمين">
                    <Switch checked={provider.public_enabled} disabled={saving || !provider.enabled} onCheckedChange={(checked) => void save(provider.provider_key, { publicEnabled: checked })} />
                  </ControlRow>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-[140px_1fr]">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground">الأولوية</label>
                    <div className="mt-1 flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min={1}
                        max={1000}
                        value={provider.priority}
                        disabled={saving}
                        onChange={(event) => setProviders((current) => current.map((item) => item.provider_key === provider.provider_key ? { ...item, priority: Number(event.target.value) } : item))}
                        onBlur={(event) => void save(provider.provider_key, { priority: Number(event.target.value) })}
                        className="h-9"
                      />
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/30 p-3 text-xs leading-6 text-muted-foreground">
                    <div className="flex flex-wrap gap-2">
                      {provider.supported_qualities.map((quality) => (
                        <Badge key={quality} variant="secondary">{quality === "quality" || quality === "fast" || quality === "lite" ? VIDEO_QUALITY_LABELS[quality] : "متوازن"}</Badge>
                      ))}
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <CostInput label="تكلفة 5ث" value={provider.cost_5s} disabled={saving} onCommit={(value) => void save(provider.provider_key, { cost5s: value })} />
                      <CostInput label="تكلفة 8ث" value={provider.cost_8s} disabled={saving} onCommit={(value) => void save(provider.provider_key, { cost8s: value })} />
                    </div>
                    <ProviderCapabilities metadata={provider.metadata} provider={provider} />
                    <p>آخر نجاح: {fmtDate(provider.last_success_at)} · آخر خطأ: {fmtDate(provider.last_error_at)}</p>
                    <LastConnectionTest metadata={provider.metadata} />
                    {provider.last_error_message && <p className="mt-1 flex items-start gap-1 text-destructive"><AlertTriangle className="mt-1 h-3.5 w-3.5" /> {provider.last_error_message}</p>}
                  </div>
                </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </DashboardShell>
  );
}

function AttemptCard({ attempt }: { attempt: AdminVideoProviderAttemptSummary }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <p className="truncate text-xs font-bold text-muted-foreground">{attempt.provider}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-2xl font-extrabold tabular-nums">{attempt.successRate}%</p>
        <Badge variant="secondary">{attempt.total.toLocaleString("ar-SA")} محاولة</Badge>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">نجاح: {attempt.success.toLocaleString("ar-SA")} · فشل: {attempt.failed.toLocaleString("ar-SA")} ({attempt.failureRate}%) · متوسط: {attempt.avgLatencyMs ? `${attempt.avgLatencyMs.toLocaleString("ar-SA")}ms` : "—"}</p>
      <p className="mt-1 truncate text-xs text-muted-foreground">آخر حالة: {attempt.lastStatus ?? "—"} · {fmtDate(attempt.lastAt)}</p>
      {attempt.topError && <p className="mt-1 line-clamp-1 text-xs text-destructive">أكثر خطأ: {attempt.topError}</p>}
    </div>
  );
}

function RouterResultPanel({ result }: { result: AdminVideoRouterTestResult }) {
  return (
    <section className="mb-4 rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-extrabold">نتيجة اختبار الراوتر</h2>
          <p className="mt-1 text-xs text-muted-foreground">مسار آمن: سريع · 9:16 · 5ث · بدون إنشاء فيديو أو خصم نقاط</p>
        </div>
        <Badge className={cn(result.ok ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")}>{result.ok ? `المختار: ${result.selectedProvider}` : "لا يوجد مزود مؤهل"}</Badge>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {result.candidates.map((candidate) => (
          <div key={candidate.providerKey} className="rounded-lg border border-border bg-secondary/30 p-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold">{candidate.displayName}</span>
              <Badge variant="secondary">#{candidate.effectivePriority === candidate.priority ? candidate.priority : `${candidate.priority}→${candidate.effectivePriority}`}</Badge>
            </div>
            <p className="mt-1 text-muted-foreground">{candidate.mode} · {candidate.reason}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function LastConnectionTest({ metadata }: { metadata: AdminVideoProviderConfig["metadata"] }) {
  const tests = (metadata as { connection_tests?: Array<{ ok?: boolean; message?: string; checkedAt?: string; latencyMs?: number }> } | null)?.connection_tests;
  const last = Array.isArray(tests) ? tests.at(-1) : null;
  if (!last) return null;
  return <p className="mt-1">آخر اختبار: {last.ok ? "ناجح" : "فشل"} · {last.latencyMs ?? 0}ms · {last.message ?? "—"}</p>;
}

function ControlRow({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 p-3">
      <div>
        <p className="text-sm font-bold">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
