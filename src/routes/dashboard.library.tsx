import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Star, Copy, Trash2, Image as ImageIcon, FileText, Loader2, Clapperboard, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { VIDEO_QUALITY_LABELS } from "@/lib/plan-catalog";
import { listVideoJobs, refreshVideoJob } from "@/server/video-functions";

export const Route = createFileRoute("/dashboard/library")({
  head: () => ({ meta: [{ title: "مكتبتي — رِفد" }] }),
  component: LibraryPage,
});

type Generation = {
  id: string;
  type: "text" | "image" | "image_enhance";
  prompt: string;
  result: string | null;
  template: string | null;
  is_favorite: boolean;
  created_at: string;
  metadata: { template_title?: string; campaign_pack_id?: string; campaign_product?: string; campaign_goal?: string; campaign_channel?: string } | null;
};

type VideoJob = Awaited<ReturnType<typeof listVideoJobs>>["jobs"][number];

const VIDEO_STATUS_LABEL: Record<string, string> = {
  processing: "قيد المعالجة",
  completed: "مكتمل",
  refunded: "تم رد النقاط",
  failed: "فشل",
  pending: "بانتظار المعالجة",
};

function LibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const listVideoJobsFn = useServerFn(listVideoJobs);
  const refreshVideoJobFn = useServerFn(refreshVideoJob);
  const [items, setItems] = useState<Generation[]>([]);
  const [videoJobs, setVideoJobs] = useState<VideoJob[]>([]);
  const [refreshingJobId, setRefreshingJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "text" | "image" | "video" | "fav">("all");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    void load();
  }, [authLoading, user]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("generations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) toast.error(error.message);
      setItems((data as Generation[] | null) ?? []);

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          const out = await listVideoJobsFn({ headers: { Authorization: `Bearer ${session.access_token}` } });
          setVideoJobs(out.jobs);
        } catch {
          setVideoJobs([]);
          toast.error("تعذر تحميل الفيديوهات مؤقتاً");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleFav = async (id: string, current: boolean) => {
    setItems((s) => s.map((i) => (i.id === id ? { ...i, is_favorite: !current } : i)));
    const { error } = await supabase
      .from("generations")
      .update({ is_favorite: !current })
      .eq("id", id);
    if (error) {
      setItems((s) => s.map((i) => (i.id === id ? { ...i, is_favorite: current } : i)));
      toast.error("فشل التحديث");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("متأكد من الحذف؟")) return;
    const prev = items;
    setItems((s) => s.filter((i) => i.id !== id));
    const { error } = await supabase.from("generations").delete().eq("id", id);
    if (error) {
      setItems(prev);
      toast.error("فشل الحذف");
    } else {
      toast.success("تم الحذف");
    }
  };

  const refreshVideo = async (jobId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return toast.error("سجّل الدخول لتحديث حالة الفيديو");
    setRefreshingJobId(jobId);
    try {
      const out = await refreshVideoJobFn({ data: { jobId }, headers: { Authorization: `Bearer ${session.access_token}` } });
      setVideoJobs((jobs) => jobs.map((job) => (job.id === out.job.id ? out.job : job)));
      toast.success(out.job.status === "completed" ? "اكتمل الفيديو" : "تم تحديث الحالة");
    } catch {
      toast.error("تعذر تحديث حالة الفيديو مؤقتاً");
    } finally {
      setRefreshingJobId(null);
    }
  };

  useEffect(() => {
    if (authLoading || !user || !videoJobs.some((job) => job.status === "processing")) return;
    const id = window.setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const processingJobs = videoJobs.filter((job) => job.status === "processing").slice(0, 2);
      await Promise.allSettled(processingJobs.map(async (job) => {
        const out = await refreshVideoJobFn({ data: { jobId: job.id }, headers: { Authorization: `Bearer ${session.access_token}` } });
        setVideoJobs((jobs) => jobs.map((current) => (current.id === out.job.id ? out.job : current)));
      }));
    }, 15_000);
    return () => window.clearInterval(id);
  }, [authLoading, user, videoJobs, refreshVideoJobFn]);

  const filtered = items.filter((i) => {
    if (filter === "all") return true;
    if (filter === "fav") return i.is_favorite;
    if (filter === "video") return false;
    if (filter === "text") return i.type === "text";
    if (filter === "image") return i.type === "image" || i.type === "image_enhance";
    return true;
  });

  const campaignItemCount = items.filter((item) => item.metadata?.campaign_pack_id).length
    + videoJobs.filter((job) => (job.metadata as { campaign_pack_id?: string } | null)?.campaign_pack_id).length;
  const shouldShowVideoSection = videoJobs.length > 0 && (filter === "all" || filter === "video");
  const hasVisibleItems = filter === "video"
    ? videoJobs.length > 0
    : filtered.length > 0 || (filter === "all" && videoJobs.length > 0);

  return (
    <DashboardShell>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">مكتبتي</h1>
          <p className="mt-1 text-sm text-muted-foreground">المفضلة وكل توليداتك السابقة، مع ربط مخرجات الحملات بسياقها</p>
        </div>
        <div className="text-xs text-muted-foreground">{items.length + videoJobs.length} توليدة • {campaignItemCount} من حملة</div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {[
          { id: "all", label: "الكل" },
          { id: "text", label: "نصوص" },
          { id: "image", label: "صور" },
          { id: "video", label: "فيديو" },
          { id: "fav", label: "المفضلة ⭐" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as typeof filter)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              filter === f.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground hover:bg-accent"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : !hasVisibleItems ? (
        <div className="mt-6 rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          ما عندك توليدات بعد. ابدأ من{" "}
          <Link to="/dashboard/generate-text" className="text-primary hover:underline">توليد نص</Link>{" "}
          أو{" "}
          <Link to="/dashboard/generate-image" className="text-primary hover:underline">توليد صور</Link>{" "}
          أو{" "}
          <Link to="/dashboard/generate-video" className="text-primary hover:underline">توليد فيديو</Link>.
        </div>
      ) : (
        <>
        {shouldShowVideoSection && <VideoJobsSection jobs={videoJobs} refreshingJobId={refreshingJobId} onRefresh={refreshVideo} />}
        {filter !== "video" && <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((g) => (
            <article key={g.id} className="rounded-xl border border-border bg-card p-4 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {g.type === "text" ? <FileText className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                  <span>{g.metadata?.template_title ?? g.template ?? (g.type === "text" ? "نص" : "صورة")}</span>
                </div>
                <button onClick={() => toggleFav(g.id, g.is_favorite)} aria-label="مفضلة">
                  <Star className={cn("h-4 w-4", g.is_favorite ? "fill-gold text-gold" : "text-muted-foreground")} />
                </button>
              </div>
              <div className="mt-3">
                {g.metadata?.campaign_pack_id && (
                  <div className="mb-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-[11px] leading-5 text-primary">
                    من حملة: {g.metadata.campaign_product || "Campaign Pack"} · {g.metadata.campaign_channel || "قناة"}
                  </div>
                )}
                {g.type === "text" ? (
                  <pre className="line-clamp-6 whitespace-pre-wrap text-right font-sans text-xs leading-relaxed text-foreground">
                    {g.result ?? ""}
                  </pre>
                ) : g.result ? (
                  <img src={g.result} alt={g.prompt} className="aspect-square w-full rounded-lg object-cover" />
                ) : null}
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
                <span className="text-[10px] text-muted-foreground">
                  {new Date(g.created_at).toLocaleDateString("ar-SA")}
                </span>
                <div className="flex gap-1">
                  {g.type === "text" && g.result && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { navigator.clipboard.writeText(g.result!); toast.success("تم النسخ"); }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => remove(g.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>}
        </>
      )}
    </DashboardShell>
  );
}

function VideoJobsSection({ jobs, refreshingJobId, onRefresh }: { jobs: VideoJob[]; refreshingJobId: string | null; onRefresh: (jobId: string) => void }) {
  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Clapperboard className="h-4 w-4 text-primary" />
          <div>
            <h2 className="text-sm font-extrabold">فيديوهاتك</h2>
            <p className="text-xs text-muted-foreground">كل مهام الفيديو محفوظة بحالتها ونقاطها داخل المكتبة.</p>
          </div>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to="/dashboard/generate-video">فتح الفيديوهات</Link>
        </Button>
      </div>
      {jobs.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.slice(0, 9).map((job) => (
            <article key={job.id} className="overflow-hidden rounded-lg border border-border bg-secondary/20">
              <div className="flex aspect-video items-center justify-center bg-secondary/50">
                {job.result_url ? <video src={job.result_url} controls className="h-full w-full object-cover" /> : <Clapperboard className="h-7 w-7 text-primary" />}
              </div>
              <div className="space-y-2 p-3 text-xs">
                {(job.metadata as { campaign_pack_id?: string; campaign_product?: string; campaign_channel?: string } | null)?.campaign_pack_id && (
                  <div className="rounded-md border border-primary/20 bg-primary/5 px-2 py-1 text-[10px] font-bold text-primary">
                    من حملة: {(job.metadata as { campaign_product?: string; campaign_channel?: string }).campaign_product || "Campaign Pack"} · {(job.metadata as { campaign_channel?: string }).campaign_channel || "قناة"}
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold">{job.quality === "quality" ? VIDEO_QUALITY_LABELS.quality : VIDEO_QUALITY_LABELS.fast}</span>
                  <span className="rounded-full bg-background px-2 py-0.5 font-bold">{VIDEO_STATUS_LABEL[job.status] ?? job.status}</span>
                </div>
                <p className="line-clamp-2 text-muted-foreground">{job.prompt}</p>
                <div className="flex items-center justify-between border-t border-border pt-2 text-[10px] text-muted-foreground">
                  <span>{new Date(job.created_at).toLocaleDateString("ar-SA")}</span>
                  <span>{job.credits_charged.toLocaleString("ar-SA")} نقطة</span>
                </div>
                {job.status === "processing" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-full gap-2 text-xs"
                    disabled={refreshingJobId === job.id}
                    onClick={() => onRefresh(job.id)}
                  >
                    <RefreshCw className={cn("h-3 w-3", refreshingJobId === job.id && "animate-spin")} />
                    تحديث الحالة
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
