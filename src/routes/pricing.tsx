import { Suspense, lazy, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  Crown,
  Film,
  Gift,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { MarketingLayout } from "@/components/marketing-layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { PLAN_CATALOG, estimateVideoCount, formatPlanNumber, videoCreditCost } from "@/lib/plan-catalog";

const SubscribersCounter = lazy(() => import("@/components/subscribers-counter").then((m) => ({ default: m.SubscribersCounter })));
const TrustBadges = lazy(() => import("@/components/trust-badges").then((m) => ({ default: m.TrustBadges })));

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "أسعار رِفد — نقاط فيديو للمتاجر السعودية" },
      {
        name: "description",
        content:
          "باقات رِفد الجديدة: نصوص وصور بسقوف يومية، ونقاط فيديو واضحة لتوليد إعلانات قصيرة، مع ضمان 14 يوم وفوترة شفافة.",
      },
      { property: "og:title", content: "أسعار رِفد — نصوص وصور + نقاط فيديو" },
      {
        property: "og:description",
        content:
          "Starter 149ر، Growth 249ر، Pro 399ر، Business 999ر — فيديوهات بالنقاط دون وعود غير محدودة.",
      },
      { name: "twitter:title", content: "أسعار رِفد — نقاط فيديو واضحة" },
      {
        name: "twitter:description",
        content:
          "اختر باقتك حسب عدد فيديوهاتك الشهرية: Fast من 150 نقطة وQuality من 450 نقطة.",
      },
    ],
    links: [{ rel: "canonical", href: "https://rifd.site/pricing" }],
  }),
  component: PricingPage,
});

function planFeatures(plan: (typeof PLAN_CATALOG)[number]) {
  return [
    `${formatPlanNumber(plan.dailyTextCap)} نص يومياً`,
    `${formatPlanNumber(plan.dailyImageCap)} صورة يومياً${plan.imageProAllowed ? " تشمل Pro" : " — Flash فقط"}`,
    plan.dailyVideoCap > 0 ? `${formatPlanNumber(plan.dailyVideoCap)} فيديو يومياً حتى ${plan.maxVideoDurationSeconds} ث` : "الفيديو غير متاح في المجاني",
    plan.videoQualityAllowed ? "Fast وQuality حسب النقاط" : "Fast فقط حسب النقاط",
  ];
}

const FAQS = [
  {
    q: "هل الفيديوهات غير محدودة؟",
    a: `لا. الفيديوهات تعمل بنقاط فيديو واضحة حتى يبقى السعر عادلاً والنتيجة قابلة للتنبؤ. تكلفة 5ث: Fast ${videoCreditCost("fast", 5)} نقطة وQuality ${videoCreditCost("quality", 5)} نقطة، ومدة 8ث لها تكلفة أعلى.`,
  },
  {
    q: "هل النصوص والصور تخصم من نقاط الفيديو؟",
    a: "لا. النصوص والصور لا تخصم نقاط فيديو، لكنها محمية بسقوف يومية لمنع إساءة الاستخدام وحماية جودة الخدمة.",
  },
  {
    q: "ماذا يحدث إذا انتهت نقاط الفيديو؟",
    a: "يمكنك شحن نقاط فيديو إضافية من لوحة التحكم، أو الترقية إلى باقة أعلى حسب حجم حملاتك.",
  },
  {
    q: "كيف يعمل ضمان 14 يوم؟",
    a: "إذا لم تكن التجربة مناسبة خلال أول 14 يوماً من الاشتراك الأول، تواصل معنا ونراجع طلب الاسترجاع وفق سياسة الاسترجاع المنشورة.",
  },
  {
    q: "هل الأسعار شاملة الضريبة؟",
    a: "تظهر تفاصيل الضريبة والفوترة بوضوح عند الدفع أو التفعيل حسب مسار الاشتراك المتاح داخل المنتج.",
  },
];

function PricingPage() {
  const [yearly, setYearly] = useState(false);
  const [seatsLeft, setSeatsLeft] = useState<number | null>(null);
  const [seatsTotal, setSeatsTotal] = useState(1000);
  const [discountPct, setDiscountPct] = useState(30);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.rpc("get_founding_status");
      const row = Array.isArray(data) ? data[0] : data;
      setSeatsTotal(row?.seats_total ?? 1000);
      setSeatsLeft(row?.seats_left ?? 1000);
      setDiscountPct(row?.discount_pct ?? 30);
    })();
  }, []);

  const ctaTarget = "/dashboard/billing";

  return (
    <MarketingLayout>
      <section className="border-b border-border bg-secondary/30 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-bold text-gold">
            <Film className="h-3.5 w-3.5" /> نظام جديد: نقاط للفيديو فقط
          </div>
          <h1 className="mx-auto mt-4 min-h-[5.75rem] max-w-3xl text-3xl font-extrabold leading-[1.28] sm:min-h-[7.75rem] sm:text-5xl sm:leading-[1.18]">
            نصوص وصور يومية، <span className="text-gradient-primary">وفيديوهات بنقاط واضحة</span>
          </h1>
          <p className="mx-auto mt-3 min-h-[5.25rem] max-w-2xl text-sm leading-7 text-muted-foreground sm:min-h-[3.5rem] sm:text-base">
            اختر باقتك حسب عدد فيديوهاتك الشهرية. النصوص والصور ضمن سقوف حماية يومية، والفيديو يُحاسب فقط بنقاط شفافة: Fast بـ150 نقطة وQuality بـ450 نقطة.
          </p>

          <div className="mx-auto mt-5 flex min-h-[3.75rem] max-w-md items-center justify-center">
            <Suspense fallback={<div className="h-12 w-full rounded-xl border border-border bg-card/70" aria-hidden="true" />}>
              <SubscribersCounter />
            </Suspense>
          </div>

          <div className="mx-auto mt-4 min-h-[6.75rem] max-w-md">
            {seatsLeft !== null && seatsLeft > 0 && (
              <div className="rounded-xl border border-gold/40 bg-gradient-to-br from-gold/10 to-transparent p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 font-bold text-gold">
                    <Users className="h-4 w-4" /> المقاعد المتبقية بسعر المؤسسين
                  </span>
                  <span className="font-extrabold text-gold">
                    {seatsLeft.toLocaleString("ar-SA")} / {seatsTotal.toLocaleString("ar-SA")}
                  </span>
                </div>
                <Progress value={((seatsTotal - seatsLeft) / seatsTotal) * 100} className="mt-2 h-2" />
                <p className="mt-2 text-xs text-muted-foreground">
                  سعرك مجمّد مدى الحياة — سترتفع الأسعار {discountPct}% بعد اكتمال برنامج المؤسسين
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card p-1.5">
            <button
              type="button"
              onClick={() => setYearly(false)}
              className={cn("rounded-full px-4 py-1.5 text-sm font-bold", !yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
            >
              شهري
            </button>
            <button
              type="button"
              onClick={() => setYearly(true)}
              className={cn("inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold", yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
            >
              سنوي <span className="rounded-full bg-gold/25 px-1.5 py-0.5 text-[10px] text-gold">شهران مجاناً</span>
            </button>
          </div>
        </div>
      </section>

      <section className="bg-background py-14">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-5">
            {PLAN_CATALOG.map((plan) => {
              const price = yearly ? plan.yearlyPriceSar : plan.monthlyPriceSar;
              const isPaid = price > 0;
              const isPopular = plan.tier === "popular";
              const isPremium = plan.tier === "premium" || plan.tier === "scale";
              const badge = "badge" in plan ? plan.badge : undefined;
              const cta = plan.id === "free" ? "ابدأ مجاناً" : `اشترك في ${plan.name}`;
              const fastVideos = estimateVideoCount(plan.monthlyCredits, "fast", 5);
              const qualityVideos = plan.videoQualityAllowed ? estimateVideoCount(plan.monthlyCredits, "quality", 5) : 0;
              return (
                <article
                  key={plan.id}
                  className={cn(
                    "relative flex min-h-full flex-col rounded-2xl border bg-card p-5 shadow-soft",
                    isPopular && "border-2 border-primary bg-gradient-to-b from-primary/10 via-card to-card ring-2 ring-primary/15",
                    isPremium && "border-gold/50 bg-gradient-to-br from-gold/10 via-card to-card"
                  )}
                >
                  {badge && (
                    <div className={cn("absolute -top-3 right-4 rounded-full px-3 py-1 text-[11px] font-extrabold", isPopular ? "gradient-primary text-primary-foreground" : "gradient-gold text-gold-foreground")}>
                      {badge}
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-xl font-extrabold">{plan.name}</h2>
                      <p className="mt-1 min-h-10 text-xs leading-5 text-muted-foreground">{plan.tagline}</p>
                    </div>
                    {isPopular ? <Sparkles className="h-5 w-5 text-primary" /> : isPremium ? <Crown className="h-5 w-5 text-gold" /> : <Rocket className="h-5 w-5 text-muted-foreground" />}
                  </div>

                  <div className="mt-5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-extrabold tracking-normal">{price}</span>
                      <span className="text-xs text-muted-foreground">ر.س / {yearly ? "سنوياً" : "شهرياً"}</span>
                    </div>
                    {yearly && plan.monthlyPriceSar > 0 && (
                      <p className="mt-1 text-xs font-bold text-success">
                        توفر {(plan.monthlyPriceSar * 12 - plan.yearlyPriceSar).toLocaleString("ar-SA")} ر.س سنوياً
                      </p>
                    )}
                  </div>

                  <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-3">
                    <div className="flex items-center gap-2 text-sm font-extrabold text-primary">
                      <Zap className="h-4 w-4" /> {formatPlanNumber(plan.monthlyCredits)} نقطة فيديو
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <p>{plan.videoFastAllowed ? `حتى ${formatPlanNumber(fastVideos)} فيديو Fast 5ث` : "الفيديو غير متاح"}</p>
                      <p>{plan.videoQualityAllowed ? `حتى ${formatPlanNumber(qualityVideos)} فيديو Quality 5ث` : "Quality غير متاح"}</p>
                    </div>
                  </div>

                  <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                    {planFeatures(plan).map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className={cn("mt-0.5 h-4 w-4 shrink-0", isPremium ? "text-gold" : "text-success")} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    className={cn("mt-5 w-full font-bold", isPopular && "gradient-primary text-primary-foreground shadow-elegant", isPremium && "gradient-gold text-gold-foreground shadow-gold")}
                    variant={plan.id === "free" ? "outline" : "default"}
                  >
                    <Link to={plan.id === "free" ? "/onboarding" : ctaTarget}>
                      {cta} <ArrowLeft className="mr-1 h-4 w-4" />
                    </Link>
                  </Button>
                </article>
              );
            })}
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <h2 className="mt-3 font-extrabold">لا وعود غير محدودة للفيديو</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">نقاط الفيديو تجعل التكلفة واضحة وتحافظ على جودة الخدمة وسرعة التنفيذ.</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <Gift className="h-6 w-6 text-gold" />
              <h2 className="mt-3 font-extrabold">نصوص وصور ضمن الباقة</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">لا تخصم من نقاط الفيديو، وتبقى محمية بسقوف يومية عملية لكل متجر.</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <Star className="h-6 w-6 text-success" />
              <h2 className="mt-3 font-extrabold">ضمان 14 يوم</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">ابدأ بوضوح، وراجع التجربة خلال أول أسبوعين حسب سياسة الاسترجاع.</p>
            </div>
          </div>

          <div className="mt-10">
            <Suspense fallback={null}>
              <TrustBadges items={6} />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-secondary/30 py-14">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-center text-3xl font-extrabold">أسئلة شائعة</h2>
          <div className="mt-8 space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="group rounded-xl border border-border bg-card p-4 open:shadow-soft">
                <summary className="cursor-pointer list-none font-bold">
                  <span className="inline-flex items-center gap-2">
                    <span className="text-primary transition-transform group-open:rotate-45">＋</span>
                    {f.q}
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
