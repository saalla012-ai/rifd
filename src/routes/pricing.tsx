import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles, ShieldCheck, Star, Crown, Users } from "lucide-react";
import { MarketingLayout } from "@/components/marketing-layout";
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

type Plan = {
  id: string;
  name: string;
  price: { monthly: number; yearly: number };
  tagline: string;
  highlight?: boolean;
  features: string[];
  cta: string;
};

const PLANS: Plan[] = [
  {
    id: "free",
    name: "مجاني",
    price: { monthly: 0, yearly: 0 },
    tagline: "للتجربة والاستكشاف",
    features: [
      "5 توليدات نصية شهرياً",
      "2 صورة شهرياً (Nano Banana سريع)",
      "10 قوالب أساسية",
      "ذاكرة متجر بسيطة",
      "دعم بالعربي عبر البريد",
    ],
    cta: "ابدأ مجاناً",
  },
  {
    id: "pro",
    name: "احترافي",
    price: { monthly: 79, yearly: 790 },
    tagline: "للمتاجر الناشئة والمتوسطة",
    highlight: true,
    features: [
      "توليدات نصية غير محدودة",
      "50 صورة سريعة + 10 صور Pro شهرياً",
      "كل الـ40 قالب",
      "ذاكرة متجر ذكية كاملة",
      "تحسين صور المنتجات (تعديل بـAI)",
      "تصدير لسلة وزد",
      "فاتورة ضريبية رسمية",
      "دعم عبر واتساب",
    ],
    cta: "ابدأ تجربة 7 أيام",
  },
  {
    id: "business",
    name: "أعمال",
    price: { monthly: 199, yearly: 1990 },
    tagline: "للمتاجر الكبرى والوكالات",
    features: [
      "كل مزايا احترافي",
      "200 صورة سريعة + 50 صور Pro شهرياً",
      "5 ملفات متاجر متعددة",
      "أولوية في التوليد",
      "API للوصول البرمجي",
      "تكامل مع Meta و Google Ads",
      "مدير حساب مخصص",
      "دعم هاتفي وواتساب 24/7",
    ],
    cta: "تواصل معنا",
  },
];

const FAQS = [
  {
    q: "هل أحتاج بطاقة ائتمان للبدء؟",
    a: "لا. الباقة المجانية ما تحتاج أي معلومات دفع. تجرّب وتشوف، وإذا حبيت ترقّى، تدفع متى ما حبيت.",
  },
  {
    q: "كيف يشتغل ضمان الاسترجاع؟",
    a: "خلال 7 أيام من اشتراكك في أي باقة مدفوعة، إذا ما عجبتك التجربة، تواصل معنا ونرجع لك المبلغ كاملاً بدون أسئلة.",
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
  const [seatsTotal, setSeatsTotal] = useState<number>(50);

  useEffect(() => {
    void (async () => {
      const [settingsRes, takenRes] = await Promise.all([
        supabase.from("app_settings").select("founding_total_seats").eq("id", 1).maybeSingle(),
        supabase
          .from("subscription_requests")
          .select("id", { count: "exact", head: true })
          .in("status", ["activated", "contacted"]),
      ]);
      const total = settingsRes.data?.founding_total_seats ?? 50;
      const taken = takenRes.count ?? 0;
      setSeatsTotal(total);
      setSeatsLeft(Math.max(0, total - taken));
    })();
  }, []);

  const ctaTarget = user ? "/dashboard/billing" : "/auth";

  return (
    <MarketingLayout>
      <section className="border-b border-border bg-secondary/30 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-bold text-gold">
            <Crown className="h-3.5 w-3.5" />
            برنامج الأعضاء المؤسسين — مفتوح حالياً
          </div>
          <h1 className="mt-4 text-3xl font-extrabold sm:text-5xl">
            ابدأ مجاناً، <span className="text-gradient-primary">ادفع لما تكبر</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            بدون رسوم خفية، بدون التزام طويل، وضمان استرجاع 7 أيام كامل
          </p>

          {/* Founding members seats counter */}
          {seatsLeft !== null && seatsLeft > 0 && (
            <div className="mx-auto mt-6 max-w-md rounded-xl border border-gold/40 bg-gradient-to-br from-gold/10 to-transparent p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-bold text-gold">
                  <Users className="h-4 w-4" /> المقاعد المتبقية للمؤسسين
                </span>
                <span className="font-extrabold text-gold">{seatsLeft} / {seatsTotal}</span>
              </div>
              <Progress value={((seatsTotal - seatsLeft) / seatsTotal) * 100} className="mt-2 h-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                السعر ثابت مدى الحياة لكل من ينضم في هذه المرحلة 🔒
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

      <section className="bg-background py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-6 md:grid-cols-3">
            {PLANS.map((plan) => {
              const price = yearly ? plan.price.yearly : plan.price.monthly;
              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative flex flex-col rounded-2xl border bg-card p-6 transition-all",
                    plan.highlight
                      ? "border-primary shadow-elegant ring-1 ring-primary"
                      : "border-border shadow-soft"
                  )}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 right-6 rounded-full gradient-gold px-3 py-1 text-xs font-bold text-gold-foreground shadow-gold">
                      ⭐ الأكثر اختياراً
                    </span>
                  )}
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>

                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">{price}</span>
                    <span className="text-sm text-muted-foreground">
                      ر.س / {yearly ? "سنوياً" : "شهرياً"}
                    </span>
                  </div>
                  {yearly && plan.price.monthly > 0 && (
                    <p className="text-xs text-success">
                      توفر {plan.price.monthly * 12 - plan.price.yearly} ر.س سنوياً
                    </p>
                  )}

                  <Button
                    asChild
                    className={cn(
                      "mt-5",
                      plan.highlight
                        ? "gradient-primary text-primary-foreground shadow-elegant"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                  >
                    <Link to={plan.id === "free" ? "/onboarding" : ctaTarget}>
                      {plan.cta}
                    </Link>
                  </Button>

                  <ul className="mt-6 space-y-2.5 text-sm">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" /> ضمان 7 أيام كامل
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-primary" /> دفع آمن بـStripe / مدى / Apple Pay
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
