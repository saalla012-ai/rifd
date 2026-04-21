import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  ShieldCheck,
  Star,
  Crown,
  Users,
  Flame,
  Rocket,
  Palette,
  Briefcase,
  Gift,
  ArrowLeft,
  TrendingUp,
  Sparkles,
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
      { title: "الأسعار — باقات تبدأ من 0 ر.س | رِفد للتقنية" },
      {
        name: "description",
        content:
          "ابدأ مجاناً ثم ارقَ متى ما حبيت. باقة احترافي 79 ر.س شهرياً مع توليدات نصية لا محدودة + 60 صورة. ضمان استرجاع 7 أيام.",
      },
      { property: "og:title", content: "أسعار رِفد — باقات شفافة بالريال السعودي" },
      { property: "og:description", content: "مجاني • احترافي 79ر • أعمال 199ر — مع ضمان 7 أيام." },
    ],
  }),
  component: PricingPage,
});

type BonusGroup = {
  title: string;
  icon: typeof Rocket;
  items: string[];
};

type Plan = {
  id: string;
  name: string;
  tier: "free" | "popular" | "premium";
  price: { monthly: number; yearly: number };
  tagline: string;
  badge?: { text: string; icon: typeof Flame };
  valueLine?: string;
  socialProof?: string;
  bonusGroups: BonusGroup[];
  cta: string;
};

const PLANS: Plan[] = [
  {
    id: "free",
    name: "مجاني",
    tier: "free",
    price: { monthly: 0, yearly: 0 },
    tagline: "للتجربة والاستكشاف",
    bonusGroups: [
      {
        title: "ابدأ بدون مخاطرة",
        icon: Rocket,
        items: [
          "5 توليدات نصية شهرياً",
          "2 صورة شهرياً (Nano Banana سريع)",
          "10 قوالب أساسية",
          "ذاكرة متجر بسيطة",
          "دعم بالعربي عبر البريد",
        ],
      },
    ],
    cta: "ابدأ مجاناً",
  },
  {
    id: "pro",
    name: "احترافي",
    tier: "popular",
    price: { monthly: 79, yearly: 790 },
    tagline: "الخيار الأذكى للمتاجر الناشئة",
    badge: { text: "🔥 الأنسب للمتاجر الناشئة", icon: Flame },
    valueLine: "≈ 2.6 ر.س يومياً • أرخص من فنجان قهوة ☕",
    bonusGroups: [
      {
        title: "إنتاج بلا حدود",
        icon: Rocket,
        items: [
          "توليدات نصية غير محدودة",
          "50 صورة سريعة + 10 صور Pro شهرياً",
          "تحسين صور المنتجات (تعديل بـAI)",
        ],
      },
      {
        title: "قوالب وذكاء",
        icon: Palette,
        items: [
          "كل القوالب الاحترافية",
          "ذاكرة متجر ذكية كاملة",
        ],
      },
      {
        title: "احترافية",
        icon: Briefcase,
        items: [
          "تجهيز المحتوى للنشر في سلة وزد",
          "فاتورة ضريبية رسمية",
          "دعم مباشر عبر واتساب",
        ],
      },
    ],
    cta: "ابدأ تجربة 7 أيام",
  },
  {
    id: "business",
    name: "أعمال",
    tier: "premium",
    price: { monthly: 199, yearly: 1990 },
    tagline: "الأنسب قيمة للوكالات والمتاجر الكبرى",
    badge: { text: "👑 الأنسب للوكالات", icon: Crown },
    valueLine: "≈ 39.8 ر.س لكل متجر (5 ملفات) • يعادل موظف بـ4,000 ر.س",
    bonusGroups: [
      {
        title: "كل مزايا احترافي +",
        icon: Rocket,
        items: [
          "200 صورة سريعة + 50 صور Pro شهرياً",
          "5 ملفات متاجر متعددة",
          "أولوية في طابور التوليد",
        ],
      },
      {
        title: "أدوات احترافية متقدمة",
        icon: Briefcase,
        items: [
          "API للوصول البرمجي (قريباً)",
          "تكامل مع Meta و Google Ads (قريباً)",
        ],
      },
      {
        title: "🎁 حصري للمؤسسين",
        icon: Gift,
        items: [
          "مدير حساب مخصص",
          "جلسة استشارية مجانية للإطلاق",
          "دعم مباشر عبر واتساب من المؤسس",
        ],
      },
    ],
    cta: "احجز مكانك في الأعمال 👑",
  },
];

const FAQS = [
  {
    q: "هل أحتاج بطاقة ائتمان للبدء؟",
    a: "لا. الباقة المجانية ما تحتاج أي معلومات دفع. تجرّب وتشوف، وإذا حبيت ترقّى، تدفع متى ما حبيت.",
  },
  {
    q: "كيف يشتغل ضمان الاسترجاع؟",
    a: "خلال 7 أيام من اشتراكك في أي باقة مدفوعة، إذا ما عجبتك التجربة، تواصل معنا ونرجع لك المبلغ كاملاً. ينطبق على المدة الأولى للاشتراك، وضمن الحدود المنصوص عليها في سياسة الاسترجاع.",
  },
  {
    q: "هل الأسعار شاملة الضريبة؟",
    a: "تضاف ضريبة القيمة المضافة 15% عند الدفع. تحصل على فاتورة ضريبية رسمية بعد كل عملية.",
  },
  {
    q: "هل يمكنني الإلغاء أو التغيير في أي وقت؟",
    a: "أكيد. تقدر تلغي أو تغيّر باقتك من لوحة التحكم بدون أي رسوم خفية أو فترات التزام.",
  },
  {
    q: "ماذا يحصل لو تجاوزت حصة الصور؟",
    a: "نشعرك قبل الوصول للحد. لو تحتاج زيادة، تقدر تشتري 'باقة صور إضافية' (50 صورة بـ29 ر.س) أو ترقّي.",
  },
];

function PricingPage() {
  const [yearly, setYearly] = useState(false);
  const { user } = useAuth();
  const [seatsLeft, setSeatsLeft] = useState<number | null>(null);
  const [seatsTotal, setSeatsTotal] = useState<number>(1000);
  const [discountPct, setDiscountPct] = useState<number>(30);

  useEffect(() => {
    void (async () => {
      // RPC عام آمن — يعمل للزوار وللمسجلين بنفس الكفاءة
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
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-bold text-gold">
            <Crown className="h-3.5 w-3.5" />
            احجز سعرك قبل الزيادة — برنامج المؤسسين محدود
          </div>
          <h1 className="mt-4 text-3xl font-extrabold sm:text-5xl">
            ابدأ مجاناً، <span className="text-gradient-primary">ادفع لما تكبر</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            تفعيل خلال 24 ساعة من رفع الإيصال • دعم سريع عبر واتساب • ضمان استرجاع 7 أيام
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
                سعرك مجمّد مدى الحياة 🔒 — سترتفع الأسعار {discountPct}% بعد اكتمال برنامج المؤسسين
              </p>
            </div>
          )}

          <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-border bg-card p-1.5">
            <button
              onClick={() => setYearly(false)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium",
                !yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              شهري
            </button>
            <button
              onClick={() => setYearly(true)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium",
                yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              سنوي
              <span className="rounded-full bg-gold/30 px-1.5 py-0.5 text-[10px] font-bold text-gold-foreground">
                خصم شهرين
              </span>
            </button>
          </div>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4">
          {/* Cards grid — extra vertical padding to accommodate scaled cards */}
          <div className="grid items-stretch gap-6 pt-8 md:grid-cols-3 md:gap-4 md:pt-10">
            {PLANS.map((plan) => {
              const price = yearly ? plan.price.yearly : plan.price.monthly;
              const isPaid = price > 0;
              const futurePrice = Math.round(price * (1 + discountPct / 100));
              const isPopular = plan.tier === "popular";
              const isPremium = plan.tier === "premium";
              const isFree = plan.tier === "free";

              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative flex flex-col rounded-2xl border bg-card p-6 transition-all",
                    isFree && "border-border opacity-95",
                    isPopular &&
                      "z-20 border-2 border-primary bg-gradient-to-b from-primary/5 via-card to-card shadow-[0_0_40px_-10px_hsl(var(--primary)/0.4)] ring-2 ring-primary/20 md:scale-[1.05]",
                    isPremium &&
                      "z-10 border-2 border-gold/60 bg-gradient-to-br from-gold/5 via-card to-primary/5 shadow-[0_0_30px_-12px_hsl(var(--gold)/0.5)] md:scale-[1.02]"
                  )}
                >
                  {/* Top badge */}
                  {plan.badge && (
                    <span
                      className={cn(
                        "absolute -top-3.5 right-1/2 inline-flex translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1 text-xs font-bold shadow-elegant",
                        isPopular && "gradient-primary text-primary-foreground",
                        isPremium && "gradient-gold text-gold-foreground shadow-gold"
                      )}
                    >
                      {plan.badge.text}
                    </span>
                  )}

                  <div className="mt-1">
                    <h3 className={cn("text-xl font-extrabold", isPremium && "text-gold")}>
                      {plan.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
                  </div>

                  {/* Price */}
                  <div className="mt-5 flex items-baseline gap-2">
                    <span className="text-5xl font-extrabold tracking-tight">{price}</span>
                    <span className="text-sm text-muted-foreground">
                      ر.س / {yearly ? "سنوياً" : "شهرياً"}
                    </span>
                  </div>

                  {/* Value line */}
                  {plan.valueLine && (
                    <p
                      className={cn(
                        "mt-2 text-xs font-bold",
                        isPopular && "text-primary",
                        isPremium && "text-gold"
                      )}
                    >
                      {plan.valueLine}
                    </p>
                  )}

                  {/* Founding price tag */}
                  {isPaid && (
                    <div className="mt-3 space-y-1.5">
                      <div className="inline-flex w-fit items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-bold text-gold">
                        🔒 سعر المؤسسين — مجمّد مدى الحياة
                      </div>
                      <div className="text-[11px] font-medium text-warning">
                        ⚠️ سيرتفع لـ {futurePrice} ر.س بعد انتهاء برنامج المؤسسين
                      </div>
                    </div>
                  )}
                  {yearly && plan.price.monthly > 0 && (
                    <p className="mt-1 text-xs text-success">
                      توفر {plan.price.monthly * 12 - plan.price.yearly} ر.س سنوياً
                    </p>
                  )}

                  {/* Social proof */}
                  {plan.socialProof && (
                    <div
                      className={cn(
                        "mt-3 inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold",
                        isPopular && "bg-primary/10 text-primary",
                        isPremium && "bg-gold/10 text-gold"
                      )}
                    >
                      <Sparkles className="h-3 w-3" />
                      {plan.socialProof}
                    </div>
                  )}

                  {/* CTA */}
                  <Button
                    asChild
                    size="lg"
                    className={cn(
                      "mt-5 font-bold",
                      isPopular && "gradient-primary text-primary-foreground shadow-elegant",
                      isPremium && "gradient-gold text-gold-foreground shadow-gold",
                      isFree && "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                  >
                    <Link to={plan.id === "free" ? "/onboarding" : ctaTarget}>
                      {plan.cta}
                      <ArrowLeft className="mr-1 h-4 w-4" />
                    </Link>
                  </Button>

                  {/* Grouped features */}
                  <div className="mt-6 space-y-4">
                    {plan.bonusGroups.map((group) => {
                      const Icon = group.icon;
                      return (
                        <div key={group.title}>
                          <div
                            className={cn(
                              "mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide",
                              isPopular && "text-primary",
                              isPremium && "text-gold",
                              isFree && "text-muted-foreground"
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {group.title}
                          </div>
                          <ul className="space-y-2 text-sm">
                            {group.items.map((f) => (
                              <li key={f} className="flex items-start gap-2">
                                <Check
                                  className={cn(
                                    "mt-0.5 h-4 w-4 shrink-0",
                                    isPremium ? "text-gold" : "text-success"
                                  )}
                                />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pro → Business comparison bar */}
          <div className="mt-12 rounded-2xl border border-gold/30 bg-gradient-to-l from-gold/10 via-primary/5 to-transparent p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-gold/20 p-2.5">
                  <TrendingUp className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <div className="text-sm font-bold">
                    الترقية من <span className="text-primary">احترافي</span> إلى{" "}
                    <span className="text-gold">أعمال</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    +150 صورة • +4 ملفات متاجر • +مدير حساب مخصص • API و تكامل إعلانات (قريباً)
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-xs text-muted-foreground">فقط بـ</div>
                <div className="text-lg font-extrabold text-gold">
                  +120 ر.س/شهر <span className="text-xs font-normal text-muted-foreground">(≈4 ر.س يومياً)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Why Pro? / Why Business? */}
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-6">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/15 p-2">
                  <Flame className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-extrabold">لماذا "احترافي"؟</h3>
              </div>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>متجر واحد ينمو بسرعة ويحتاج محتوى يومي بدون قيود</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>ميزانية ذكية — أرخص من ساعة عمل لكاتب محتوى</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>كل القوالب + ذاكرة متجر كاملة + دعم واتساب</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/10 to-transparent p-6">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-gold/20 p-2">
                  <Crown className="h-4 w-4 text-gold" />
                </div>
                <h3 className="font-extrabold">لماذا "أعمال"؟</h3>
              </div>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <span>تدير +5 متاجر أو وكالة محتوى — كل ملف منفصل</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <span>تحتاج مدير حساب وأولوية في طابور التوليد</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <span>مدير حساب VIP + جلسة استشارية مجانية + دعم مخصص ذو أولوية</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10">
            <TrustBadges items={6} />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" /> ضمان 7 أيام كامل
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-primary" /> تحويل بنكي سعودي آمن
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-gold" /> فاتورة ضريبية رسمية
            </span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-secondary/30 py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-center text-3xl font-extrabold">أسئلة شائعة</h2>
          <div className="mt-8 space-y-3">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group rounded-xl border border-border bg-card p-4 open:shadow-soft"
              >
                <summary className="cursor-pointer list-none font-bold">
                  <span className="inline-flex items-center gap-2">
                    <span className="text-primary group-open:rotate-45 transition-transform">＋</span>
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
