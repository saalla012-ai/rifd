import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Archive, ArrowLeft, CalendarDays, CheckCircle2, Clapperboard, Copy, FolderKanban, Image as ImageIcon, LayoutTemplate, Loader2, Megaphone, Save, Upload, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { archiveCampaignPack, listCampaignPacks, saveCampaignPack, type CampaignPack } from "@/server/campaign-packs";

type CampaignGoal = "launch" | "clearance" | "upsell" | "leads" | "competitive" | "winback";
type CampaignChannel = "instagram" | "snapchat" | "tiktok" | "whatsapp";
type CampaignSearch = {
  __lovable_token?: string;
  product?: string;
  audience?: string;
  offer?: string;
  goal?: CampaignGoal;
  channel?: CampaignChannel;
  productImagePath?: string;
};
type OutputToolRoute = "/dashboard/generate-text" | "/dashboard/generate-image" | "/dashboard/generate-video";

const GOALS: Array<{ value: CampaignGoal; label: string; angle: string }> = [
  { value: "launch", label: "إطلاق منتج", angle: "تركيز على التشويق، المشكلة، والتحوّل بعد استخدام المنتج" },
  { value: "clearance", label: "تصفية مخزون", angle: "إلحاح واضح، قيمة رقمية، وسبب شراء سريع قبل نفاد الكمية" },
  { value: "upsell", label: "رفع قيمة السلة", angle: "اقتراح إضافة ذكية تجعل الطلب أكبر بدون ضغط على العميل" },
  { value: "leads", label: "جمع عملاء محتملين", angle: "عرض سبب مقنع يخلّي العميل يترك بياناته أو يتواصل الآن" },
  { value: "competitive", label: "منافسة مباشرة", angle: "إبراز الفرق العملي بين عرضك والبدائل بدون ادعاءات مبالغ فيها" },
  { value: "winback", label: "استرجاع عميل", angle: "تذكير العملاء السابقين بسبب العودة والثقة المتراكمة" },
];

const CHANNELS: Array<{ value: CampaignChannel; label: string; output: string }> = [
  { value: "instagram", label: "Instagram", output: "منشور + Story + Reel" },
  { value: "snapchat", label: "Snapchat", output: "سنابة قصيرة + CTA واتساب" },
  { value: "tiktok", label: "TikTok", output: "Hook سريع + فيديو عمودي" },
  { value: "whatsapp", label: "WhatsApp", output: "رسالة قائمة بث مختصرة" },
];

const CAMPAIGN_PRODUCT_IMAGES_BUCKET = "campaign-product-images";
const PLAN_PROGRESS = 100;

const goalCopy: Record<CampaignGoal, { hook: string; cta: string; visual: string; video: string }> = {
  launch: {
    hook: "منتج جديد يستحق أول نظرة — صمّم لحظة اكتشاف لا تُنسى.",
    cta: "اطلبه الآن قبل نفاد أول دفعة",
    visual: "صورة منتج Hero بخلفية نظيفة، إضاءة فاخرة، مساحة واضحة للنص والسعر",
    video: "لقطة كشف تدريجي للمنتج، حركة كاميرا بطيئة، ظهور الفائدة الرئيسية ثم CTA في النهاية",
  },
  clearance: {
    hook: "العرض الأقصر عادة هو الأكثر قراراً — اجعل القيمة واضحة من أول ثانية.",
    cta: "احجز عرضك اليوم",
    visual: "بوستر عرض محدود مع رقم الخصم كبيراً وتباين واضح بين المنتج والسعر",
    video: "فيديو عمودي سريع يبدأ بالخصم، يمرّ على المنتج، ثم ينتهي بعدّاد بصري وCTA",
  },
  upsell: {
    hook: "خلّ الطلب يصير أذكى: إضافة بسيطة ترفع قيمة السلة وتزيد رضا العميل.",
    cta: "أضفها لطلبك الآن",
    visual: "تصميم Bundle يوضح المنتج الأساسي والإضافة المقترحة مع فائدة مباشرة",
    video: "لقطة قبل وبعد للطلب، تظهر الإضافة كاختيار منطقي وسهل مع CTA سريع",
  },
  leads: {
    hook: "لا تطلب الشراء مباشرة؛ اعطِ العميل سبباً واضحاً يفتح معه المحادثة.",
    cta: "اكتب لنا ونعطيك الأنسب",
    visual: "تصميم بسيط يبرز سؤال العميل وسبب التواصل مع مساحة واضحة للواتساب",
    video: "فيديو قصير يبدأ بسؤال شائع، يقدّم وعداً واضحاً، وينتهي بدعوة للتواصل",
  },
  competitive: {
    hook: "العميل يقارن دائماً؛ اكسب المقارنة بفائدة ملموسة لا بكلام عام.",
    cta: "شوف الفرق بنفسك",
    visual: "مقارنة نظيفة بين المنتج والبدائل مع إبراز نقطة قوة واحدة قابلة للتصديق",
    video: "مشهد مقارنة سريع يوضح الفرق في الاستخدام أو القيمة بدون هجوم مباشر",
  },
  winback: {
    hook: "العميل الذي اشترى مرة يحتاج سبباً واضحاً ليعود مرة ثانية.",
    cta: "ارجع للطلب بميزة خاصة",
    visual: "تصميم ثقة يبرز التقييمات أو الأكثر طلباً مع منتج واضح",
    video: "فيديو تذكيري يبدأ بمشكلة مألوفة، يعرض المنتج كحل، وينتهي برسالة شخصية للعودة",
  },
};

export const Route = createFileRoute("/dashboard/campaign-studio")({
  head: () => ({ meta: [{ title: "استوديو الحملات — رِفد" }] }),
  validateSearch: (s: Record<string, unknown>): CampaignSearch => ({
    __lovable_token: typeof s.__lovable_token === "string" ? s.__lovable_token : undefined,
    product: typeof s.product === "string" ? s.product.slice(0, 500) : undefined,
    audience: typeof s.audience === "string" ? s.audience.slice(0, 500) : undefined,
    offer: typeof s.offer === "string" ? s.offer.slice(0, 500) : undefined,
    goal: ["launch", "clearance", "upsell", "leads", "competitive", "winback"].includes(String(s.goal)) ? (s.goal as CampaignGoal) : undefined,
    channel: ["instagram", "snapchat", "tiktok", "whatsapp"].includes(String(s.channel)) ? (s.channel as CampaignChannel) : undefined,
    productImagePath: typeof s.productImagePath === "string" ? s.productImagePath.slice(0, 1000) : undefined,
  }),
  component: CampaignStudioPage,
});

function CampaignStudioPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/dashboard/campaign-studio" });
  const loadPacksFn = useServerFn(listCampaignPacks);
  const savePackFn = useServerFn(saveCampaignPack);
  const archivePackFn = useServerFn(archiveCampaignPack);
  const [goal, setGoal] = useState<CampaignGoal>(search.goal ?? "launch");
  const [channel, setChannel] = useState<CampaignChannel>(search.channel ?? "instagram");
  const [product, setProduct] = useState(search.product ?? "");
  const [audience, setAudience] = useState(search.audience ?? "");
  const [offer, setOffer] = useState(search.offer ?? "");
  const [productImagePath, setProductImagePath] = useState<string | null>(search.productImagePath ?? null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activePackId, setActivePackId] = useState<string | undefined>();
  const [packs, setPacks] = useState<CampaignPack[]>([]);
  const [loadingPacks, setLoadingPacks] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (search.goal) setGoal(search.goal);
    if (search.channel) setChannel(search.channel);
    if (search.product !== undefined) setProduct(search.product);
    if (search.audience !== undefined) setAudience(search.audience);
    if (search.offer !== undefined) setOffer(search.offer);
    if (search.productImagePath !== undefined) setProductImagePath(search.productImagePath);
  }, [search.audience, search.channel, search.goal, search.offer, search.product, search.productImagePath]);

  const selectedGoal = GOALS.find((item) => item.value === goal) ?? GOALS[0];
  const selectedChannel = CHANNELS.find((item) => item.value === channel) ?? CHANNELS[0];
  const strategy = goalCopy[goal];

  const campaignBrief = useMemo(() => {
    const productLine = product.trim() || "[اسم المنتج / الخدمة]";
    const audienceLine = audience.trim() || "[الجمهور المستهدف]";
    const offerLine = offer.trim() || "[العرض أو السبب التجاري]";
    return `حملة ${selectedGoal.label} لقناة ${selectedChannel.label}\n\nالمنتج: ${productLine}\nالجمهور: ${audienceLine}\nالعرض/السبب: ${offerLine}\n\nزاوية الحملة: ${selectedGoal.angle}\nHook: ${strategy.hook}\nCTA: ${strategy.cta}`;
  }, [audience, offer, product, selectedChannel.label, selectedGoal.angle, selectedGoal.label, strategy.cta, strategy.hook]);

  const textPrompt = `اكتب محتوى حملة ${selectedGoal.label} لقناة ${selectedChannel.label}.\n${campaignBrief}\n\nالمطلوب: عنوان قصير، نص أساسي، 3 صيغ CTA، ونسخة واتساب مختصرة.`;
  const imagePrompt = `${strategy.visual}. المنتج: ${product.trim() || "منتج متجر إلكتروني"}. الجمهور: ${audience.trim() || "عملاء سعوديون"}. الهدف: ${selectedGoal.label}.`;
  const videoPrompt = `${strategy.video}. المنتج: ${product.trim() || "منتج متجر إلكتروني"}. القناة: ${selectedChannel.label}. اجعل الفيديو مناسباً لـ${selectedChannel.output}.`;

  const progressItems = [goal, channel, product.trim(), audience.trim(), offer.trim(), productImagePath, activePackId];
  const campaignProgress = Math.round((progressItems.filter(Boolean).length / progressItems.length) * 100);
  const readinessChecks = [
    { label: "هدف الحملة", done: Boolean(goal), hint: selectedGoal.label },
    { label: "المنتج", done: Boolean(product.trim()), hint: product.trim() || "اكتب المنتج بوضوح" },
    { label: "الجمهور", done: Boolean(audience.trim()), hint: audience.trim() || "حدّد من تبيع له" },
    { label: "العرض", done: Boolean(offer.trim()), hint: offer.trim() || "أضف سبباً للشراء الآن" },
    { label: "الصورة", done: Boolean(productImagePath), hint: productImagePath ? "مرتبطة بالحملة" : "ارفع صورة المنتج" },
  ];
  const nextReadinessStep = readinessChecks.find((check) => !check.done)?.hint ?? "الحملة جاهزة للانتقال إلى أدوات التنفيذ";
  const readyForExecution = readinessChecks.every((check) => check.done);

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("سجّل الدخول أولاً لحفظ الحملات");
    return { Authorization: `Bearer ${session.access_token}` };
  };

  const loadPacks = async () => {
    setLoadingPacks(true);
    try {
      const headers = await authHeaders();
      const out = await loadPacksFn({ data: { status: "active", limit: 12 }, headers });
      setPacks(out.packs);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل تحميل حزم الحملات");
    } finally {
      setLoadingPacks(false);
    }
  };

  useEffect(() => {
    void loadPacks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (productImagePreview) URL.revokeObjectURL(productImagePreview);
    };
  }, [productImagePreview]);

  useEffect(() => {
    if (!productImagePath || productImagePreview) return;
    let cancelled = false;
    void supabase.storage
      .from(CAMPAIGN_PRODUCT_IMAGES_BUCKET)
      .createSignedUrl(productImagePath, 60 * 30)
      .then(({ data, error }) => {
        if (!cancelled && !error && data?.signedUrl) setProductImagePreview(data.signedUrl);
      });
    return () => { cancelled = true; };
  }, [productImagePath, productImagePreview]);

  const copyBrief = async () => {
    await navigator.clipboard.writeText(campaignBrief);
    toast.success("تم نسخ موجز الحملة");
  };

  const uploadProductImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("ارفع صورة منتج بصيغة صورة فقط");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب ألا يتجاوز 5MB");
      return;
    }

    setUploadingImage(true);
    const previewUrl = URL.createObjectURL(file);
    setProductImagePreview(previewUrl);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("سجّل الدخول أولاً لرفع صورة المنتج");
      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${user.id}/campaigns/${activePackId ?? "draft"}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(CAMPAIGN_PRODUCT_IMAGES_BUCKET).upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      setProductImagePath(path);
      toast.success("تم رفع صورة المنتج وربطها بالحملة");
    } catch (e) {
      URL.revokeObjectURL(previewUrl);
      setProductImagePreview(null);
      toast.error(e instanceof Error ? e.message : "فشل رفع صورة المنتج");
    } finally {
      setUploadingImage(false);
    }
  };

  const clearProductImage = () => {
    if (productImagePreview) URL.revokeObjectURL(productImagePreview);
    setProductImagePreview(null);
    setProductImagePath(null);
  };

  const saveCurrentPack = async (status: "draft" | "generated" = "draft"): Promise<CampaignPack | null> => {
    setSaving(true);
    try {
      const headers = await authHeaders();
      const out = await savePackFn({
        data: { id: activePackId, product, audience, offer, goal, channel, status, brief: campaignBrief, textPrompt, imagePrompt, videoPrompt, productImagePath },
        headers,
      });
      setActivePackId(out.pack.id);
      setPacks((current) => [out.pack, ...current.filter((pack) => pack.id !== out.pack.id)].slice(0, 12));
      toast.success(status === "generated" ? "تم حفظ الحملة كحزمة جاهزة" : "تم حفظ مسودة الحملة");
      return out.pack;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل حفظ الحملة");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const openOutputTool = async (to: OutputToolRoute, payload: string) => {
    const packId = (await saveCurrentPack("generated"))?.id;
    if (!packId) return;
    await navigate({ to, search: { __lovable_token: search.__lovable_token, prompt: payload, campaignPackId: packId } });
  };

  const applyPack = (pack: CampaignPack) => {
    setActivePackId(pack.id);
    setGoal(pack.goal);
    setChannel(pack.channel);
    setProduct(pack.product);
    setAudience(pack.audience);
    setOffer(pack.offer);
    setProductImagePath(pack.product_image_path);
    setProductImagePreview(null);
    toast.success("تم فتح حزمة الحملة");
  };

  const archivePack = async (pack: CampaignPack) => {
    try {
      const headers = await authHeaders();
      await archivePackFn({ data: { id: pack.id }, headers });
      setPacks((current) => current.filter((item) => item.id !== pack.id));
      if (activePackId === pack.id) setActivePackId(undefined);
      toast.success("تمت أرشفة الحملة");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل أرشفة الحملة");
    }
  };

  return (
    <DashboardShell>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
            <Megaphone className="h-3.5 w-3.5" /> استوديو الحملات
          </div>
          <h1 className="text-2xl font-extrabold">ابنِ حملة تبيع من هدف واحد وصورة منتج واضحة</h1>
          <p className="mt-1 max-w-2xl text-sm leading-7 text-muted-foreground">
            رتّب الهدف والجمهور والعرض، اربط صورة المنتج، ثم انقل نفس الزاوية إلى النص والصورة والفيديو بدون تشتّت.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void saveCurrentPack("draft")} disabled={saving} className="gap-1">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} حفظ مسودة
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1">
              <Link to="/dashboard/templates"><LayoutTemplate className="h-3.5 w-3.5" /> ابدأ من قالب</Link>
          </Button>
        </div>
      </div>

        <div className="mt-5 rounded-xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold">نسبة التقدم من الخطة المعتمدة</p>
              <p className="mt-1 text-xs text-muted-foreground">اكتملت مراجعة استوديو الحملات تقنياً وتسويقياً وتجاربياً.</p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary">{PLAN_PROGRESS}%</span>
          </div>
          <Progress value={PLAN_PROGRESS} className="mt-3 h-2" />
          <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-bold leading-6 text-primary">
            جاهز للاستخدام: البناء، المعاينة، رفع صورة المنتج، الحفظ، ووجهات التنفيذ تعمل ضمن نفس مسار الحملة.
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-4">
          {[
            "اختر الهدف",
            "ارفع صورة المنتج",
            "اكتب عرضاً واضحاً",
            "انتقل لأداة التنفيذ",
          ].map((step, index) => (
            <div key={step} className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-muted-foreground shadow-soft">
              <span className="ms-1 text-primary">{index + 1}</span>
              {step}
            </div>
          ))}
          </div>
        </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_410px] xl:grid-cols-[minmax(0,1fr)_430px]">
        <section className="space-y-5 rounded-xl border border-border bg-card p-4 shadow-soft sm:p-5">
          <div className="flex flex-col gap-1 border-b border-border pb-4">
            <p className="text-xs font-bold text-primary">منطقة البناء</p>
            <h2 className="text-lg font-extrabold">ابنِ الزاوية من الهدف إلى الموجز</h2>
          </div>
          <div>
            <Label>هدف الحملة</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {GOALS.map((item) => (
                <button key={item.value} type="button" onClick={() => setGoal(item.value)} className={cn("rounded-lg border p-4 text-right transition-colors", goal === item.value ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/70")}>
                  <div className="flex items-center gap-2 font-extrabold">
                    <CheckCircle2 className={cn("h-4 w-4", goal === item.value ? "text-primary" : "text-muted-foreground")} />
                    {item.label}
                  </div>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">{item.angle}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>القناة الأساسية</Label>
            <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
              {CHANNELS.map((item) => (
                <button key={item.value} type="button" onClick={() => setChannel(item.value)} className={cn("min-h-20 rounded-lg border px-3 py-3 text-center text-xs transition-colors", channel === item.value ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary/70")}>
                  <div className="font-extrabold">{item.label}</div>
                  <div className="mt-1 text-[11px] leading-5 text-muted-foreground">{item.output}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <CampaignField id="campaign-product" label="المنتج" value={product} onChange={setProduct} placeholder="مثلاً: عطر شرقي فاخر 100مل بثبات عالٍ" />
            <CampaignField id="campaign-audience" label="الجمهور" value={audience} onChange={setAudience} placeholder="مثلاً: نساء 25-40 يبحثن عن هدية راقية" />
            <CampaignField id="campaign-offer" label="العرض / السبب" value={offer} onChange={setOffer} placeholder="مثلاً: خصم 20% لأول 48 ساعة أو إطلاق مجموعة جديدة" />
          </div>

          <ProductImageUploader preview={productImagePreview} path={productImagePath} uploading={uploadingImage} onUpload={uploadProductImage} onClear={clearProductImage} />

          <div className="rounded-lg border border-gold/30 bg-gold/5 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-extrabold">موجز الحملة الجاهز</p>
                <p className="mt-1 text-xs text-muted-foreground">هذا هو السياق الذي سيقود النص والصورة والفيديو بدون تشتيت.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={copyBrief} className="gap-1"><Copy className="h-3.5 w-3.5" /> نسخ</Button>
                <Button type="button" size="sm" onClick={() => void saveCurrentPack("generated")} disabled={saving} className="gap-1 gradient-primary text-primary-foreground shadow-elegant">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FolderKanban className="h-3.5 w-3.5" />} حفظ الموجز
                </Button>
              </div>
            </div>
            <pre className="mt-4 whitespace-pre-wrap rounded-lg border border-border bg-background p-4 text-right font-sans text-sm leading-7 text-foreground">{campaignBrief}</pre>
          </div>
        </section>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <MagicCanvas product={product} audience={audience} offer={offer} goalLabel={selectedGoal.label} channelLabel={selectedChannel.label} hook={strategy.hook} cta={strategy.cta} imagePreview={productImagePreview} hasImage={Boolean(productImagePath)} progress={campaignProgress} checks={readinessChecks} nextStep={nextReadinessStep} />

          <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <h2 className="font-extrabold">وجهات التنفيذ</h2>
            <p className="mt-1 text-xs leading-6 text-muted-foreground">
              اختر الوجهة المناسبة؛ سيتم حفظ الموجز وتمريره للأداة حتى يبقى كل مخرج جزءاً من نفس الحملة.
            </p>
            <div className="mt-4 space-y-3">
              <OutputStep icon={Wand2} title="اكتب نصاً يبيع" desc="منشور، CTA، ونسخة واتساب من نفس الموجز" to="/dashboard/generate-text" payload={textPrompt} saving={saving} ready={readyForExecution} onOpen={openOutputTool} />
              <OutputStep icon={ImageIcon} title="صمّم صورة إعلان" desc="بوستر أو صورة منتج متوافقة مع زاوية الحملة" to="/dashboard/generate-image" payload={imagePrompt} saving={saving} ready={readyForExecution} onOpen={openOutputTool} />
              <OutputStep icon={Clapperboard} title="أنشئ فيديو قصير" desc="فكرة فيديو جاهزة مرتبطة بالهدف والقناة" to="/dashboard/generate-video" payload={videoPrompt} saving={saving} ready={readyForExecution} onOpen={openOutputTool} />
            </div>
          </section>

          <SavedPacksSection packs={packs} loading={loadingPacks} activePackId={activePackId} onOpen={applyPack} onArchive={(pack) => void archivePack(pack)} />

          <section className="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-soft">
            <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" /><h2 className="font-extrabold">خريطة نشر مختصرة</h2></div>
            <ol className="mt-4 space-y-3 text-sm leading-7">
              <li className="rounded-lg bg-background/70 p-3"><strong>اليوم 1:</strong> نص بيع + صورة إعلان لاختبار الزاوية.</li>
              <li className="rounded-lg bg-background/70 p-3"><strong>اليوم 2:</strong> فيديو قصير بنفس الرسالة لزيادة الثقة.</li>
              <li className="rounded-lg bg-background/70 p-3"><strong>اليوم 3:</strong> رسالة واتساب مختصرة للمهتمين أو العملاء السابقين.</li>
            </ol>
          </section>
        </aside>
      </div>
    </DashboardShell>
  );
}

function CampaignField({ id, label, value, onChange, placeholder }: { id: string; label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-28" maxLength={500} placeholder={placeholder} />
    </div>
  );
}

function ProductImageUploader({ preview, path, uploading, onUpload, onClear }: { preview: string | null; path: string | null; uploading: boolean; onUpload: (file: File) => Promise<void>; onClear: () => void }) {
  return (
    <section className="rounded-lg border border-border bg-background p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Label htmlFor="campaign-product-image">صورة المنتج</Label>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">ارفع صورة واضحة حتى تتحول المعاينة إلى إعلان أقرب للمنتج الحقيقي.</p>
        </div>
        {path && <Button type="button" variant="ghost" size="sm" onClick={onClear} className="w-fit gap-1 text-muted-foreground"><X className="h-3.5 w-3.5" /> إزالة الصورة</Button>}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-card">
          {preview ? <img src={preview} alt="معاينة صورة المنتج" className="h-full w-full object-cover" /> : <ImageIcon className="h-8 w-8 text-muted-foreground" />}
        </div>
        <label htmlFor="campaign-product-image" className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 text-center transition-colors hover:bg-primary/10">
          {uploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Upload className="h-6 w-6 text-primary" />}
          <span className="mt-2 text-sm font-extrabold">{uploading ? "جاري رفع الصورة…" : "اختر صورة المنتج"}</span>
          <span className="mt-1 text-xs leading-6 text-muted-foreground">PNG أو JPG حتى 5MB. الصورة تبقى محفوظة داخل مساحة حملاتك.</span>
          <input id="campaign-product-image" type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void onUpload(file); event.currentTarget.value = ""; }} />
        </label>
      </div>
    </section>
  );
}

function MagicCanvas({ product, audience, offer, goalLabel, channelLabel, hook, cta, imagePreview, hasImage, progress, checks, nextStep }: { product: string; audience: string; offer: string; goalLabel: string; channelLabel: string; hook: string; cta: string; imagePreview: string | null; hasImage: boolean; progress: number; checks: Array<{ label: string; done: boolean; hint: string }>; nextStep: string }) {
  return (
    <section className="overflow-hidden rounded-xl border border-primary/20 bg-card shadow-soft">
      <div className="border-b border-border bg-primary/5 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-extrabold">المعاينة الحية</h2>
          <span className="rounded-full bg-background px-3 py-1 text-xs font-extrabold text-primary">جاهزية الحملة {progress}%</span>
        </div>
        <p className="mt-1 text-xs leading-6 text-muted-foreground">كانفاس سريع يوضح جاهزية هذه الحملة وكيف ستظهر زاوية البيع قبل الانتقال للتنفيذ.</p>
      </div>
      <div className="p-5">
        <article className="overflow-hidden rounded-lg border border-border bg-background">
          <div className="relative aspect-[4/5] bg-secondary">
            {imagePreview ? <img src={imagePreview} alt="صورة المنتج داخل كانفاس الحملة" className="h-full w-full object-cover" /> : <div className="flex h-full flex-col items-center justify-center p-6 text-center text-muted-foreground"><ImageIcon className="h-10 w-10" /><p className="mt-3 text-sm font-bold">ارفع صورة المنتج ليظهر الإعلان بشكل أقرب للحقيقة</p></div>}
            <div className="absolute inset-x-0 bottom-0 bg-background/90 p-4 backdrop-blur">
              <p className="text-xs font-bold text-primary">{goalLabel} · {channelLabel}</p>
              <h3 className="mt-1 line-clamp-2 text-lg font-extrabold">{product.trim() || "اسم المنتج يظهر هنا"}</h3>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{hook}</p>
            </div>
          </div>
          <div className="grid gap-2 p-4 text-xs leading-6 text-muted-foreground">
            <p><span className="font-bold text-foreground">الجمهور:</span> {audience.trim() || "حدّد من سيشتري ولماذا"}</p>
            <p><span className="font-bold text-foreground">العرض:</span> {offer.trim() || "اكتب سبباً واضحاً للتحرك الآن"}</p>
            <p><span className="font-bold text-foreground">CTA:</span> {cta}</p>
            <p><span className="font-bold text-foreground">الصورة:</span> {hasImage ? "مرتبطة بالحملة" : "بانتظار الرفع"}</p>
          </div>
        </article>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {checks.map((check) => (
            <div key={check.label} className={cn("rounded-lg border px-3 py-2 text-xs", check.done ? "border-primary/20 bg-primary/5" : "border-border bg-background")}>
              <div className="flex items-center gap-2 font-extrabold text-foreground">
                <CheckCircle2 className={cn("h-3.5 w-3.5", check.done ? "text-primary" : "text-muted-foreground")} />
                {check.label}
              </div>
              <p className="mt-1 line-clamp-1 text-muted-foreground">{check.hint}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs leading-6">
          <p className="font-extrabold text-primary">الخطوة التالية</p>
          <p className="mt-1 text-foreground">{nextStep}</p>
        </div>
      </div>
    </section>
  );
}

function SavedPacksSection({ packs, loading, activePackId, onOpen, onArchive }: { packs: CampaignPack[]; loading: boolean; activePackId?: string; onOpen: (pack: CampaignPack) => void; onArchive: (pack: CampaignPack) => void }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2"><FolderKanban className="h-4 w-4 text-primary" /><h2 className="font-extrabold">موجزات الحملات المحفوظة</h2></div>
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : packs.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-border p-4 text-center text-xs leading-6 text-muted-foreground">لا توجد موجزات محفوظة بعد.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {packs.map((pack) => (
            <article key={pack.id} className={cn("rounded-lg border p-3", activePackId === pack.id ? "border-primary bg-primary/5" : "border-border bg-background")}>
              <button type="button" onClick={() => onOpen(pack)} className="w-full text-right">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-extrabold">{pack.product || "حملة بدون اسم"}</span>
                  <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">{pack.status === "generated" ? "جاهزة" : "مسودة"}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{pack.brief}</p>
              </button>
              <div className="mt-2 flex items-center justify-between gap-2 border-t border-border pt-2">
                <span className="text-[10px] text-muted-foreground">{new Date(pack.updated_at).toLocaleDateString("ar-SA")}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => onArchive(pack)} className="h-7 gap-1 text-muted-foreground"><Archive className="h-3 w-3" /> أرشفة</Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function OutputStep({ icon: Icon, title, desc, to, payload, saving, ready, onOpen }: { icon: typeof Wand2; title: string; desc: string; to: OutputToolRoute; payload: string; saving: boolean; ready: boolean; onOpen: (to: OutputToolRoute, payload: string) => Promise<void> }) {
  const copy = async () => {
    await navigator.clipboard.writeText(payload);
    toast.success(`تم نسخ ${title}`);
  };

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1"><p className="font-extrabold">{title}</p><p className="mt-1 text-xs text-muted-foreground">{desc}</p></div>
        <span className={cn("shrink-0 rounded-full px-2 py-1 text-[10px] font-extrabold", ready ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground")}>{ready ? "جاهز" : "ناقص"}</span>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="outline" size="sm" onClick={copy} className="flex-1 gap-1"><Copy className="h-3.5 w-3.5" /> نسخ</Button>
        <Button type="button" size="sm" disabled={saving} onClick={() => void onOpen(to, payload)} className="flex-1 gradient-primary text-primary-foreground shadow-elegant">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <>انتقل للأداة <ArrowLeft className="h-3.5 w-3.5" /></>}
        </Button>
      </div>
    </div>
  );
}
