import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Clapperboard, PlayCircle, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getVariant, rememberAttribution, trackEvent } from "@/lib/ab-test";

const HERO_EXPERIMENT = "hero_hook" as const;

const capabilities = [
  "هوكات إعلانية",
  "أوصاف منتجات",
  "منشورات عروض",
  "أفكار ريلز",
  "سكربت فيديو",
  "صور منتجات",
  "حملات موسمية",
  "رسائل واتساب",
  "عناوين إعلانات",
  "محتوى إطلاق منتج",
] as const;

const proofItems = [
  "عطر شتوي: هوك + وصف + فكرة ريلز",
  "عباية سوداء: منشور عرض + زاوية تصوير",
  "قهوة مختصة: نص إعلان + فكرة صورة",
  "إلكترونيات: وصف منتج + CTA",
  "هدايا: حملة موسمية + سكربت قصير",
  "عناية وبشرة: عرض + منشور + فكرة فيديو",
] as const;

export function HomeHero() {
  const [variant, setVariant] = useState<"A" | "B">("A");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const resolvedVariant = getVariant(HERO_EXPERIMENT);
    setVariant(resolvedVariant);
    void trackEvent(HERO_EXPERIMENT, resolvedVariant, "view");
  }, []);

  const handleCtaClick = () => {
    rememberAttribution(HERO_EXPERIMENT, variant);
    void trackEvent(HERO_EXPERIMENT, variant, "cta_click");
  };

  return (
    <section className="relative overflow-hidden gradient-hero">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-gold/60 to-transparent" />
      <div className="pointer-events-none absolute -top-28 right-[-12%] h-[26rem] w-[26rem] rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-[-10%] h-[24rem] w-[24rem] rounded-full bg-gold/25 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-7 sm:py-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:py-12">
        <div className="order-2 lg:order-1">
          <VideoProofCard />
        </div>

        <div className="order-1 text-center lg:order-2 lg:text-right">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-extrabold text-primary lg:mx-0">
            <Zap className="h-3.5 w-3.5" />
            +150 قدرة محتوى للمتاجر السعودية
          </div>

          <h1 className="mt-4 text-[2rem] font-black leading-[1.08] tracking-normal sm:text-5xl lg:text-6xl">
            <span className="block">ودّع <bdi dir="ltr">ChatGPT</bdi>،</span>
            <span className="mt-1 block text-gradient-primary">واختصر ساعات من كتابة وصناعة محتوى متجرك.</span>
            <span className="mt-3 block text-[0.58em] font-extrabold leading-[1.35] text-foreground/90 sm:text-[0.5em]">
              نصوص وصور وفيديوهات بالعامية السعودية جاهزة.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm font-medium leading-7 text-muted-foreground sm:text-base sm:leading-8 lg:mx-0">
            منصة سعودية شاملة لصناعة محتوى المتاجر: نصوص، صور، وفيديوهات بالعامية السعودية، مبنية على فهم عملي ومدروس لسلوك السوق السعودي، وتعمل بأقوى أدوات الذكاء الاصطناعي.
          </p>

          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Button
              asChild
              size="lg"
              className="h-14 w-full max-w-[19rem] gap-2 gradient-gold text-base font-extrabold text-gold-foreground shadow-gold sm:w-auto sm:px-8"
            >
              <Link to="/onboarding" onClick={handleCtaClick}>
                <Sparkles className="h-5 w-5" />
                ابدأ مجاناً
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 w-full max-w-[19rem] bg-background/70 font-extrabold sm:w-auto">
              <Link to="/proof-center">
                شاهد الإثبات
                <PlayCircle className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-foreground/80 lg:justify-start">
            {['بدون بطاقة ائتمان', 'بداية سريعة', 'مناسب للمتاجر السعودية'].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/85 px-3 py-1.5 shadow-soft">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                {item}
              </span>
            ))}
          </div>

        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-6 lg:-mt-3 lg:pb-8">
        <CapabilitiesStrip />
      </div>

      <LiveProofTicker />
    </section>
  );
}

function VideoProofCard() {
  return (
    <div className="relative mx-auto max-w-2xl lg:mx-0">
      <div className="absolute inset-0 -z-10 translate-y-4 rounded-[1.75rem] bg-primary/15 blur-2xl" aria-hidden />
      <div className="overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-elegant">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-secondary/45 px-4 py-3">
          <div>
            <div className="text-xs font-extrabold text-primary">شاهد رِفد في ثوانٍ</div>
            <div className="mt-1 text-sm font-black">من وصف بسيط إلى محتوى متجر جاهز</div>
          </div>
          <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-bold text-success">
            <span className="h-2 w-2 rounded-full bg-success" />
            فيديو
          </div>
        </div>
        <div className="aspect-video bg-background">
          <video
            className="h-full w-full object-cover"
            src="/rifd-promo.mp4"
            controls
            muted
            playsInline
            preload="metadata"
            poster="/og-image.jpg"
            aria-label="فيديو رِفد الذي يوضح كيف يساعد المتاجر السعودية في صناعة المحتوى"
          >
            متصفحك لا يدعم تشغيل الفيديو.
          </video>
        </div>
        <div className="grid grid-cols-3 border-t border-border bg-background/85 text-center text-[11px] font-extrabold text-foreground/85 sm:text-xs">
          <div className="border-l border-border px-2 py-3">نصوص</div>
          <div className="border-l border-border px-2 py-3">صور</div>
          <div className="px-2 py-3">فيديوهات</div>
        </div>
      </div>
    </div>
  );
}

function CapabilitiesStrip() {
  return (
    <div className="mt-6 rounded-2xl border border-primary/15 bg-background/65 p-3 shadow-soft backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-center gap-2 text-xs font-black text-primary lg:justify-start">
        <Clapperboard className="h-3.5 w-3.5" />
        شريط القدرات المخفية
      </div>
      <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
        {capabilities.map((item) => (
          <span key={item} className="rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-bold text-foreground/85 shadow-soft sm:text-xs">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function LiveProofTicker() {
  const repeated = [...proofItems, ...proofItems, ...proofItems];

  return (
    <div className="border-y border-border bg-primary text-primary-foreground">
      <div className="flex items-center gap-3 overflow-hidden py-3">
        <div className="shrink-0 pe-1 ps-4 text-xs font-black sm:ps-6 sm:text-sm">الإثبات الحي</div>
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div className="live-proof-marquee flex w-max items-center gap-3">
            {repeated.map((item, index) => (
              <span
                key={`${item}-${index}`}
                className="rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-xs font-bold text-primary-foreground/95 sm:text-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}