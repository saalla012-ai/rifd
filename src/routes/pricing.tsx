import { useEffect, useState } from "react";
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
import { TrustBadges } from "@/components/trust-badges";
import { SubscribersCounter } from "@/components/subscribers-counter";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "أسعار رِفد — نقاط فيديو للمتاجر السعودية" },
      {
        name: "description",
        content:
          "باقات رِفد الجديدة: نصوص وصور بسقوف يومية، ونقاط فيديو واضحة لتوليد إعلانات قصيرة، مع ضمان 14 يوم وفاتورة ضريبية.",
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
      { property: "og:image", content: "https://rifd.site/og-image.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "رِفد — باقات ونقاط فيديو واضحة للمتاجر السعودية" },
      { name: "twitter:image", content: "https://rifd.site/og-image.jpg" },
      { name: "twitter:image:alt", content: "رِفد — باقات ونقاط فيديو واضحة للمتاجر السعودية" },
    ],
    links: [{ rel: "canonical", href: "https://rifd.site/pricing" }],
  }),
  component: PricingPage,
});

type Plan = {
  id: "free" | "starter" | "growth" | "pro" | "business";
  name: string;
  tier: "free" | "entry" | "popular" | "premium" | "scale";
  price: { monthly: number; yearly: number };
  credits: number;
  fastVideos: string;
  qualityVideos: string;
  tagline: string;
  badge?: string;
  cta: string;
  features: string[];
};

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tier: "free",
    price: { monthly: 0, yearly: 0 },
    credits: 150,
    fastVideos: "فيديو ترحيبي واحد",
    qualityVideos: "—",
    tagline: "للتجربة وبناء أول ذاكرة متجر",
    cta: "ابدأ مجاناً",
    features: [
      "200 نص يومياً بسقف حماية",
      "50 صورة يومياً بسقف حماية",
      "فيديو ترحيبي Fast مرة واحدة",
      "قوالب أساسية للمتاجر السعودية",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    tier: "entry",
    price: { monthly: 149, yearly: 1490 },
    credits: 3000,
    fastVideos: "حتى 20 فيديو Fast",
    qualityVideos: "حتى 6 فيديو Quality",
    tagline: "لمتجر يبدأ الإعلان بالفيديو بانتظام",
    cta: "اشترك في Starter",
    features: [
      "3,000 نقطة فيديو شهرياً",
      "نصوص وصور يومية ضمن سقوف حماية مرتفعة",
      "مكتبة توليدات وحفظ النتائج",
      "تفعيل يدوي خلال 24 ساعة بعد الإيصال",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    tier: "popular",
    price: { monthly: 249, yearly: 2490 },
    credits: 6000,
    fastVideos: "حتى 40 فيديو Fast",
    qualityVideos: "حتى 13 فيديو Quality",
    tagline: "الأفضل لمعظم المتاجر النشطة",
    badge: "الأكثر توازناً",
    cta: "اشترك في Growth",
    features: [
      "6,000 نقطة فيديو شهرياً",
      "سعة مناسبة للحملات الأسبوعية",
      "صور ونصوص مجانية بسقوف يومية",
      "أولوية أعلى في الدعم والتفعيل",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tier: "premium",
    price: { monthly: 399, yearly: 3990 },
    credits: 11000,
    fastVideos: "حتى 73 فيديو Fast",
    qualityVideos: "حتى 24 فيديو Quality",
    tagline: "للمتجر الذي يعتمد الفيديو كقناة نمو",
    badge: "أفضل هامش تشغيل",
    cta: "اشترك في Pro",
    features: [
      "11,000 نقطة فيديو شهرياً",
      "إنتاج أكبر للإعلانات والاختبارات",
      "قوالب كاملة + ذاكرة متجر متقدمة",
      "فاتورة ضريبية ودعم واتساب مباشر",
    ],
  },
  {
    id: "business",
    name: "Business",
    tier: "scale",
    price: { monthly: 999, yearly: 9990 },
    credits: 30000,
    fastVideos: "حتى 200 فيديو Fast",
    qualityVideos: "حتى 66 فيديو Quality",
    tagline: "للفرق والوكالات الخفيفة متعددة الحملات",
    badge: "للتوسع",
    cta: "اشترك في Business",
    features: [
      "30,000 نقطة فيديو شهرياً",
      "سعة كبيرة لحملات متعددة ومتاجر أكثر",
      "أولوية تشغيل ومراجعة أعلى",
      "مسار مناسب قبل الحلول المؤسسية المخصصة",
    ],
  },
];

const FAQS = [
  {
    q: "هل الفيديوهات غير محدودة؟",
    a: "لا. الفيديوهات تعمل بنقاط فيديو واضحة حتى يبقى السعر عادلاً والنتيجة قابلة للتنبؤ. تكلفة Fast هي 150 نقطة، وQuality هي 450 نقطة.",
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
    a: "تضاف ضريبة القيمة المضافة 15% عند الدفع، وتصدر فاتورة ضريبية رسمية بعد التفعيل.",
  },
];

function PricingPage() {
  const [yearly, setYearly] = useState(false);
  const { user } = useAuth();
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

  const ctaTarget = user ? "/dashboard/billing" : "/auth";

  return (
    <MarketingLayout>
      <section className="border-b border-border bg-secondary/30 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-bold text-gold">
            <Film className="h-3.5 w-3.5" /> نظام جديد: نقاط للفيديو فقط
          </div>
          <h1 className="mt-4 text-3xl font-extrabold sm:text-5xl">
            نصوص وصور يومية، <span className="text-gradient-primary">وفيديوهات بنقاط واضحة</span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            اختر باقتك حسب عدد فيديوهاتك الشهرية. النصوص والصور ضمن سقوف حماية يومية، والفيديو يُحاسب فقط بنقاط شفافة: Fast بـ150 نقطة وQuality بـ450 نقطة.
          </p>

          <div className="mx-auto mt-5 max-w-md">
            <SubscribersCounter />
          </div>

          {seatsLeft !== null && seatsLeft > 0 && (
            <div className="mx-auto mt-4 max-w-md rounded-xl border border-gold/40 bg-gradient-to-br from-gold/10 to-transparent p-4">
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
            {PLANS.map((plan) => {
              const price = yearly ? plan.price.yearly : plan.price.monthly;
              const isPaid = price > 0;
              const isPopular = plan.tier === "popular";
              const isPremium = plan.tier === "premium" || plan.tier === "scale";
              return (
                <article
                  key={plan.id}
                  className={cn(
                    "relative flex min-h-full flex-col rounded-2xl border bg-card p-5 shadow-soft",
                    isPopular && "border-2 border-primary bg-gradient-to-b from-primary/10 via-card to-card ring-2 ring-primary/15",
                    isPremium && "border-gold/50 bg-gradient-to-br from-gold/10 via-card to-card"
                  )}
                >
                  {plan.badge && (
                    <div className={cn("absolute -top-3 right-4 rounded-full px-3 py-1 text-[11px] font-extrabold", isPopular ? "gradient-primary text-primary-foreground" : "gradient-gold text-gold-foreground")}>
                      {plan.badge}
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
                    {yearly && plan.price.monthly > 0 && (
                      <p className="mt-1 text-xs font-bold text-success">
                        توفر {(plan.price.monthly * 12 - plan.price.yearly).toLocaleString("ar-SA")} ر.س سنوياً
                      </p>
                    )}
                  </div>

                  <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-3">
                    <div className="flex items-center gap-2 text-sm font-extrabold text-primary">
                      <Zap className="h-4 w-4" /> {plan.credits.toLocaleString("ar-SA")} نقطة فيديو
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <p>{plan.fastVideos}</p>
                      <p>{plan.qualityVideos}</p>
                    </div>
                  </div>

                  <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                    {plan.features.map((feature) => (
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
                      {plan.cta} <ArrowLeft className="mr-1 h-4 w-4" />
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
            <TrustBadges items={6} />
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
