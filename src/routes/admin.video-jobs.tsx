import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, Clapperboard, Coins, Copy, DollarSign, ExternalLink, Loader2, RefreshCw, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { AdminGuard, adminBeforeLoad } from "@/components/admin-guard";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { VIDEO_QUALITY_LABELS } from "@/lib/plan-catalog";
import { completeManualVideoJob, listAdminVideoJobs, refundManualVideoJob, type AdminVideoJob, type AdminVideoStats } from "@/server/admin-video";

export const Route = createFileRoute("/admin/video-jobs")({
  beforeLoad: adminBeforeLoad,
  head: () => ({ meta: [{ title: "إدارة الفيديو والتكلفة — رِفد" }] }),
  component: () => (
    <AdminGuard loadingLabel="جاري تحميل إدارة الفيديو…">
      <AdminVideoJobsPage />
    </AdminGuard>
  ),
});

const STATUS_LABEL: Record<string, string> = {
  all: "كل الحالات",
  pending: "بانتظار المعالجة",
  processing: "قيد المعالجة",
  completed: "مكتمل",
  failed: "فشل",
  refunded: "تم رد النقاط",
};

const STATUS_TONE: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  processing: "bg-warning/20 text-warning-foreground",
  completed: "bg-success/15 text-success",
  failed: "bg-destructive/15 text-destructive",
  refunded: "bg-gold/15 text-gold",
};

function fmt(n: number) {
  return n.toLocaleString("ar-SA");
}

function fmtDate(s: string) {
  return new Date(s).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" });
}

function providerAttempts(metadata: AdminVideoJob["metadata"]) {
  const attempts = (metadata as { provider_attempts?: Array<{ provider?: string; ok?: boolean; status?: string; error?: string }> } | null)?.provider_attempts;
  return Array.isArray(attempts) ? attempts.slice(-3) : [];
}

function AdminVideoJobsPage() {
  const fetchJobs = useServerFn(listAdminVideoJobs);
  const completeJob = useServerFn(completeManualVideoJob);
  const refundJob = useServerFn(refundManualVideoJob);
  const [rows, setRows] = useState<AdminVideoJob[]>([]);
  const [stats, setStats] = useState<AdminVideoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingJobId, setSavingJobId] = useState<string | null>(null);
  const [resultUrls, setResultUrls] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"all" | "pending" | "processing" | "completed" | "failed" | "refunded">("all");
  const [search, setSearch] = useState("");

  async function authHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("لا توجد جلسة");
    return { Authorization: `Bearer ${session.access_token}` };
  }

  async function load() {
    setLoading(true);
    try {
      const headers = await authHeaders();
      const r = await fetchJobs({
        data: { status, limit: 150 },
        headers,
      });
      setRows(r.rows);
      setStats(r.stats);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل تحميل مهام الفيديو");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const filtered = rows.filter((row) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return row.user_email?.toLowerCase().includes(s) || row.user_store?.toLowerCase().includes(s) || row.id.toLowerCase().includes(s) || row.prompt.toLowerCase().includes(s);
  });

  async function copyPrompt(prompt: string) {
    await navigator.clipboard.writeText(prompt);
    toast.success("تم نسخ وصف الفيديو");
  }

  function patchRow(job: AdminVideoJob) {
    setRows((current) => current.map((row) => row.id === job.id ? { ...row, ...job, user_email: row.user_email, user_store: row.user_store } : row));
  }

  async function completeManual(jobId: string) {
    setSavingJobId(jobId);
    try {
      const headers = await authHeaders();
      const result = await completeJob({ data: { jobId, resultUrl: resultUrls[jobId]?.trim() }, headers });
      patchRow(result.job);
      toast.success("تم إكمال مهمة الفيديو");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل إكمال المهمة");
    } finally {
      setSavingJobId(null);
    }
  }

  async function refundManual(jobId: string) {
    setSavingJobId(jobId);
    try {
      const headers = await authHeaders();
      const result = await refundJob({ data: { jobId, reason: "تعذر تنفيذ مهمة الفيديو يدوياً" }, headers });
      patchRow(result.job);
      toast.success("تم رد نقاط المهمة");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل رد النقاط");
    } finally {
      setSavingJobId(null);
    }
  }

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold">
            <Clapperboard className="h-6 w-6 text-primary" /> إدارة الفيديو والتكلفة
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">مراقبة مهام الفيديو، حالة المزود، النقاط المستهلكة، والتكلفة التقديرية</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> تحديث
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/video-providers"><SlidersHorizontal className="h-4 w-4" /> مزودو الفيديو</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/credit-ledger"><Coins className="h-4 w-4" /> دفتر النقاط</Link>
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="إجمالي المهام" value={fmt(stats?.total ?? 0)} />
        <StatCard label="قيد المعالجة" value={fmt(stats?.processing ?? 0)} tone="warning" />
        <StatCard label="مكتملة" value={fmt(stats?.completed ?? 0)} tone="success" />
        <StatCard label="مسترجعة" value={fmt(stats?.refunded ?? 0)} tone="gold" />
        <StatCard label="تكلفة العينة" value={`$${(stats?.estimatedCostUsd ?? 0).toFixed(2)}`} icon="cost" />
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="w-full sm:w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_LABEL).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالبريد، المتجر، prompt أو job id…" className="pr-9" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">لا توجد مهام فيديو مطابقة.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="divide-y divide-border">
            {filtered.map((job) => (
              <article key={job.id} className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_210px]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={cn(STATUS_TONE[job.status] ?? "bg-muted")}>{STATUS_LABEL[job.status] ?? job.status}</Badge>
                    <span className="text-sm font-bold">{VIDEO_QUALITY_LABELS[job.quality]}</span>
                    <span className="text-xs text-muted-foreground">{job.aspect_ratio} · {job.duration_seconds}ث</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-foreground">{job.prompt}</p>
                  {job.error_message && <p className="mt-2 flex items-center gap-1 text-xs font-medium text-destructive"><AlertTriangle className="h-3.5 w-3.5" /> {job.error_message}</p>}
                  <div className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{job.user_store || job.user_email || job.user_id.slice(0, 8)}</span>
                    <span className="mx-1">·</span>
                    <span>{fmtDate(job.created_at)}</span>
                    {job.provider && <span className="mx-1">· {job.provider}</span>}
                  </div>
                  {providerAttempts(job.metadata).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {providerAttempts(job.metadata).map((attempt, index) => (
                        <Badge key={`${job.id}-${index}`} variant="secondary" className={cn("max-w-full truncate", attempt.ok === false && "bg-destructive/15 text-destructive", attempt.ok === true && "bg-success/15 text-success")}>
                          {attempt.provider ?? "provider"}: {attempt.status ?? (attempt.ok ? "ok" : "failed")}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {job.status === "processing" && Boolean((job.metadata as { manual_required?: boolean } | null)?.manual_required) && (
                    <div className="mt-3 rounded-lg border border-border bg-secondary/30 p-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs font-bold text-foreground">تنفيذ يدوي مطلوب</p>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => void copyPrompt(job.prompt)}>
                            <Copy className="h-4 w-4" /> نسخ الوصف
                          </Button>
                          <Button type="button" variant="outline" size="sm" asChild>
                            <a href="https://labs.google/fx/ar/tools/flow" target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> فتح Flow</a>
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                        <Input
                          dir="ltr"
                          inputMode="url"
                          value={resultUrls[job.id] ?? ""}
                          onChange={(event) => setResultUrls((current) => ({ ...current, [job.id]: event.target.value }))}
                          placeholder="https://..."
                          className="h-9 text-left"
                          disabled={savingJobId === job.id}
                        />
                        <Button type="button" size="sm" onClick={() => void completeManual(job.id)} disabled={savingJobId === job.id || !resultUrls[job.id]?.trim()}>
                          {savingJobId === job.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} حفظ النتيجة
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => void refundManual(job.id)} disabled={savingJobId === job.id}>
                          <RotateCcw className="h-4 w-4" /> رد النقاط
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 lg:grid-cols-2">
                  <MiniMetric label="نقاط" value={fmt(job.credits_charged)} />
                  <MiniMetric label="تكلفة" value={`$${Number(job.estimated_cost_usd ?? 0).toFixed(2)}`} />
                  <MiniMetric label="Ledger" value={job.ledger_id ? job.ledger_id.slice(0, 8) : "—"} />
                  <MiniMetric label="Refund" value={job.refund_ledger_id ? job.refund_ledger_id.slice(0, 8) : "—"} />
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function StatCard({ label, value, tone, icon }: { label: string; value: string; tone?: "warning" | "success" | "gold"; icon?: "cost" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        {icon === "cost" && <DollarSign className="h-4 w-4 text-primary" />}
      </div>
      <p className={cn("mt-1 text-2xl font-extrabold tabular-nums", tone === "warning" && "text-warning-foreground", tone === "success" && "text-success", tone === "gold" && "text-gold")}>{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate font-bold tabular-nums">{value}</p>
    </div>
  );
}
