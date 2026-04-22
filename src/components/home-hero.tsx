import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles, Star, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubscribersCounter } from "./subscribers-counter";
import { PRODUCT_TYPES } from "@/lib/demo-results";
import { getVariant, rememberAttribution, trackEvent } from "@/lib/ab-test";
import { HERO_BENEFITS, HERO_EXPERIMENT, HERO_HOOKS, QUICK_TYPES } from "./home-hero-content";

/**
 * Hero الصفحة الرئيسية — نسخة أنظف مع فصل المحتوى الثابت عن منطق العرض.
 */
export function HomeHero() {
  const [selectedType, setSelectedType] = useState<string>("");
  const [variant, setVariant] = useState<"A" | "B">("A");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const resolvedVariant = getVariant(HERO_EXPERIMENT);
    setVariant(resolvedVariant);
    void trackEvent(HERO_EXPERIMENT, resolvedVariant, "view");
  }, []);

  const triggerDemo = (typeId: string) => {
    setSelectedType(typeId);
    void trackEvent(HERO_EXPERIMENT, variant, "demo_try");
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("rifd:prefill-demo", { detail: { productType: typeId } })
      );
      const target = document.getElementById("live-demo");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const handleCtaClick = () => {
    rememberAttribution(HERO_EXPERIMENT, variant);
    void trackEvent(HERO_EXPERIMENT, variant, "cta_click");
  };

  return (
    <section className="relative overflow-hidden gradient-hero">
      {/* تأثيرات بصرية أعمق */}
      <div className="pointer-events-none absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-gold/30 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-4 py-7 sm:py-14 lg:py-16">
        <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:flex-wrap">
          <SubscribersCounter variant="inline" />
          <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-xs font-bold text-gold-foreground">
            <Star className="h-3.5 w-3.5 fill-gold text-gold" />
            <Star className="h-3.5 w-3.5 fill-gold text-gold" />
            <Star className="h-3.5 w-3.5 fill-gold text-gold" />
            <Star className="h-3.5 w-3.5 fill-gold text-gold" />
            <Star className="h-3.5 w-3.5 fill-gold text-gold" />
            <span className="ms-1 font-extrabold">4.9</span>
          </span>
        </div>

        <h1
          className="mt-5 text-center text-[1.54rem] font-black leading-[1.14] tracking-tight sm:mt-6 sm:text-[2.75rem] sm:leading-[1.1] lg:text-[3.5rem] animate-fade-in"
          style={{ animationDelay: "60ms" }}
        >
          <span className="block text-[0.66em] font-bold text-muted-foreground sm:text-[0.42em]">
            {HERO_HOOKS[variant].eyebrow}
          </span>
          <span className="mt-2 block space-y-1 sm:space-y-0">
            <span className="block text-gradient-primary sm:inline">{HERO_HOOKS[variant].promiseLead}</span>
            <span className="block sm:ms-2 sm:inline">{HERO_HOOKS[variant].promiseEnd}</span>
          </span>
          <span className="mt-2.5 block text-[0.7em] font-bold leading-[1.42] text-foreground/90 sm:text-[0.56em]">
            <span>{HERO_HOOKS[variant].outputs[0]}</span>
            <span className="mx-1 inline-block align-middle font-light text-muted-foreground/60 sm:mx-2">+</span>
            <span className="text-gradient-gold">{HERO_HOOKS[variant].outputs[1]}</span>
            <span className="mx-1 inline-block align-middle font-light text-muted-foreground/60 sm:mx-2">+</span>
            <span>{HERO_HOOKS[variant].outputs[2]}</span>
          </span>
          <span className="mt-2 block text-[0.84em] leading-[1.18] sm:text-[0.9em]">
            لمتجرك في{" "}
            <span className="relative inline-block whitespace-nowrap">
              <span
                className="absolute inset-x-[-8px] bottom-[8%] -z-10 h-[44%] -rotate-1 rounded-md bg-gold/60"
                aria-hidden
              />
              <span className="relative">وقت قهوتك ☕</span>
            </span>
          </span>
        </h1>

        <div
          className="mx-auto mt-4.5 flex max-w-[18rem] items-center justify-center gap-2.5 text-sm font-bold sm:mt-5 sm:max-w-md sm:gap-3 sm:text-lg animate-fade-in"
          style={{ animationDelay: "180ms" }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1.5 text-destructive line-through decoration-2">
            5 ساعات
          </span>
          <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1.5 text-success">
            ✓ 5 دقائق
          </span>
        </div>

        <div
          className="mt-6 flex flex-col items-center gap-3 animate-fade-in"
          style={{ animationDelay: "260ms" }}
        >
          <Button
            asChild
            size="lg"
            className="h-14 w-full max-w-sm gap-2 gradient-gold text-base font-extrabold text-gold-foreground shadow-gold transition-transform hover:scale-[1.02] sm:w-auto sm:px-10"
          >
            <Link to="/onboarding" onClick={handleCtaClick}>
              <Sparkles className="h-5 w-5" />
              ابدأ مجاناً 5 توليدات
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="grid max-w-[18rem] grid-cols-1 gap-1 text-center text-[11px] font-medium text-muted-foreground sm:max-w-none sm:grid-cols-3 sm:gap-x-3 sm:gap-y-1">
            <span>✓ بدون بطاقة ائتمان</span>
            <span>✓ بداية سريعة خلال ثوانٍ</span>
            <span>✓ إلغاء بنقرة</span>
          </div>
        </div>

        <div
          className="mx-auto mt-7 max-w-xl rounded-2xl border-2 border-dashed border-primary/30 bg-card/70 p-3.5 backdrop-blur-sm sm:mt-8 sm:p-5 animate-fade-in"
          style={{ animationDelay: "340ms" }}
        >
          <div className="mb-3 flex items-center justify-center gap-2 text-center text-sm font-bold text-primary">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Wand2 className="h-3.5 w-3.5" />
            </span>
            أو جرّب بدون تسجيل — اختر متجرك:
          </div>

          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:justify-center">
            {QUICK_TYPES.map((q) => (
              <button
                key={q.id}
                onClick={() => triggerDemo(q.id)}
                className="rounded-full border-2 border-primary/30 bg-background px-4 py-2 text-sm font-bold text-foreground transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground sm:hover:scale-105"
              >
                {q.label}
              </button>
            ))}
            <select
              value={selectedType}
              onChange={(e) => e.target.value && triggerDemo(e.target.value)}
              className="w-full rounded-full border-2 border-primary/30 bg-background px-4 py-2 text-sm font-bold text-foreground transition-all hover:border-primary cursor-pointer sm:w-auto"
              aria-label="غير ذلك"
            >
              <option value="">غير ذلك ←</option>
              {PRODUCT_TYPES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          className="mx-auto mt-8 max-w-3xl animate-fade-in"
          style={{ animationDelay: "420ms" }}
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
            {HERO_BENEFITS.map((b) => (
              <div
                key={b.title}
                className="flex min-h-[84px] items-center gap-2.5 rounded-xl border border-border bg-card/80 p-3 backdrop-blur-sm sm:min-h-[unset] sm:gap-3"
              >
                <span className="text-xl sm:text-2xl">{b.icon}</span>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold leading-tight">{b.title}</div>
                  <div className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
                    {b.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
