import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, CheckCircle2, Clapperboard, Copy, Image as ImageIcon, LayoutTemplate, Megaphone, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type CampaignGoal = "launch" | "offer" | "seasonal" | "retention";
type CampaignChannel = "instagram" | "snapchat" | "tiktok" | "whatsapp";

const GOALS: Array<{ value: CampaignGoal; label: string; angle: string }> = [
  { value: "launch", label: "إطلاق منتج", angle: "تركيز على التشويق، المشكلة، والتحوّل بعد استخدام المنتج" },
  { value: "offer", label: "عرض محدود", angle: "إلحاح واضح، قيمة رقمية، وCTA مباشر للطلب" },
  { value: "seasonal", label: "موسم / مناسبة", angle: "ربط المنتج بسياق محلي ومشهد استخدام قابل للتخيّل" },
  { value: "retention", label: "إعادة تنشيط", angle: "تذكير العملاء السابقين بسبب الشراء والثقة المتراكمة" },
];

const CHANNELS: Array<{ value: CampaignChannel; label: string; output: string }> = [
  { value: "instagram", label: "Instagram", output: "منشور + Story + Reel" },
  { value: "snapchat", label: "Snapchat", output: "سنابة قصيرة + CTA واتساب" },
  { value: "tiktok", label: "TikTok", output: "Hook سريع + فيديو عمودي" },
  { value: "whatsapp", label: "WhatsApp", output: "رسالة قائمة بث مختصرة" },
];

const goalCopy: Record<CampaignGoal, { hook: string; cta: string; visual: string; video: string }> = {
  launch: {
    hook: "منتج جديد يستحق أول نظرة — صمّم لحظة اكتشاف لا تُنسى.",
    cta: "اطلبه الآن قبل نفاد أول دفعة",
    visual: "صورة منتج Hero بخلفية نظيفة، إضاءة فاخرة، مساحة واضحة للنص والسعر",
    video: "لقطة كشف تدريجي للمنتج، حركة كاميرا بطيئة، ظهور الفائدة الرئيسية ثم CTA في النهاية",
  },
  offer: {
    hook: "العرض الأقصر عادة هو الأكثر قراراً — اجعل القيمة واضحة من أول ثانية.",
    cta: "احجز عرضك اليوم",
    visual: "بوستر عرض محدود مع رقم الخصم كبيراً وتباين واضح بين المنتج والسعر",
    video: "فيديو عمودي سريع يبدأ بالخصم، يمرّ على المنتج، ثم ينتهي بعدّاد بصري وCTA",
  },
  seasonal: {
    hook: "اربط المنتج بالمناسبة حتى يشعر العميل أن الشراء في وقته الصحيح.",
    cta: "جهّز طلبك للمناسبة",
    visual: "مشهد موسمي سعودي بتفاصيل ذهبية وخضراء، المنتج في مركز التكوين",
    video: "مشهد استخدام داخل المناسبة، انتقالات ناعمة، نص قصير يربط المنتج بالهدية أو التجهيز",
  },
  retention: {
    hook: "العميل الذي اشترى مرة يحتاج سبباً واضحاً ليعود مرة ثانية.",
    cta: "ارجع للطلب بميزة خاصة",
    visual: "تصميم ثقة يبرز التقييمات أو الأكثر طلباً مع منتج واضح",
    video: "فيديو تذكيري يبدأ بمشكلة مألوفة، يعرض المنتج كحل، وينتهي برسالة شخصية للعودة",
  },
};

export const Route = createFileRoute("/dashboard/campaign-studio")({
  head: () => ({ meta: [{ title: "Campaign Studio — رِفد" }] }),
  component: CampaignStudioPage,
});

function CampaignStudioPage() {
  const [goal, setGoal] = useState<CampaignGoal>("launch");
  const [channel, setChannel] = useState<CampaignChannel>("instagram");
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [offer, setOffer] = useState("");

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

  const copyBrief = async () => {
    await navigator.clipboard.writeText(campaignBrief);
    toast.success("تم نسخ موجز الحملة");
  };

  return (
    <DashboardShell>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
            <Megaphone className="h-3.5 w-3.5" /> Campaign Studio
          </div>
          <h1 className="text-2xl font-extrabold">استوديو الحملات</h1>
          <p className="mt-1 max-w-2xl text-sm leading-7 text-muted-foreground">
            ابنِ موجز حملة واحد ثم انقله مباشرة إلى توليد النص، الصورة، والفيديو بدون تشتّت بين أدوات منفصلة.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="w-fit gap-1">
          <Link to="/dashboard/templates"><LayoutTemplate className="h-3.5 w-3.5" /> القوالب</Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
        <section className="space-y-5 rounded-xl border border-border bg-card p-5 shadow-soft">
          <div>
            <Label>هدف الحملة</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {GOALS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setGoal(item.value)}
                  className={cn(
                    "rounded-lg border p-4 text-right transition-colors",
                    goal === item.value ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/70"
                  )}
                >
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
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setChannel(item.value)}
                  className={cn(
                    "min-h-20 rounded-lg border px-3 py-3 text-center text-xs transition-colors",
                    channel === item.value ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary/70"
                  )}
                >
                  <div className="font-extrabold">{item.label}</div>
                  <div className="mt-1 text-[11px] leading-5 text-muted-foreground">{item.output}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <Label htmlFor="campaign-product">المنتج</Label>
              <Textarea
                id="campaign-product"
                value={product}
                onChange={(event) => setProduct(event.target.value)}
                className="mt-2 min-h-28"
                maxLength={500}
                placeholder="مثلاً: عطر شرقي فاخر 100مل بثبات عالٍ"
              />
            </div>
            <div>
              <Label htmlFor="campaign-audience">الجمهور</Label>
              <Textarea
                id="campaign-audience"
                value={audience}
                onChange={(event) => setAudience(event.target.value)}
                className="mt-2 min-h-28"
                maxLength={500}
                placeholder="مثلاً: نساء 25-40 يبحثن عن هدية راقية"
              />
            </div>
            <div>
              <Label htmlFor="campaign-offer">العرض / السبب</Label>
              <Textarea
                id="campaign-offer"
                value={offer}
                onChange={(event) => setOffer(event.target.value)}
                className="mt-2 min-h-28"
                maxLength={500}
                placeholder="مثلاً: خصم 20% لأول 48 ساعة أو إطلاق مجموعة جديدة"
              />
            </div>
          </div>

          <div className="rounded-lg border border-gold/30 bg-gold/5 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-extrabold">موجز الحملة الجاهز</p>
                <p className="mt-1 text-xs text-muted-foreground">انسخه أو استخدم أزرار التنفيذ لنقله للأدوات المناسبة.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={copyBrief} className="gap-1">
                <Copy className="h-3.5 w-3.5" /> نسخ الموجز
              </Button>
            </div>
            <pre className="mt-4 whitespace-pre-wrap rounded-lg border border-border bg-background p-4 text-right font-sans text-sm leading-7 text-foreground">{campaignBrief}</pre>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <h2 className="font-extrabold">مخرجات الحملة</h2>
            <div className="mt-4 space-y-3">
              <OutputStep
                icon={Wand2}
                title="نص الحملة"
                desc="منشور، CTA، ونسخة واتساب"
                to="/dashboard/generate-text"
                payload={textPrompt}
              />
              <OutputStep
                icon={ImageIcon}
                title="الصورة الإعلانية"
                desc="بوستر أو صورة منتج متوافقة مع الزاوية"
                to="/dashboard/generate-image"
                payload={imagePrompt}
              />
              <OutputStep
                icon={Clapperboard}
                title="الفيديو القصير"
                desc="Prompt جاهز لـFast أو Quality"
                to="/dashboard/generate-video"
                payload={videoPrompt}
              />
            </div>
          </section>

          <section className="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-soft">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <h2 className="font-extrabold">تسلسل نشر مقترح</h2>
            </div>
            <ol className="mt-4 space-y-3 text-sm leading-7">
              <li className="rounded-lg bg-background/70 p-3"><strong>اليوم 1:</strong> Hook نصي + صورة Hero لاختبار الزاوية.</li>
              <li className="rounded-lg bg-background/70 p-3"><strong>اليوم 2:</strong> فيديو قصير بنفس الرسالة لزيادة الثقة.</li>
              <li className="rounded-lg bg-background/70 p-3"><strong>اليوم 3:</strong> رسالة واتساب مختصرة للمهتمين أو العملاء السابقين.</li>
            </ol>
          </section>
        </aside>
      </div>
    </DashboardShell>
  );
}

function OutputStep({ icon: Icon, title, desc, to, payload }: {
  icon: typeof Wand2;
  title: string;
  desc: string;
  to: "/dashboard/generate-text" | "/dashboard/generate-image" | "/dashboard/generate-video";
  payload: string;
}) {
  const copy = async () => {
    await navigator.clipboard.writeText(payload);
    toast.success(`تم نسخ ${title}`);
  };

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-extrabold">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="outline" size="sm" onClick={copy} className="flex-1 gap-1">
          <Copy className="h-3.5 w-3.5" /> نسخ
        </Button>
        <Button asChild size="sm" className="flex-1 gradient-primary text-primary-foreground shadow-elegant">
          <Link to={to} search={{ prompt: payload }}>فتح الأداة <ArrowLeft className="h-3.5 w-3.5" /></Link>
        </Button>
      </div>
    </div>
  );
}
