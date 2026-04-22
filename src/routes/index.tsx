import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { MarketingLayout } from "@/components/marketing-layout";

import { HomeHero } from "@/components/home-hero";
import { StickyMobileCta } from "@/components/sticky-mobile-cta";
import { BrandStrip } from "@/components/brand-strip";
import { BusinessSolutionsTeaser } from "@/components/business-solutions-teaser";
import { LiveAiDemo } from "@/components/live-ai-demo";
import { HeroProofFilm } from "@/components/hero-proof-film";
import { SavingsCounter } from "@/components/savings-counter";
import { BeforeAfter } from "@/components/before-after";
import { HowItWorks } from "@/components/how-it-works";
import { ComparisonTable } from "@/components/comparison-table";
import { VisionSection } from "@/components/vision-section";
import { HomeFeatures } from "@/components/home-features";
import { ProofCenterPreview } from "@/components/proof-center-preview";
import { Button } from "@/components/ui/button";
import { CATEGORIES, PROMPTS } from "@/lib/prompts-data";
import ogHomeImage from "@/assets/og-home.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "رِفد — محتوى وصور احترافية لمتجرك بالعامية السعودية" },
      {
        name: "description",
        content:
          "تعبت تكتب وتصمّم لمتجرك؟ رِفد يولّد لك منشورات وصور وحِزم حملات بالعامية السعودية بسرعة، مع 50+ قالب جاهز وتحديثات شهرية للمتاجر السعودية. جرّب مجاناً بدون بطاقة.",
      },
      { property: "og:title", content: "رِفد — محتوى وصور لمتجرك السعودي في وقت قهوتك ☕" },
      {
        property: "og:description",
        content: "منشورات وصور احترافية بالعامية السعودية — وفّر ساعات من الكتابة والتصميم اليدوي.",
      },
      { property: "og:image", content: ogHomeImage },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "رِفد — 30 منشور + 30 صورة لمتجرك السعودي في 5 دقائق" },
      { name: "twitter:image", content: ogHomeImage },
      { name: "twitter:image:alt", content: "رِفد — 30 منشور + 30 صورة لمتجرك السعودي في 5 دقائق" },
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

      <HeroProofFilm />

      {/* 5. أرقام حية حقيقية */}
      <SavingsCounter />

      {/* 6. قبل وبعد */}
      <BeforeAfter />

      {/* 7. كيف يعمل رِفد في 3 خطوات (بديل الشهادات المزيفة) */}
      <HowItWorks />

      <ProofCenterPreview />

      {/* 8. مقارنة مختصرة (مع إصلاح الموبايل) */}
      <section className="border-t border-border bg-secondary/30 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold sm:text-4xl">
              ليش رِفد <span className="text-gradient-gold">أنسب وأذكى</span> من ChatGPT لمتجرك؟
            </h2>
            <p className="mt-3 text-muted-foreground">
              نفس قوة الذكاء الاصطناعي العالمي + تخصيص كامل للسوق السعودي + سعر بالريال
            </p>
          </div>
          <div className="mt-8 mx-auto max-w-4xl">
            <ComparisonTable compact />
          </div>
        </div>
      </section>

      {/* 9. الروية */}
      <VisionSection />

      <BusinessSolutionsTeaser />

      {/* 10. الميزات (4 + accordion على الموبايل، 8 على الديسكتوب) */}
      <HomeFeatures />

      {/* 11. لمحة عن المكتبة */}
      <section className="border-t border-border bg-background py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold">مكتبة الأوامر</h2>
              <p className="mt-2 text-muted-foreground">
                50+ قالب مهندس بالعامية السعودية مع تطويرات وقوالب جديدة شهرياً.
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
