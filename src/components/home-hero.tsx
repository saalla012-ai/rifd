import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubscribersCounter } from "./subscribers-counter";
import { getVariant, rememberAttribution, trackEvent } from "@/lib/ab-test";
import { HERO_BENEFITS, HERO_EXPERIMENT, HERO_HOOKS } from "./home-hero-content";

/**
 * Hero الصفحة الرئيسية — نسخة أنظف مع فصل المحتوى الثابت عن منطق العرض.
 */
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
      {/* تأثيرات بصرية أعمق */}
      <div className="pointer-events-none absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-gold/30 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-4 py-8 sm:py-14 lg:py-16">
        <div className="flex flex-col items-center justify-center gap-2.5 sm:flex-row sm:flex-wrap">
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
          className="mt-4 text-center text-[1.48rem] font-black leading-[1.14] tracking-tight sm:mt-6 sm:text-[2.75rem] sm:leading-[1.1] lg:text-[3.5rem] animate-fade-in"
          style={{ animationDelay: "60ms" }}
        >
          <span className="block text-[0.66em] font-bold text-muted-foreground sm:text-[0.42em]">
            {HERO_HOOKS[variant].eyebrow}
          </span>
          <span className="mt-2 block space-y-1.5 sm:space-y-0">
            <span className="block text-gradient-primary sm:inline">{HERO_HOOKS[variant].promiseLead}</span>
            <span className="block sm:ms-2 sm:inline">{HERO_HOOKS[variant].promiseEnd}</span>
          </span>
          <span className="mt-2 block text-[0.66em] font-bold leading-[1.36] text-foreground/90 sm:text-[0.56em]">
            <span>{HERO_HOOKS[variant].outputs[0]}</span>
            <span className="mx-1 inline-block align-middle font-light text-muted-foreground/60 sm:mx-2">+</span>
            <span className="text-gradient-gold">{HERO_HOOKS[variant].outputs[1]}</span>
            <span className="mx-1 inline-block align-middle font-light text-muted-foreground/60 sm:mx-2">+</span>
            <span>{HERO_HOOKS[variant].outputs[2]}</span>
          </span>
          <span className="mt-2 block text-[0.8em] leading-[1.16] sm:text-[0.9em]">
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
          className="mx-auto mt-5 flex max-w-[17rem] items-center justify-center gap-2 text-sm font-bold sm:mt-5 sm:max-w-md sm:gap-3 sm:text-lg animate-fade-in"
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
          className="mt-7 flex flex-col items-center gap-4 animate-fade-in"
          style={{ animationDelay: "260ms" }}
        >
          <Button
            asChild
            size="lg"
            className="h-14 w-full max-w-[18rem] gap-2 gradient-gold text-base font-extrabold text-gold-foreground shadow-gold transition-transform hover:scale-[1.02] sm:w-auto sm:px-8 lg:px-10"
          >
            <Link to="/onboarding" onClick={handleCtaClick}>
              <Sparkles className="h-5 w-5" />
              ابدأ مجاناً 5 توليدات
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="grid max-w-[17rem] grid-cols-1 gap-1 text-center text-[10px] font-medium text-muted-foreground sm:max-w-none sm:grid-cols-3 sm:gap-x-3 sm:gap-y-1.5 sm:text-[11px]">
            <span>✓ بدون بطاقة ائتمان</span>
            <span>✓ بداية سريعة خلال ثوانٍ</span>
            <span>✓ إلغاء بنقرة</span>
          </div>
        </div>

        <div
          className="mx-auto mt-9 max-w-3xl animate-fade-in"
          style={{ animationDelay: "420ms" }}
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
            {HERO_BENEFITS.map((b) => (
              <div
                key={b.title}
                className="grid min-h-[96px] grid-cols-[auto,1fr] items-start gap-2 rounded-xl border border-border bg-card/80 p-3 backdrop-blur-sm sm:min-h-[unset] sm:gap-3"
              >
                <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center text-xl sm:h-auto sm:w-auto sm:text-2xl">
                  {b.icon}
                </span>
                <div className="min-w-0 self-stretch">
                  <div className="text-sm font-extrabold leading-[1.2]">{b.title}</div>
                  <div className="mt-1 text-[11px] leading-[1.35] text-muted-foreground">
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
