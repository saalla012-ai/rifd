import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Activity, AlertTriangle, ArrowUpDown, CheckCircle2, Clapperboard, ClipboardCheck, Loader2, RefreshCw, Target, Wifi } from "lucide-react";
import { toast } from "sonner";
import { AdminGuard, adminBeforeLoad } from "@/components/admin-guard";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { VIDEO_QUALITY_LABELS } from "@/lib/plan-catalog";
import { FAL_VIDEO_TEST_MODELS, SAUDI_VIDEO_PERSONAS, SAUDI_VIDEO_TEST_SCENARIOS } from "@/lib/saudi-video-test";
import { cn } from "@/lib/utils";
import { auditSaudiVideoPilotLibrary, buildSaudiVideoPilotMatrix, listVideoProviderAttemptSummary, listVideoProviderConfigs, previewSaudiFalVideoTestPrompt, runSaudiFalVideoModelTest, testVideoProviderConnection, testVideoRouterDryRun, updateVideoProviderConfig, type AdminVideoProviderAttemptSummary, type AdminVideoProviderConfig, type AdminVideoRouterTestResult, type SaudiFalModelTestResult, type SaudiFalPromptPreview, type SaudiVideoPilotAuditResult, type SaudiVideoPilotMatrixResult } from "@/server/admin-video";
import personaMaleYoung from "@/assets/saudi-persona-male-young.jpg";
import personaMalePremium from "@/assets/saudi-persona-male-premium.jpg";
import personaFemaleAbaya from "@/assets/saudi-persona-female-abaya.jpg";
import personaRetailSeller from "@/assets/saudi-persona-retail-seller.jpg";

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

type SaudiFalDraft = { modelId: string; personaId: string; scenarioId: string; includeProductImage: boolean; includeVoice: boolean };

const PERSONA_IMAGES: Record<string, string> = {
  "male-young": personaMaleYoung,
  "male-premium": personaMalePremium,
  "female-abaya": personaFemaleAbaya,
  "retail-seller": personaRetailSeller,
};

function absoluteAssetUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return typeof window === "undefined" ? value : new URL(value, window.location.origin).toString();
}

function fmtDate(value: string | null) {
  return value ? new Date(value).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" }) : "—";
}

function AdminVideoProvidersPage() {
  const fetchProviders = useServerFn(listVideoProviderConfigs);
  const fetchAttempts = useServerFn(listVideoProviderAttemptSummary);
  const updateProvider = useServerFn(updateVideoProviderConfig);
  const testProvider = useServerFn(testVideoProviderConnection);
  const testRouter = useServerFn(testVideoRouterDryRun);
  const previewSaudiFalPrompt = useServerFn(previewSaudiFalVideoTestPrompt);
  const runSaudiFalTest = useServerFn(runSaudiFalVideoModelTest);
  const auditPilotLibrary = useServerFn(auditSaudiVideoPilotLibrary);
  const buildPilotMatrix = useServerFn(buildSaudiVideoPilotMatrix);
  const [providers, setProviders] = useState<AdminVideoProviderConfig[]>([]);
  const [attempts, setAttempts] = useState<AdminVideoProviderAttemptSummary[]>([]);
  const [routerResults, setRouterResults] = useState<Array<AdminVideoRouterTestResult & { scenarioLabel: string }>>([]);
  const [pilotAudit, setPilotAudit] = useState<SaudiVideoPilotAuditResult | null>(null);
  const [pilotMatrix, setPilotMatrix] = useState<SaudiVideoPilotMatrixResult | null>(null);
  const [falPreview, setFalPreview] = useState<SaudiFalPromptPreview | null>(null);
  const [falTestResult, setFalTestResult] = useState<SaudiFalModelTestResult | null>(null);
  const [falDraft, setFalDraft] = useState<SaudiFalDraft>({ modelId: FAL_VIDEO_TEST_MODELS[0].id, personaId: SAUDI_VIDEO_PERSONAS[0].id, scenarioId: SAUDI_VIDEO_TEST_SCENARIOS[0].id, includeProductImage: true, includeVoice: true });
  const [productImageUrl, setProductImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [testingRouter, setTestingRouter] = useState(false);
  const [auditingPilot, setAuditingPilot] = useState(false);
  const [buildingMatrix, setBuildingMatrix] = useState(false);
  const [loadingFalPreview, setLoadingFalPreview] = useState(false);
  const [runningFalTest, setRunningFalTest] = useState(false);

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
        { label: "سريع 5ث بلا صور", quality: "fast", aspectRatio: "9:16", durationSeconds: 5, hasStartingFrame: false, imageCount: 0 },
        { label: "إعلاني 8ث بصورة منتج", quality: "lite", aspectRatio: "9:16", durationSeconds: 8, hasStartingFrame: true, imageCount: 1 },
        { label: "احترافي 8ث بشخص ومنتج", quality: "quality", aspectRatio: "16:9", durationSeconds: 8, hasStartingFrame: true, imageCount: 2 },
      ] as const;
      const results = await Promise.all(scenarios.map(async ({ label, ...scenario }) => ({ ...(await testRouter({ data: scenario, headers })), scenarioLabel: label })));
      setRouterResults(results);
      const passed = results.filter((result) => result.ok).length;
      toast[passed === results.length ? "success" : "error"](`نجح ${passed.toLocaleString("ar-SA")} من ${results.length.toLocaleString("ar-SA")} مسارات للراوتر`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل اختبار الراوتر");
    } finally {
      setTestingRouter(false);
    }
  }

  async function auditPromptLibrary() {
    setAuditingPilot(true);
    try {
      const headers = await authHeaders();
      const result = await auditPilotLibrary({ headers });
      setPilotAudit(result);
      toast[result.readyForPilot ? "success" : "error"](`جاهزية مكتبة البرومبتات: ${result.passRate.toLocaleString("ar-SA")}%`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل تدقيق مكتبة البرومبتات");
    } finally {
      setAuditingPilot(false);
    }
  }

  async function buildPilotTestMatrix() {
    setBuildingMatrix(true);
    try {
      const headers = await authHeaders();
      const result = await buildPilotMatrix({ headers });
      setPilotMatrix(result);
      toast.success(`تم تجهيز ${result.totalSamples.toLocaleString("ar-SA")} عينات اختبار تجاري`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل تجهيز مصفوفة الاختبار");
    } finally {
      setBuildingMatrix(false);
    }
  }

  async function buildFalPromptPreview() {
    setLoadingFalPreview(true);
    try {
      const headers = await authHeaders();
      const result = await previewSaudiFalPrompt({ data: falDraft, headers });
      setFalPreview(result);
      toast.success("تم تجهيز برومبت الاختبار السعودي");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل تجهيز برومبت الاختبار");
    } finally {
      setLoadingFalPreview(false);
    }
  }

  async function runFalModelTest() {
    setRunningFalTest(true);
    try {
      const headers = await authHeaders();
      const result = await runSaudiFalTest({ data: { ...falDraft, personaImageUrl: absoluteAssetUrl(PERSONA_IMAGES[falDraft.personaId]), productImageUrl }, headers });
      setFalTestResult(result);
      setFalPreview(result);
      toast[result.ok ? "success" : "error"](result.ok ? "تم إرسال اختبار fal.ai الفعلي" : result.error ?? "فشل اختبار النموذج");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل اختبار fal.ai الفعلي");
    } finally {
      setRunningFalTest(false);
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
          <Button variant="outline" size="sm" onClick={() => void auditPromptLibrary()} disabled={loading || auditingPilot}>
            {auditingPilot ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />} تدقيق مكتبة البرومبتات
          </Button>
          <Button variant="outline" size="sm" onClick={() => void buildPilotTestMatrix()} disabled={loading || buildingMatrix}>
            {buildingMatrix ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />} مصفوفة الاختبار
          </Button>
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
          {pilotAudit && <PilotAuditPanel audit={pilotAudit} />}
          {pilotMatrix && <PilotMatrixPanel matrix={pilotMatrix} />}
          <SaudiFalTestPanel draft={falDraft} productImageUrl={productImageUrl} preview={falPreview} testResult={falTestResult} loading={loadingFalPreview} running={runningFalTest} onDraft={setFalDraft} onProductImageUrl={setProductImageUrl} onPreview={() => void buildFalPromptPreview()} onRun={() => void runFalModelTest()} />
          {routerResults.length > 0 && <RouterResultPanel results={routerResults} />}
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

function PilotAuditPanel({ audit }: { audit: SaudiVideoPilotAuditResult }) {
  const topIssues = audit.findings.filter((item) => item.issues.length > 0).slice(0, 5);
  return (
    <section className="mb-4 rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-extrabold">تدقيق مكتبة البرومبتات السعودية</h2>
          <p className="mt-1 text-xs text-muted-foreground">فحص جودة البرومبتات قبل الاختبار العملي: الصوت، المنتج، قيود التشوهات، ومنع النص العربي المرئي.</p>
        </div>
        <Badge className={cn(audit.readyForPilot ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")}>{audit.passRate.toLocaleString("ar-SA")}% جاهزية</Badge>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-secondary/30 p-3 text-xs"><strong>{audit.passCount.toLocaleString("ar-SA")}/{audit.totalTemplates.toLocaleString("ar-SA")}</strong><p className="mt-1 text-muted-foreground">قوالب اجتازت معيار 80%</p></div>
        <div className="rounded-lg border border-border bg-secondary/30 p-3 text-xs"><strong>{audit.sectorCoverage.length.toLocaleString("ar-SA")}</strong><p className="mt-1 text-muted-foreground">قطاعات مغطاة</p></div>
        <div className="rounded-lg border border-border bg-secondary/30 p-3 text-xs"><strong>{Object.entries(audit.riskMix).map(([k, v]) => `${k}: ${v}`).join(" · ")}</strong><p className="mt-1 text-muted-foreground">توزيع المخاطر</p></div>
      </div>
      {topIssues.length > 0 && <div className="mt-3 space-y-2">{topIssues.map((item) => <div key={item.templateId} className="rounded-lg border border-border bg-background/60 p-3 text-xs"><strong>{item.label} — {item.score}%</strong><p className="mt-1 text-muted-foreground">{item.issues.join(" · ")}</p></div>)}</div>}
    </section>
  );
}

function SaudiFalTestPanel({ draft, productImageUrl, preview, testResult, loading, running, onDraft, onProductImageUrl, onPreview, onRun }: { draft: SaudiFalDraft; productImageUrl: string; preview: SaudiFalPromptPreview | null; testResult: SaudiFalModelTestResult | null; loading: boolean; running: boolean; onDraft: (next: SaudiFalDraft) => void; onProductImageUrl: (value: string) => void; onPreview: () => void; onRun: () => void }) {
  return (
    <section className="mb-4 rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-extrabold">اختبار fal.ai بالصور الحالية</h2>
          <p className="mt-1 text-xs text-muted-foreground">يستخدم شخصيات قسم الفيديو نفسها مع برومبت سعودي واضح للحركة والصوت قبل أي اعتماد إنتاجي.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onPreview} disabled={loading || running}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clapperboard className="h-4 w-4" />} تجهيز البرومبت</Button>
          <Button type="button" size="sm" onClick={onRun} disabled={loading || running}>{running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />} اختبار فعلي</Button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <SelectBox label="النموذج" value={draft.modelId} onChange={(modelId) => onDraft({ ...draft, modelId })} options={FAL_VIDEO_TEST_MODELS.map((model) => ({ value: model.id, label: model.label }))} />
        <SelectBox label="صورة الشخصية" value={draft.personaId} onChange={(personaId) => onDraft({ ...draft, personaId })} options={SAUDI_VIDEO_PERSONAS.map((persona) => ({ value: persona.id, label: persona.label }))} />
        <SelectBox label="السيناريو السعودي" value={draft.scenarioId} onChange={(scenarioId) => onDraft({ ...draft, scenarioId })} options={SAUDI_VIDEO_TEST_SCENARIOS.map((scenario) => ({ value: scenario.id, label: scenario.label }))} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block rounded-lg border border-border bg-secondary/30 p-3">
          <span className="text-sm font-bold">رابط صورة المنتج الاختيارية</span>
          <Input value={productImageUrl} onChange={(event) => onProductImageUrl(event.target.value)} placeholder="https://..." className="mt-2 h-9 text-xs" />
        </label>
        <ControlRow label="إضافة صورة منتج" hint="لقياس التزام النموذج بالمنتج داخل الإعلان">
          <Switch checked={draft.includeProductImage} onCheckedChange={(includeProductImage) => onDraft({ ...draft, includeProductImage })} />
        </ControlRow>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <ControlRow label="طلب صوت سعودي" hint="يطبّق فقط على النماذج التي تدعم الصوت">
          <Switch checked={draft.includeVoice} onCheckedChange={(includeVoice) => onDraft({ ...draft, includeVoice })} />
        </ControlRow>
        {testResult && <div className={cn("rounded-lg border p-3 text-xs", testResult.ok ? "border-success/30 bg-success/10 text-success" : "border-destructive/30 bg-destructive/10 text-destructive")}>{testResult.ok ? `الحالة: ${testResult.status} · ${testResult.latencyMs}ms · $${testResult.estimatedCostUsd ?? "—"}` : testResult.error}</div>}
      </div>
      {preview && (
        <div className="mt-4 grid gap-3 lg:grid-cols-[220px_1fr]">
          <div className="rounded-lg border border-border bg-secondary/30 p-3 text-xs leading-6">
            <p className="font-bold">التقييم: {preview.imageEvaluation.score.toLocaleString("ar-SA")}/100</p>
            <p className="mt-1 text-muted-foreground">{preview.imageEvaluation.recommendation}</p>
            <p className="mt-2 text-muted-foreground">{preview.model.label} · {preview.persona.label} · {preview.scenario.label}</p>
          </div>
          <Textarea readOnly value={preview.prompt} className="min-h-56 text-left text-xs leading-6" dir="ltr" />
        </div>
      )}
    </section>
  );
}

function SelectBox({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-muted-foreground">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-xs">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function RouterResultPanel({ results }: { results: Array<AdminVideoRouterTestResult & { scenarioLabel: string }> }) {
  const allPassed = results.every((result) => result.ok);
  return (
    <section className="mb-4 rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-extrabold">نتيجة اختبار الراوتر</h2>
          <p className="mt-1 text-xs text-muted-foreground">مسارات آمنة: سريع/إعلاني/احترافي مع 0–2 صور، دون إنشاء فيديو أو خصم نقاط</p>
        </div>
        <Badge className={cn(allPassed ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")}>{allPassed ? "كل المسارات جاهزة" : "يوجد مسار يحتاج ضبط"}</Badge>
      </div>
      <div className="mt-3 space-y-3">
        {results.map((result) => (
          <div key={result.scenarioLabel} className="rounded-lg border border-border bg-secondary/30 p-3 text-xs">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="font-extrabold">{result.scenarioLabel}</span>
              <Badge className={cn(result.ok ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")}>{result.ok ? `المختار: ${result.selectedProvider}` : "لا يوجد مزود مؤهل"}</Badge>
            </div>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {result.candidates.map((candidate) => (
                <div key={candidate.providerKey} className="rounded-md border border-border bg-background/60 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold">{candidate.displayName}</span>
                    <Badge variant="secondary">#{candidate.effectivePriority === candidate.priority ? candidate.priority : `${candidate.priority}→${candidate.effectivePriority}`}</Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">{candidate.mode} · {candidate.reason}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CostInput({ label, value, disabled, onCommit }: { label: string; value: number; disabled: boolean; onCommit: (value: number) => void }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const next = Number(draft);
    if (Number.isFinite(next) && next >= 0 && next !== value) onCommit(Math.round(next));
  };
  return (
    <label className="block">
      <span className="text-[10px] font-bold text-muted-foreground">{label}</span>
      <Input value={draft} type="number" min={0} max={100000} disabled={disabled} onChange={(event) => setDraft(event.target.value)} onBlur={commit} className="mt-1 h-8 text-xs" />
    </label>
  );
}

function ProviderCapabilities({ metadata, provider }: { metadata: AdminVideoProviderConfig["metadata"]; provider: AdminVideoProviderConfig }) {
  const data = (metadata as { supports_two_images?: boolean; supports_voice?: boolean } | null) ?? {};
  const caps = [
    provider.supports_starting_frame ? "صورة مرجعية" : "بدون صور",
    data.supports_two_images ? "صورتان" : "صورة واحدة",
    data.supports_voice ? "صوت" : "بدون صوت مؤكد",
    provider.supports_9_16 ? "9:16" : null,
    provider.supports_1_1 ? "1:1" : null,
    provider.supports_16_9 ? "16:9" : null,
  ].filter(Boolean);
  return <p className="mt-2">القدرات: {caps.join(" · ")}</p>;
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
