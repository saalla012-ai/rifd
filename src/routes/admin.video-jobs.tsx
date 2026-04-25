import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Clapperboard, Coins, DollarSign, Loader2, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { AdminGuard, adminBeforeLoad } from "@/components/admin-guard";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { listAdminVideoJobs, type AdminVideoJob, type AdminVideoStats } from "@/server/admin-video";

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

function AdminVideoJobsPage() {
  const fetchJobs = useServerFn(listAdminVideoJobs);
  const [rows, setRows] = useState<AdminVideoJob[]>([]);
  const [stats, setStats] = useState<AdminVideoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"all" | "pending" | "processing" | "completed" | "failed" | "refunded">("all");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("لا توجد جلسة");
      const r = await fetchJobs({
        data: { status, limit: 150 },
        headers: { Authorization: `Bearer ${session.access_token}` },
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
                    <span className="text-sm font-bold">{job.quality === "quality" ? "Quality" : "Fast"}</span>
                    <span className="text-xs text-muted-foreground">{job.aspect_ratio} · {job.duration_seconds}ث</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-foreground">{job.prompt}</p>
                  {job.error_message && <p className="mt-2 flex items-center gap-1 text-xs font-medium text-destructive"><AlertTriangle className="h-3.5 w-3.5" /> {job.error_message}</p>}
                  <div className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{job.user_store || job.user_email || job.user_id.slice(0, 8)}</span>
                    <span className="mx-1">·</span>
                    <span>{fmtDate(job.created_at)}</span>
                    {job.provider_job_id && <span className="mx-1">· provider: {job.provider_job_id.slice(0, 10)}</span>}
                  </div>
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
