import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { MarketingLayout } from "@/components/marketing-layout";

import { HomeHero } from "@/components/home-hero";
import { StickyMobileCta } from "@/components/sticky-mobile-cta";
import { BrandStrip } from "@/components/brand-strip";
import { BusinessSolutionsTeaser } from "@/components/business-solutions-teaser";
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
          "تعبت تكتب وتصمّم لمتجرك؟ رِفد يولّد لك منشورات وصور وحِزم حملات بالعامية السعودية بسرعة، مع 50+ قالب جاهز وتحديثات شهرية للمتاجر السعودية. جرّب مجاناً بدون بطاقة، وإذا كان احتياجك مؤسسياً فهناك مسار رِفد للأعمال.",
      },
      { property: "og:title", content: "رِفد — محتوى وصور لمتجرك السعودي في وقت قهوتك ☕" },
      {
        property: "og:description",
        content: "منشورات وصور احترافية بالعامية السعودية — وفّر ساعات من الكتابة والتصميم اليدوي.",
      },
      { property: "og:image", content: ogHomeImage },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "رِفد — حزمة محتوى وصور وحملات لمتجرك السعودي" },
      { name: "twitter:image", content: ogHomeImage },
      { name: "twitter:image:alt", content: "رِفد — حزمة محتوى وصور وحملات لمتجرك السعودي" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <MarketingLayout>
      <HomeHero />

      <HeroProofFilm />

      <BrandStrip />

      <SavingsCounter />

      <BeforeAfter />

      <HowItWorks />

      <ProofCenterPreview />

      <section className="border-t border-border bg-secondary/30 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold text-primary">مقارنة مباشرة</p>
            <h2 className="text-3xl font-extrabold sm:text-4xl">
              ليش رِفد <span className="text-gradient-gold">أنسب وأذكى</span> من ChatGPT لمتجرك؟
            </h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              نفس قوة الذكاء الاصطناعي العالمي + تخصيص كامل للسوق السعودي + سعر بالريال
            </p>
          </div>
          <div className="mx-auto mt-8 max-w-4xl">
            <ComparisonTable compact />
          </div>
        </div>
      </section>

      <VisionSection />

      <BusinessSolutionsTeaser />

      <HomeFeatures />

      <section className="border-t border-border bg-background py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-sm font-bold text-primary">جاهزة للاستخدام</p>
              <h2 className="text-3xl font-extrabold">مكتبة الأوامر</h2>
              <p className="mt-2 text-base leading-7 text-muted-foreground">
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

      <section id="final-cta" className="border-t border-border bg-background py-16 pb-24 sm:pb-16">
        <div className="mx-auto max-w-4xl rounded-3xl gradient-primary p-8 text-center text-primary-foreground shadow-elegant sm:p-12">
          <p className="text-sm font-bold text-primary-foreground/80">ابدأ بخطوة واحدة</p>
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            جاهز تحوّل متجرك إلى آلة محتوى؟
          </h2>
          <p className="mt-3 text-base leading-7 text-primary-foreground/90">
            ابدأ مجاناً اليوم — 5 توليدات نص + 2 صور بدون بطاقة ائتمان
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-primary-foreground/85 sm:text-sm">
            <span className="rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1">عامية سعودية جاهزة</span>
            <span className="rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1">نتيجة خلال ثوانٍ</span>
            <span className="rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1">بدون بطاقة ائتمان</span>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" variant="secondary" className="shadow-elegant">
              <Link to="/onboarding">ابدأ الآن مجاناً</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link to="/pricing">شوف الباقات</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs font-medium text-primary-foreground/75 sm:text-sm">
            وإذا كان احتياجك يتجاوز الاشتراك داخل المنتج إلى تشخيص وتنفيذ وتأهيل أوسع، فمسار <Link to="/business-solutions" className="font-extrabold underline underline-offset-4">رِفد للأعمال</Link> هو الخيار المؤسسي الصحيح.
          </p>
        </div>
      </section>

      <StickyMobileCta />
    </MarketingLayout>
  );
}
