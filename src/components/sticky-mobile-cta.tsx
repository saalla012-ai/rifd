import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getVariant, rememberAttribution, trackEvent } from "@/lib/ab-test";

/**
 * Sticky CTA bar للموبايل فقط.
 * - يظهر بعد scroll 400px
 * - يختفي عند الوصول لـ#final-cta (تجنب تكرار CTA الختامي)
 */
export function StickyMobileCta() {
  const [visible, setVisible] = useState(false);
  const [variant, setVariant] = useState<"A" | "B">("A");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setVariant(getVariant("hero_hook"));

    const finalCta = document.getElementById("final-cta");

    const onScroll = () => {
      const scrolled = window.scrollY > 400;
      let nearFinal = false;
      if (finalCta) {
        const rect = finalCta.getBoundingClientRect();
        nearFinal = rect.top < window.innerHeight * 0.9;
      }
      setVisible(scrolled && !nearFinal);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-3 py-2.5 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md transition-transform duration-300 sm:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <Link
        to="/onboarding"
        onClick={() => {
          rememberAttribution("hero_hook", variant);
          void trackEvent("hero_hook", variant, "sticky_cta_click");
        }}
        className="flex items-center justify-center gap-2 rounded-xl gradient-gold px-4 py-3 text-sm font-extrabold text-gold-foreground shadow-gold"
      >
        <Sparkles className="h-4 w-4" />
        ابدأ مجاناً — بدون بطاقة
        <ArrowLeft className="h-4 w-4" />
      </Link>
    </div>
  );
}
