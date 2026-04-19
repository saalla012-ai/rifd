import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { MarketingLayout } from "@/components/marketing-layout";

import { HomeHero } from "@/components/home-hero";
import { BrandStrip } from "@/components/brand-strip";
import { LiveAiDemo } from "@/components/live-ai-demo";
import { SavingsCounter } from "@/components/savings-counter";
import { BeforeAfter } from "@/components/before-after";
import { HowItWorks } from "@/components/how-it-works";
import { ComparisonTable } from "@/components/comparison-table";
import { VisionSection } from "@/components/vision-section";
import { HomeFeatures } from "@/components/home-features";
import { Button } from "@/components/ui/button";
import { CATEGORIES, PROMPTS } from "@/lib/prompts-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "رِفد — اكتب 30 منشور لمتجرك في 5 دقائق بالعامية السعودية" },
      {
        name: "description",
        content:
          "تعبت تكتب منشورات متجرك؟ رِفد يكتب لك 30 منشور بالعامية السعودية في 5 دقائق بدل 5 ساعات. 40 قالب جاهز + توليد صور وبوسترات. جرّب مجاناً بدون بطاقة.",
      },
      { property: "og:title", content: "رِفد — آلة محتوى ذكية لمتجرك السعودي بالعامية" },
      {
        property: "og:description",
        content: "30 منشور في 5 دقائق بالعامية السعودية — بدل ما تقعد 5 ساعات. وفّر 800+ ر.س شهرياً.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <MarketingLayout>
      {/* Hero فوق الـfold (شارة حية + Hook + Mini Demo + CTA) */}
      <HomeHero />

      {/* 3. شريط متوافق مع — قانوني آمن */}
      <BrandStrip />

      {/* 4. Demo كامل (التجربة العميقة) */}
      <section className="border-t border-border bg-secondary/30 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-extrabold sm:text-3xl">
              التجربة الكاملة — <span className="text-gradient-primary">3 حقول فقط</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              خصّص أكثر، شاهد النتيجة الكاملة، وانسخها مباشرة
            </p>
          </div>
          <LiveAiDemo />
        </div>
      </section>

      {/* 5. أرقام حية حقيقية */}
      <SavingsCounter />

      {/* 6. قبل وبعد */}
      <BeforeAfter />

      {/* 7. كيف يعمل رِفد في 3 خطوات (بديل الشهادات المزيفة) */}
      <HowItWorks />

      {/* 8. مقارنة مختصرة (مع إصلاح الموبايل) */}
      <section className="border-t border-border bg-secondary/30 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold sm:text-4xl">
              ليش رِفد <span className="text-gradient-gold">أرخص وأذكى</span> من ChatGPT؟
            </h2>
            <p className="mt-3 text-muted-foreground">
              نفس قوة الذكاء الاصطناعي العالمي + تخصيص كامل للسوق السعودي + أرخص بـ70%
            </p>
          </div>
          <div className="mt-8 mx-auto max-w-4xl">
            <ComparisonTable compact />
          </div>
        </div>
      </section>

      {/* 9. الروية */}
      <VisionSection />

      {/* 10. الميزات (4 + accordion على الموبايل، 8 على الديسكتوب) */}
      <HomeFeatures />

      {/* 11. لمحة عن المكتبة */}
      <section className="border-t border-border bg-background py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold">مكتبة الأوامر</h2>
              <p className="mt-2 text-muted-foreground">
                {PROMPTS.length} قالب مهندس بالعامية — اختر، خصّص، ولّد.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/library">
                تصفّح المكتبة كاملة
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {CATEGORIES.map((c) => {
              const count = PROMPTS.filter((p) => p.category === c.id).length;
              if (count === 0) return null; // لا نعرض فئات فارغة (ثقة)
              return (
                <Link
                  key={c.id}
                  to="/library"
                  className="rounded-xl border border-border bg-card p-4 text-center transition-all hover:border-primary/40 hover:shadow-soft"
                >
                  <div className="text-3xl">{c.emoji}</div>
                  <div className="mt-2 text-sm font-bold">{c.label}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{count} قالب</div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 12. CTA الختامي */}
      <section id="final-cta" className="border-t border-border bg-background py-16 pb-24 sm:pb-16">
        <div className="mx-auto max-w-4xl rounded-3xl gradient-primary p-8 text-center text-primary-foreground shadow-elegant sm:p-12">
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            جاهز تحوّل متجرك إلى آلة محتوى؟
          </h2>
          <p className="mt-3 text-primary-foreground/90">
            ابدأ مجاناً اليوم — 5 توليدات نص + 2 صور بدون بطاقة ائتمان
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" variant="secondary" className="shadow-elegant">
              <Link to="/onboarding">ابدأ الآن مجاناً</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link to="/pricing">شوف الباقات</Link>
            </Button>
          </div>
        </div>
      </section>

      <StickyMobileCta />
    </MarketingLayout>
  );
}
