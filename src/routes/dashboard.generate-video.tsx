import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useRouter, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Clapperboard, Crown, Download, Film, Loader2, MonitorSmartphone, RefreshCw, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QuotaExceededDialog, isQuotaError } from "@/components/quota-exceeded-dialog";
import { generateVideo, listVideoJobs, refreshVideoJob } from "@/server/video-functions";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics/posthog";
import { useCreditsSummary } from "@/hooks/use-credits-summary";

type VideoQuality = "fast" | "quality";
type AspectRatio = "9:16" | "1:1" | "16:9";
type VideoJob = Awaited<ReturnType<typeof listVideoJobs>>["jobs"][number];
type VideoSearch = { prompt?: string };

const QUALITY = {
  fast: { label: "Fast", cost: 150, icon: Zap, note: "للاختبار السريع والمحتوى اليومي" },
  quality: { label: "Quality", cost: 450, icon: Crown, note: "للإعلانات المدفوعة واللقطات النهائية" },
} satisfies Record<VideoQuality, { label: string; cost: number; icon: typeof Zap; note: string }>;

const ASPECTS: Array<{ value: AspectRatio; label: string; hint: string }> = [
  { value: "9:16", label: "Reels / TikTok", hint: "عمودي" },
  { value: "1:1", label: "Feed", hint: "مربع" },
  { value: "16:9", label: "YouTube", hint: "أفقي" },
];

const STATUS_LABEL: Record<string, string> = {
  pending: "بانتظار المعالجة",
  processing: "قيد المعالجة",
  completed: "مكتمل",
  failed: "فشل",
  refunded: "تم رد النقاط",
};

export const Route = createFileRoute("/dashboard/generate-video")({
  head: () => ({ meta: [{ title: "توليد فيديو — رِفد" }] }),
  validateSearch: (s: Record<string, unknown>): VideoSearch => ({
    prompt: typeof s.prompt === "string" ? s.prompt : undefined,
  }),
  component: GenerateVideoPage,
});

function GenerateVideoPage() {
  const router = useRouter();
  const search = useSearch({ from: "/dashboard/generate-video" });
  const generateVideoFn = useServerFn(generateVideo);
  const listVideoJobsFn = useServerFn(listVideoJobs);
  const refreshVideoJobFn = useServerFn(refreshVideoJob);
  const { data: credits, refresh: refreshCredits } = useCreditsSummary();
  const [quality, setQuality] = useState<VideoQuality>("fast");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [durationSeconds, setDurationSeconds] = useState<5 | 8>(5);
  const [prompt, setPrompt] = useState(search.prompt ?? "");
  const [startingFrameUrl, setStartingFrameUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [activeJob, setActiveJob] = useState<VideoJob | null>(null);
  const [quotaDialog, setQuotaDialog] = useState<{ open: boolean; reason?: string }>({ open: false });

  const selectedQuality = QUALITY[quality];
  const selectedCost = selectedQuality.cost;
  const hasEnoughCredits = credits ? credits.totalCredits >= selectedCost : true;
  const latestResult = activeJob?.result_url ?? jobs.find((job) => job.result_url)?.result_url ?? null;
  const promptCount = useMemo(() => prompt.trim().length, [prompt]);

  const loadJobs = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const out = await listVideoJobsFn({ headers: { Authorization: `Bearer ${session.access_token}` } });
      setJobs(out.jobs);
      if (!activeJob && out.jobs[0]) setActiveJob(out.jobs[0]);
    } catch {
      // لا نزعج المستخدم عند فشل تحميل السجل المصغر
    }
  };

  useEffect(() => {
    void loadJobs();
  }, []);

  useEffect(() => {
    if (activeJob?.status !== "processing") return;
    const id = window.setInterval(() => void refreshActiveJob(false), 8_000);
    return () => window.clearInterval(id);
  }, [activeJob?.id, activeJob?.status]);

  const generate = async () => {
    if (prompt.trim().length < 10) {
      toast.error("اكتب وصف فيديو أوضح");
      return;
    }
    if (!hasEnoughCredits) {
      setQuotaDialog({ open: true, reason: `INSUFFICIENT_CREDITS: رصيد نقاط الفيديو لا يكفي (تحتاج ${selectedCost} نقطة فيديو).` });
      return;
    }
    setLoading(true);
    setQuotaDialog({ open: false });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("سجّل الدخول أولاً");
      const out = await generateVideoFn({
        data: { prompt, quality, aspectRatio, durationSeconds, startingFrameUrl: startingFrameUrl.trim() },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setActiveJob(out.job);
      setJobs((current) => [out.job, ...current.filter((job) => job.id !== out.job.id)].slice(0, 20));
      track("generation_created", { kind: "video", quality, aspect_ratio: aspectRatio, credits: out.creditsCharged });
      toast.success(out.pending ? "تم إنشاء مهمة الفيديو — جاري المعالجة" : "تم توليد الفيديو ✨");
      void refreshCredits();
      router.invalidate();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "فشل توليد الفيديو";
      if (isQuotaError(msg)) {
        setQuotaDialog({ open: true, reason: msg });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshActiveJob = async (showToast = true) => {
    if (!activeJob) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("سجّل الدخول أولاً");
      const out = await refreshVideoJobFn({
        data: { jobId: activeJob.id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setActiveJob(out.job);
      setJobs((current) => current.map((job) => job.id === out.job.id ? out.job : job));
      if (out.job.status !== "processing") void refreshCredits();
      if (showToast) toast.success(out.job.status === "processing" ? "الفيديو ما زال قيد المعالجة" : "تم تحديث حالة الفيديو");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل تحديث حالة الفيديو");
    }
  };

  return (
    <DashboardShell>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">توليد فيديو</h1>
          <p className="mt-1 text-sm text-muted-foreground">حوّل وصف حملتك إلى لقطة فيديو قصيرة بنقاط فيديو واضحة قبل التنفيذ</p>
        </div>
        <Button asChild variant="outline" size="sm" className="w-fit gap-1">
          <Link to="/dashboard/credits"><Sparkles className="h-3.5 w-3.5" /> شحن نقاط الفيديو</Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-5 rounded-xl border border-border bg-card p-5 shadow-soft">
          <div>
            <Label>جودة الفيديو</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(Object.keys(QUALITY) as VideoQuality[]).map((key) => {
                const option = QUALITY[key];
                const Icon = option.icon;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setQuality(key)}
                    className={cn(
                      "rounded-lg border p-4 text-right transition-colors",
                      quality === key ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/70"
                    )}
                  >
                    <Icon className={cn("mb-2 h-5 w-5", key === "quality" ? "text-gold" : "text-primary")} />
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold">{option.label}</span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-bold">{option.cost} نقطة</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{option.note}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_180px]">
            <div>
              <Label>المقاس</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {ASPECTS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setAspectRatio(item.value)}
                    className={cn(
                      "min-h-20 rounded-lg border px-2 py-3 text-center text-xs transition-colors",
                      aspectRatio === item.value ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary/70"
                    )}
                  >
                    <MonitorSmartphone className="mx-auto mb-1 h-4 w-4" />
                    <div className="font-bold">{item.label}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{item.hint}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>المدة</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[5, 8].map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => setDurationSeconds(duration as 5 | 8)}
                    className={cn(
                      "rounded-lg border px-3 py-4 text-sm font-bold transition-colors",
                      durationSeconds === duration ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary/70"
                    )}
                  >
                    {duration} ث
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <Label>وصف الفيديو</Label>
              <span className="text-xs text-muted-foreground">{promptCount.toLocaleString("ar-SA")} / 1800</span>
            </div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={1800}
              className="mt-2 min-h-36"
              placeholder="مثلاً: لقطة عمودية لمنتج عطر فاخر على خلفية خضراء وذهبية، حركة كاميرا بطيئة، ظهور نص عرض محدود، نهاية بشعار المتجر وCTA للطلب عبر واتساب"
            />
          </div>

          <div>
            <Label>رابط صورة بداية اختياري</Label>
            <input
              value={startingFrameUrl}
              onChange={(e) => setStartingFrameUrl(e.target.value)}
              placeholder="https://..."
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="rounded-lg border border-gold/30 bg-gold/5 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-foreground">سيتم خصم {selectedCost.toLocaleString("ar-SA")} نقطة فيديو</span>
              <span className={cn("text-xs", hasEnoughCredits ? "text-muted-foreground" : "font-bold text-destructive")}>{hasEnoughCredits ? "يتم الاسترجاع تلقائياً إذا فشل التوليد بعد الخصم" : "رصيدك الحالي لا يكفي لهذه الجودة"}</span>
            </div>
          </div>

          <Button onClick={generate} disabled={loading || !hasEnoughCredits} className="w-full gradient-primary text-primary-foreground shadow-elegant">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري توليد الفيديو...</> : <><Clapperboard className="h-4 w-4" /> ولّد الفيديو</>}
          </Button>
        </section>

        <aside className="space-y-5">
          <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-extrabold">المعاينة</h2>
              {activeJob?.status === "processing" && (
                <button type="button" onClick={() => void refreshActiveJob()} className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs hover:bg-accent">
                  <RefreshCw className="h-3 w-3" /> تحديث
                </button>
              )}
              {latestResult && (
                <a href={latestResult} target="_blank" rel="noreferrer" download className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs hover:bg-accent">
                  <Download className="h-3 w-3" /> فتح
                </a>
              )}
            </div>
            <div className="mt-3 flex aspect-[9/16] items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-secondary/30 text-center text-sm text-muted-foreground">
              {latestResult ? (
                latestResult.startsWith("data:image") ? (
                  <img src={latestResult} alt="معاينة الفيديو" className="h-full w-full object-cover" />
                ) : (
                  <video src={latestResult} controls className="h-full w-full object-cover" />
                )
              ) : loading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <div className="px-8">
                  <Film className="mx-auto mb-3 h-8 w-8 text-primary" />
                  الفيديو سيظهر هنا بعد التوليد
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-extrabold">آخر الفيديوهات</h2>
              <button type="button" onClick={loadJobs} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary" aria-label="تحديث">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            {jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد فيديوهات بعد.</p>
            ) : (
              <div className="space-y-2">
                {jobs.slice(0, 6).map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => setActiveJob(job)}
                    className={cn(
                      "w-full rounded-lg border p-3 text-right text-xs transition-colors",
                      activeJob?.id === job.id ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/70"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold">{job.quality === "quality" ? "Quality" : "Fast"}</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold">{STATUS_LABEL[job.status] ?? job.status}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-muted-foreground">{job.prompt}</p>
                  {job.error_message && <p className="mt-1 line-clamp-2 text-[10px] font-medium text-destructive">{job.error_message}</p>}
                    <p className="mt-2 text-[10px] text-muted-foreground">{new Date(job.created_at).toLocaleDateString("ar-SA")} · {job.credits_charged} نقطة</p>
                  </button>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>

      <QuotaExceededDialog
        open={quotaDialog.open}
        onOpenChange={(v) => setQuotaDialog((s) => ({ ...s, open: v }))}
        kind="فيديو"
        reason={quotaDialog.reason}
      />
    </DashboardShell>
  );
}
