import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useRouter, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Clapperboard, Crown, Download, Film, ImageUp, Loader2, MonitorSmartphone, RefreshCw, Sparkles, Upload, Wand2, Zap } from "lucide-react";
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
import { videoTierDuration } from "@/lib/plan-catalog";
import { SAUDI_VIDEO_LAUNCH_PROMPT_TEMPLATES, SAUDI_VIDEO_PERSONAS } from "@/lib/saudi-video-test";
import personaMaleYoung from "@/assets/saudi-persona-male-young.jpg";
import personaMalePremium from "@/assets/saudi-persona-male-premium.jpg";
import personaFemaleAbaya from "@/assets/saudi-persona-female-abaya.jpg";
import personaRetailSeller from "@/assets/saudi-persona-retail-seller.jpg";

type VideoQuality = "fast" | "lite" | "quality";
type AspectRatio = "9:16" | "1:1" | "16:9";
type VideoJob = Awaited<ReturnType<typeof listVideoJobs>>["jobs"][number];
type VideoSearch = { prompt?: string; campaignPackId?: string };

const QUALITY = {
  fast: { label: "سريع", icon: Zap, note: "للتجربة والمحتوى اليومي بتكلفة أقل" },
  lite: { label: "إعلاني", icon: Clapperboard, note: "لقطة بيع قصيرة للسوق السعودي" },
  quality: { label: "احترافي", icon: Crown, note: "لإعلانات Pro وBusiness عالية التحويل" },
} satisfies Record<VideoQuality, { label: string; icon: typeof Zap; note: string }>;

const PERSONA_IMAGES = {
  "male-young": personaMaleYoung,
  "male-premium": personaMalePremium,
  "female-abaya": personaFemaleAbaya,
  "retail-seller": personaRetailSeller,
} as const;

const PERSONAS = SAUDI_VIDEO_PERSONAS.map((persona) => ({ ...persona, image: PERSONA_IMAGES[persona.id] }));

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

function absoluteAssetUrl(value: string) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return typeof window === "undefined" ? value : new URL(value, window.location.origin).toString();
}

export const Route = createFileRoute("/dashboard/generate-video")({
  head: () => ({ meta: [{ title: "توليد فيديو — رِفد" }] }),
  validateSearch: (s: Record<string, unknown>): VideoSearch => ({
    prompt: typeof s.prompt === "string" ? s.prompt : undefined,
    campaignPackId: typeof s.campaignPackId === "string" ? s.campaignPackId : undefined,
  }),
  component: GenerateVideoPage,
});

function ImageInputCard({ label, value, uploading, onFile, onUrl }: { label: string; value: string; uploading: boolean; onFile: (file?: File) => void; onUrl: (value: string) => void }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/20 p-3">
      <Label>{label}</Label>
      <div className="mt-2 flex items-center gap-2">
        <label className={cn("inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-input px-3 text-xs font-bold hover:bg-accent", uploading && "pointer-events-none opacity-70")}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading} onChange={(event) => { onFile(event.target.files?.[0]); event.currentTarget.value = ""; }} />
        </label>
        <input value={value} onChange={(event) => onUrl(event.target.value)} placeholder="أو رابط صورة" className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-xs" />
      </div>
      {value && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <img src={value} alt="معاينة الصورة المرفوعة" className="h-10 w-10 rounded-md border border-border object-cover" loading="lazy" />
          <span className="inline-flex items-center gap-1"><ImageUp className="h-3.5 w-3.5" /> الصورة جاهزة للاستخدام</span>
        </div>
      )}
    </div>
  );
}

function GenerateVideoPage() {
  const router = useRouter();
  const search = useSearch({ from: "/dashboard/generate-video" });
  const generateVideoFn = useServerFn(generateVideo);
  const listVideoJobsFn = useServerFn(listVideoJobs);
  const refreshVideoJobFn = useServerFn(refreshVideoJob);
  const { data: credits, loading: creditsLoading, refresh: refreshCredits } = useCreditsSummary();
  const [quality, setQuality] = useState<VideoQuality>("fast");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [prompt, setPrompt] = useState(search.prompt ?? "");
  const [startingFrameUrl, setStartingFrameUrl] = useState("");
  const [speakerImageUrl, setSpeakerImageUrl] = useState("");
  const [productImageUrl, setProductImageUrl] = useState("");
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(PERSONAS[0].id);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(SAUDI_VIDEO_LAUNCH_PROMPT_TEMPLATES[0].id);
  const [uploadingInput, setUploadingInput] = useState<"speaker" | "product" | null>(null);
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [activeJob, setActiveJob] = useState<VideoJob | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [downloadingVideo, setDownloadingVideo] = useState(false);
  const [quotaDialog, setQuotaDialog] = useState<{ open: boolean; reason?: string }>({ open: false });

  const selectedQuality = QUALITY[quality];
  const selectedQualityAllowed = quality === "quality" ? (credits?.videoQualityAllowed ?? true) : (credits?.videoFastAllowed ?? true);
  const effectiveDurationSeconds = videoTierDuration(quality);
  const costKey = (quality === "quality" ? "video_quality_8s" : quality === "lite" ? "video_lite_8s" : "video_fast") as keyof NonNullable<typeof credits>["costs"];
  const selectedCost = credits?.costs[costKey] ?? 0;
  const selectedDurationAllowed = effectiveDurationSeconds <= (credits?.maxVideoDurationSeconds ?? 8);
  const hasEnoughCredits = credits ? credits.totalCredits >= selectedCost : true;
  const isPaidPlan = credits?.plan ? credits.plan !== "free" : false;
  const watermarkRequired = credits?.plan === "free";
  const productImageRequired = isPaidPlan && !productImageUrl.trim();
  const selectedPersona = PERSONAS.find((persona) => persona.id === selectedPersonaId) ?? PERSONAS[0];
  const selectedTemplate = SAUDI_VIDEO_LAUNCH_PROMPT_TEMPLATES.find((template) => template.id === selectedTemplateId) ?? SAUDI_VIDEO_LAUNCH_PROMPT_TEMPLATES[0];
  const latestResult = useMemo(() => {
    const syncedActiveJob = activeJob ? jobs.find((job) => job.id === activeJob.id) : null;
    return syncedActiveJob?.result_url ?? activeJob?.result_url ?? jobs.find((job) => job.status === "completed" && job.result_url)?.result_url ?? jobs.find((job) => job.result_url)?.result_url ?? null;
  }, [activeJob, jobs]);
  const promptCount = useMemo(() => prompt.trim().length, [prompt]);

  const applyTemplate = () => {
    setPrompt(selectedTemplate.prompt);
    toast.success("تم تطبيق قالب برومبت سعودي مدروس");
  };

  const loadJobs = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const out = await listVideoJobsFn({ headers: { Authorization: `Bearer ${session.access_token}` } });
      setJobs(out.jobs);
      const syncedActiveJob = activeJob ? out.jobs.find((job) => job.id === activeJob.id) : null;
      setActiveJob(syncedActiveJob ?? out.jobs.find((job) => job.status === "completed" && job.result_url) ?? out.jobs[0] ?? null);
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

  useEffect(() => {
    setPreviewError(false);
  }, [latestResult]);

  const generate = async () => {
    if (prompt.trim().length < 10) {
      toast.error("اكتب وصف فيديو أوضح");
      return;
    }
    if (!hasEnoughCredits) {
      setQuotaDialog({ open: true, reason: `INSUFFICIENT_CREDITS: رصيد نقاط الفيديو لا يكفي (تحتاج ${selectedCost} نقطة فيديو).` });
      return;
    }
    if (!selectedQualityAllowed || !selectedDurationAllowed) {
      setQuotaDialog({ open: true, reason: !selectedQualityAllowed ? "VIDEO_QUALITY_NOT_ALLOWED: الجودة الاحترافية غير متاحة في باقتك الحالية." : "VIDEO_DURATION_NOT_ALLOWED: مدة الفيديو غير متاحة في باقتك الحالية." });
      return;
    }
    if (productImageRequired) {
      toast.error("صورة المنتج مطلوبة في الباقات المدفوعة حتى يظهر المنتج بوضوح داخل الإعلان");
      return;
    }
    setLoading(true);
    setQuotaDialog({ open: false });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("سجّل الدخول أولاً");
      const out = await generateVideoFn({
        data: { prompt, quality, aspectRatio, durationSeconds: effectiveDurationSeconds, startingFrameUrl: startingFrameUrl.trim(), speakerImageUrl: speakerImageUrl || absoluteAssetUrl(selectedPersona.image), productImageUrl, selectedPersonaId, selectedTemplateId, campaignPackId: search.campaignPackId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setActiveJob(out.job);
      setJobs((current) => [out.job, ...current.filter((job) => job.id !== out.job.id)].slice(0, 20));
      track("generation_created", { kind: "video", quality, aspect_ratio: aspectRatio, credits: out.creditsCharged, template_id: selectedTemplateId });
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
      track("generation_failed", { kind: "video", quality, aspect_ratio: aspectRatio, template_id: selectedTemplateId, reason: msg.slice(0, 120) });
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
      if (out.job.status === "completed" && out.job.result_url) toast.success("الفيديو جاهز للمعاينة والتحميل");
      if (showToast) toast.success(out.job.status === "processing" ? "الفيديو ما زال قيد المعالجة" : "تم تحديث حالة الفيديو");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل تحديث حالة الفيديو");
    }
  };

  const downloadLatestVideo = async () => {
    if (!latestResult) return;
    setDownloadingVideo(true);
    try {
      const response = await fetch(latestResult, { mode: "cors" });
      if (!response.ok) throw new Error("download_failed");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `rifd-video-${activeJob?.id?.slice(0, 8) ?? Date.now()}.mp4`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success("بدأ تحميل الفيديو");
    } catch {
      window.open(latestResult, "_blank", "noopener,noreferrer");
      toast.message("فتحنا الفيديو في تبويب جديد؛ استخدم حفظ الملف إذا منع المتصفح التحميل المباشر.");
    } finally {
      setDownloadingVideo(false);
    }
  };

  const uploadInputImage = async (kind: "speaker" | "product", file?: File) => {
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("ارفع صورة بصيغة JPG أو PNG أو WebP فقط");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("حجم الصورة كبير؛ الحد الأقصى 8MB");
      return;
    }
    setUploadingInput(kind);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("سجّل الدخول أولاً");
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${session.user.id}/video-inputs/${kind}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("generated-images").upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw new Error(error.message);
      const { data, error: signedError } = await supabase.storage.from("generated-images").createSignedUrl(path, 60 * 60 * 24 * 7);
      if (signedError || !data?.signedUrl) throw new Error(signedError?.message ?? "فشل تجهيز رابط الصورة");
      if (kind === "speaker") setSpeakerImageUrl(data.signedUrl);
      else setProductImageUrl(data.signedUrl);
      toast.success("تم تجهيز الصورة للفيديو");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل رفع الصورة");
    } finally {
      setUploadingInput(null);
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
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-extrabold">{option.label}</span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-bold">
                        {(credits?.costs[key === "quality" ? "video_quality_8s" : key === "lite" ? "video_lite_8s" : "video_fast"] ?? 0).toLocaleString("ar-SA")} نقطة · {key === "fast" ? "من 5ث" : "8ث"}
                      </span>
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
                {[5, 8].map((duration) => {
                  const lockedByTier = effectiveDurationSeconds !== duration;
                  return (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => undefined}
                    disabled={lockedByTier}
                    className={cn(
                      "rounded-lg border px-3 py-4 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                      effectiveDurationSeconds === duration ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary/70"
                    )}
                  >
                    {duration} ث
                  </button>
                );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-secondary/20 p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Label>قوالب الإطلاق السعودية المعتمدة</Label>
                <p className="mt-1 text-xs text-muted-foreground">تم حصر الإطلاق على أفضل قالبين من العينات الفعلية لتقليل الهدر ورفع قابلية النشر.</p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={applyTemplate} className="w-fit gap-1">
                <Wand2 className="h-3.5 w-3.5" /> تطبيق القالب
              </Button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_120px]">
              <select value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)} className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm">
                {SAUDI_VIDEO_LAUNCH_PROMPT_TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>{template.sector} — {template.label}</option>
                ))}
              </select>
              <div className="flex items-center justify-center rounded-md border border-border bg-card px-3 text-xs font-bold text-muted-foreground">مخاطرة: {selectedTemplate.risk}</div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">القوالب الأخرى محجوبة مؤقتاً حتى تثبت بيانات الاستخدام الفعلية أن نتائج الإطلاق مستقرة وقابلة للنشر.</p>
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

          <div className="space-y-3">
            <Label>شخصيات سعودية جاهزة</Label>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {PERSONAS.map((persona) => (
                <button key={persona.id} type="button" onClick={() => setSelectedPersonaId(persona.id)} className={cn("overflow-hidden rounded-lg border text-right transition-colors", selectedPersonaId === persona.id ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/70")}> 
                  <img src={persona.image} alt={persona.label} width={768} height={768} loading="lazy" className="aspect-square w-full object-cover" />
                  <span className="block px-2 py-2 text-xs font-bold">{persona.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <ImageInputCard label="صورة الشخص المتحدث" value={speakerImageUrl} uploading={uploadingInput === "speaker"} onFile={(file: File | undefined) => void uploadInputImage("speaker", file)} onUrl={setSpeakerImageUrl} />
            <ImageInputCard label={isPaidPlan ? "صورة المنتج — مطلوبة" : "صورة المنتج"} value={productImageUrl} uploading={uploadingInput === "product"} onFile={(file: File | undefined) => void uploadInputImage("product", file)} onUrl={setProductImageUrl} />
          </div>
          {productImageRequired && <p className="text-xs font-bold text-destructive">ارفع صورة المنتج قبل التوليد؛ هذا يحافظ على وضوح المنتج ويقلل النتائج العامة.</p>}

          <div className="rounded-lg border border-gold/30 bg-gold/5 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-foreground">سيتم خصم {selectedCost.toLocaleString("ar-SA")} نقطة فيديو</span>
              <span className={cn("text-xs", hasEnoughCredits ? "text-muted-foreground" : "font-bold text-destructive")}>{hasEnoughCredits ? `المدة المعتمدة: ${effectiveDurationSeconds}ث · يتم الاسترجاع تلقائياً إذا فشل التوليد بعد الخصم` : "رصيدك الحالي لا يكفي لهذه الجودة"}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">الاستخدام يعتمد على رصيد النقاط فقط، مع حماية تشغيلية للمهام المتزامنة.</p>
            <p className="mt-1 text-xs font-bold text-muted-foreground">
              {watermarkRequired ? "الباقة المجانية تضيف علامة Rifd المائية تلقائياً؛ الباقات المدفوعة بدون علامة مائية." : "باقتك الحالية تولّد فيديوهات بدون علامة مائية من Rifd."}
            </p>
          </div>

          <Button onClick={generate} disabled={loading || creditsLoading || !hasEnoughCredits || !selectedQualityAllowed || !selectedDurationAllowed || productImageRequired} className="w-full gradient-primary text-primary-foreground shadow-elegant">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري توليد الفيديو...</> : <><Clapperboard className="h-4 w-4" /> ولّد الفيديو</>}
          </Button>
        </section>

        <aside className="space-y-5">
          <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-extrabold">المعاينة</h2>
              <div className="flex flex-wrap items-center gap-2">
                {activeJob?.status === "processing" && (
                  <button type="button" onClick={() => void refreshActiveJob()} className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs hover:bg-accent">
                    <RefreshCw className="h-3 w-3" /> تحديث
                  </button>
                )}
                {latestResult && (
                  <>
                    <button type="button" onClick={() => void downloadLatestVideo()} disabled={downloadingVideo} className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60">
                      {downloadingVideo ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />} تحميل
                    </button>
                    <a href={latestResult} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs hover:bg-accent">
                      فتح
                    </a>
                  </>
                )}
              </div>
            </div>
            <div className="mt-3 flex aspect-[9/16] items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-secondary/30 text-center text-sm text-muted-foreground">
              {latestResult ? (
                latestResult.startsWith("data:image") ? (
                  <img src={latestResult} alt="معاينة الفيديو" className="h-full w-full object-cover" />
                ) : (
                  <div className="relative h-full w-full">
                    <video src={latestResult} controls playsInline preload="metadata" className="h-full w-full object-cover" onError={() => setPreviewError(true)} />
                    {previewError && (
                      <div className="absolute inset-x-3 bottom-3 rounded-lg border border-border bg-card/95 p-3 text-xs font-medium text-foreground shadow-soft">
                        تعذر تشغيل المعاينة داخل الصفحة. استخدم زر فتح أو تحميل.
                      </div>
                    )}
                  </div>
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
                      <span className="font-bold">{job.quality === "quality" ? "احترافي" : job.quality === "lite" ? "إعلاني" : "سريع"}</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold">{job.status === "completed" && job.result_url ? "جاهز للمعاينة" : STATUS_LABEL[job.status] ?? job.status}</span>
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
