import { Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarRange, GalleryVerticalEnd, MessageSquareQuote, ShoppingBag, Sparkles } from "lucide-react";
import { MarketingLayout } from "@/components/marketing-layout";
import { Button } from "@/components/ui/button";

type SectorPageProps = {
  title: string;
  shortTitle: string;
  description: string;
  heroLabel: string;
  painPoints: string[];
  proofExamples: string[];
  bestTemplates: string[];
  seasons: string[];
  weeklyOutputs: string[];
};

export function SectorPage({
  title,
  shortTitle,
  description,
  heroLabel,
  painPoints,
  proofExamples,
  bestTemplates,
  seasons,
  weeklyOutputs,
}: SectorPageProps) {
  return (
    <MarketingLayout>
      <section className="gradient-hero border-b border-border py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {heroLabel}
          </div>
          <h1 className="mt-4 max-w-4xl text-4xl font-extrabold leading-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">{description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="gradient-primary text-primary-foreground shadow-elegant">
              <Link to="/onboarding">
                ابدأ أول تجربة مجانية
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/proof-center">شاهد أمثلة الإثبات</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2 text-primary">
              <MessageSquareQuote className="h-5 w-5" />
              <h2 className="text-xl font-extrabold">مشاكل {shortTitle}</h2>
            </div>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-muted-foreground">
              {painPoints.map((item) => (
                <li key={item} className="rounded-lg bg-secondary/60 px-4 py-3">{item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2 text-primary">
              <GalleryVerticalEnd className="h-5 w-5" />
              <h2 className="text-xl font-extrabold">أمثلة مناسبة للقطاع</h2>
            </div>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-muted-foreground">
              {proofExamples.map((item) => (
                <li key={item} className="rounded-lg bg-secondary/60 px-4 py-3">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-secondary/30 py-16">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 lg:grid-cols-3">
          <article className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2 text-primary">
              <ShoppingBag className="h-5 w-5" />
              <h2 className="text-lg font-extrabold">أفضل القوالب</h2>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {bestTemplates.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </article>

          <article className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2 text-primary">
              <CalendarRange className="h-5 w-5" />
              <h2 className="text-lg font-extrabold">مواسم القطاع الأقوى</h2>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {seasons.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </article>

          <article className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <h2 className="text-lg font-extrabold">ماذا ينتج خلال أسبوع؟</h2>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {weeklyOutputs.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </MarketingLayout>
  );
}
