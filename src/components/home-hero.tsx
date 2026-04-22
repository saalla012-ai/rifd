import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles, Star, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubscribersCounter } from "./subscribers-counter";
import { PRODUCT_TYPES } from "@/lib/demo-results";
import { trackEvent } from "@/lib/ab-test";
import heroPhotoThumb from "@/assets/hero-photo-thumb.png";

const EXPERIMENT = "hero_hook";

/**
 * Hero v2 — موبايل-أولاً، بيعي 10/10
 * - Proof bar موحّد (نجوم + رقم مشتركين)
 * - H1 سطرين قويّين + highlight ذهبي خلف "وقت قهوتك"
 * - مقارنة بصرية ✕/✓ بدل النص الطويل
 * - 4 chips benefits ظاهرة (لا details)
 * - CTA الأساسي ذهبي primary، Demo Teaser outline ثانوي
 * - 3 chips سريعة لأنواع المتاجر (one-tap demo)
 */
export function HomeHero() {
  const [selectedType, setSelectedType] = useState<string>("");

  useEffect(() => {
    void trackEvent(EXPERIMENT, "B", "view");
  }, []);

  const triggerDemo = (typeId: string) => {
    setSelectedType(typeId);
    void trackEvent(EXPERIMENT, "B", "demo_try");
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
    void trackEvent(EXPERIMENT, "B", "cta_click");
  };

  // 3 أكثر أنواع المتاجر شيوعًا للـone-tap demo
  const QUICK_TYPES = [
    { id: "perfumes", label: "🌸 عطور" },
    { id: "fashion", label: "👗 أزياء" },
    { id: "food", label: "🍫 شوكولاتة" },
  ];

  return (
    <section className="relative overflow-hidden gradient-hero">
      {/* تأثيرات بصرية أعمق */}
      <div className="pointer-events-none absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-gold/30 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-4 py-8 sm:py-14 lg:py-16">
        {/* Proof bar موحّد: نجوم + مشتركين */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-xs font-bold text-gold-foreground">
            <Star className="h-3.5 w-3.5 fill-gold text-gold" />
            <Star className="h-3.5 w-3.5 fill-gold text-gold" />
            <Star className="h-3.5 w-3.5 fill-gold text-gold" />
            <Star className="h-3.5 w-3.5 fill-gold text-gold" />
            <Star className="h-3.5 w-3.5 fill-gold text-gold" />
            <span className="ms-1 font-extrabold">4.9</span>
          </span>
          <SubscribersCounter variant="inline" />
        </div>

        {/* H1 — منطق V8: Brief واحد ← حزمة حملة أولية */}
        <h1
          className="mt-6 text-center text-[1.75rem] font-black leading-[1.15] tracking-tight sm:text-[2.75rem] sm:leading-[1.1] lg:text-[3.5rem] animate-fade-in"
          style={{ animationDelay: "60ms" }}
        >
          <span className="block">
            <span className="whitespace-nowrap">
              Brief واحد يطلع لك
            </span>
            <span className="mx-1.5 inline-block align-middle text-muted-foreground/60 font-light sm:mx-2">+</span>
            <span className="whitespace-nowrap">
              <span className="font-black text-gradient-primary">منشور</span>
            </span>
            <span className="mx-1.5 inline-block align-middle text-muted-foreground/60 font-light sm:mx-2">+</span>
            <span className="whitespace-nowrap">
              <span className="font-black text-gradient-gold">صورة</span>
              <img
                src={heroPhotoThumb}
                alt=""
                aria-hidden
                width={96}
                height={96}
                className="ms-1.5 inline-block h-[0.8em] w-[0.8em] -translate-y-[0.06em] object-contain align-baseline drop-shadow-[0_3px_8px_rgba(212,175,55,0.55)] sm:ms-2 sm:h-[0.85em] sm:w-[0.85em]"
              />
            </span>
            <span className="mx-1.5 inline-block align-middle text-muted-foreground/60 font-light sm:mx-2">+</span>
            <span className="whitespace-nowrap font-black text-gradient-primary">فكرة Reel</span>
          </span>
          <span className="mt-1 block text-[0.92em] sm:text-[0.9em]">
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

        {/* مقارنة بصرية ✕/✓ */}
        <div
          className="mx-auto mt-5 flex max-w-md items-center justify-center gap-3 text-base font-bold sm:text-lg animate-fade-in"
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

        {/* CTA الأساسي — ذهبي primary action */}
        <div
          className="mt-7 flex flex-col items-center gap-3 animate-fade-in"
          style={{ animationDelay: "260ms" }}
        >
          <Button
            asChild
            size="lg"
            className="h-14 w-full max-w-sm gap-2 gradient-gold text-base font-extrabold text-gold-foreground shadow-gold transition-transform hover:scale-[1.02] sm:w-auto sm:px-10"
          >
            <Link to="/onboarding" onClick={handleCtaClick}>
              <Sparkles className="h-5 w-5" />
              ابدأ مجاناً — 5 توليدات
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-medium text-muted-foreground">
            <span>✓ بدون بطاقة ائتمان</span>
            <span className="opacity-50">·</span>
            <span>✓ بداية Success Pack خلال ثوانٍ</span>
            <span className="opacity-50">·</span>
            <span>✓ إلغاء بنقرة</span>
          </div>
        </div>

        {/* Mini Demo — secondary outline + 3 chips للوصول الأسرع */}
        <div
          className="mx-auto mt-8 max-w-xl rounded-2xl border-2 border-dashed border-primary/30 bg-card/60 p-4 backdrop-blur-sm sm:p-5 animate-fade-in"
          style={{ animationDelay: "340ms" }}
        >
          <div className="mb-3 flex items-center justify-center gap-2 text-sm font-bold text-primary">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
              <Wand2 className="h-3.5 w-3.5" />
            </span>
            أو جرّب بدون تسجيل — اختر متجرك:
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {QUICK_TYPES.map((q) => (
              <button
                key={q.id}
                onClick={() => triggerDemo(q.id)}
                className="rounded-full border-2 border-primary/30 bg-background px-4 py-2 text-sm font-bold text-foreground transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground hover:scale-105"
              >
                {q.label}
              </button>
            ))}
            <select
              value={selectedType}
              onChange={(e) => e.target.value && triggerDemo(e.target.value)}
              className="rounded-full border-2 border-primary/30 bg-background px-4 py-2 text-sm font-bold text-foreground transition-all hover:border-primary cursor-pointer"
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

        {/* 4 benefits chips — أفقية scroll على الموبايل، grid على الديسكتوب */}
        <div
          className="mx-auto mt-8 max-w-3xl animate-fade-in"
          style={{ animationDelay: "420ms" }}
        >
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
            {[
              { icon: "🇸🇦", title: "عامية أصيلة", sub: "ما تحس إنه مترجم" },
              { icon: "📦", title: "حزمة أولية", sub: "منشور + صورة + Reel" },
              { icon: "⚡", title: "ثوانٍ معدودة", sub: "نتيجة أقرب للتنفيذ" },
              { icon: "🧠", title: "ذاكرة متجر", sub: "كل مرة أذكى من قبل" },
            ].map((b) => (
              <div
                key={b.title}
                className="flex min-w-[160px] shrink-0 items-center gap-3 rounded-xl border border-border bg-card/80 p-3 backdrop-blur-sm sm:min-w-0"
              >
                <span className="text-2xl">{b.icon}</span>
                <div>
                  <div className="text-sm font-extrabold leading-tight">{b.title}</div>
                  <div className="text-[11px] text-muted-foreground leading-tight">
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
