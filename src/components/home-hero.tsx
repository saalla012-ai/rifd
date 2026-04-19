import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles, ShieldCheck, Zap, Clock, ChevronDown, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubscribersCounter } from "./subscribers-counter";
import { PRODUCT_TYPES } from "@/lib/demo-results";
import { getVariant, trackEvent, type Variant } from "@/lib/ab-test";

const EXPERIMENT = "hero_hook";

/**
 * Hero محكم على الموبايل (موبايل-أولاً).
 * - Hook رقمي قوي
 * - Mini Demo Teaser بحقل واحد + smooth scroll لـLiveAiDemo الكامل
 * - Bullets داخل <details> لتقليل الطول
 */
export function HomeHero() {
  const [productType, setProductType] = useState<string>("");
  const [variant, setVariant] = useState<Variant>("A");

  // تعيين variant + تسجيل view مرة واحدة
  useEffect(() => {
    const v = getVariant(EXPERIMENT);
    setVariant(v);
    void trackEvent(EXPERIMENT, v, "view");
  }, []);

  const handleTryNow = () => {
    void trackEvent(EXPERIMENT, variant, "demo_try");
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("rifd:prefill-demo", { detail: { productType: productType || "dropshipping" } })
      );
      const target = document.getElementById("live-demo");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const handleCtaClick = () => {
    void trackEvent(EXPERIMENT, variant, "cta_click");
  };

  return (
    <section className="relative overflow-hidden gradient-hero">
      {/* تأثيرات بصرية */}
      <div className="pointer-events-none absolute -top-40 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-gold/20 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-4 py-8 sm:py-12 lg:py-16">
        {/* شارة حية حقيقية */}
        <div className="flex justify-center">
          <SubscribersCounter variant="inline" />
        </div>

        {/* H1 ضخم */}
        <h1 className="mt-5 text-center text-[2.4rem] font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.5rem]">
          <span className="block">30 منشور لمتجرك</span>
          <span className="block">
            في{" "}
            <span className="relative whitespace-nowrap text-gradient-gold">
              5 دقائق
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 200 8"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 5 Q 50 1, 100 4 T 198 3"
                  stroke="oklch(0.78 0.16 85)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </span>
          <span className="mt-1 block text-2xl font-bold text-foreground/80 sm:text-3xl lg:text-4xl">
            بالعامية السعودية ✨
          </span>
        </h1>

        {/* Sub قصير */}
        <p className="mx-auto mt-4 max-w-xl text-center text-base font-medium text-foreground/85 sm:text-lg">
          بدل ما تدفع <strong className="text-destructive">800 ر.س لكاتب</strong> أو تقعد{" "}
          <strong className="text-destructive">5 ساعات تكتب</strong> — رِفد يسوّيها لك بنقرة.
        </p>

        {/* Mini Demo Teaser */}
        <div className="mx-auto mt-7 max-w-xl rounded-2xl border-2 border-primary/30 bg-card p-4 shadow-elegant sm:p-5">
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary text-primary-foreground">
              <Wand2 className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold">جرّب الآن — بدون تسجيل</span>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex-1">
              <Select value={productType} onValueChange={setProductType}>
                <SelectTrigger className="h-11 bg-background">
                  <SelectValue placeholder="🎯 اختر نوع متجرك..." />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleTryNow}
              size="lg"
              className="h-11 gradient-gold text-gold-foreground shadow-gold transition-transform hover:scale-[1.02]"
            >
              <Sparkles className="h-4 w-4" />
              ولّد منشور تجريبي
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            ⚡ نتيجة بالعامية السعودية في أقل من 10 ثواني
          </p>
        </div>

        {/* CTA رئيسي */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <Button
            asChild
            size="lg"
            className="w-full max-w-xs gradient-primary text-primary-foreground shadow-elegant transition-transform hover:scale-[1.02] sm:w-auto sm:max-w-none"
          >
            <Link to="/onboarding">
              <Sparkles className="h-4 w-4" />
              ابدأ مجاناً — 5 توليدات
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          {/* trust mini */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              بدون بطاقة
            </span>
            <span className="inline-flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-gold" />
              تجربة فورية
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-primary" />
              إلغاء بنقرة
            </span>
          </div>
        </div>

        {/* Bullets داخل details للموبايل */}
        <details className="group mx-auto mt-6 max-w-xl">
          <summary className="flex cursor-pointer list-none items-center justify-center gap-2 text-sm font-medium text-primary hover:underline">
            <span>ليش رِفد بالذات؟</span>
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <ul className="mt-4 grid gap-2 text-sm">
            {[
              { icon: "🇸🇦", text: "بالعامية السعودية الأصيلة — ما تحس إنه مترجم" },
              { icon: "💰", text: "وفّر 800+ ر.س شهرياً تدفعها لمصمم/كاتب" },
              { icon: "⚡", text: "نتيجة جاهزة للنشر في أقل من 10 ثواني" },
              { icon: "🧠", text: "ذاكرة متجر دائمة — يحفظ تفاصيلك ولا تعيد كتابتها" },
            ].map((b) => (
              <li key={b.text} className="flex items-start gap-2 rounded-lg border border-border bg-card/50 p-3 text-foreground/90">
                <span className="text-base">{b.icon}</span>
                <span>{b.text}</span>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </section>
  );
}
