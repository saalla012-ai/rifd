import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Quote, Star } from "lucide-react";
import { MarketingLayout } from "@/components/marketing-layout";
import { TrustBar } from "@/components/trust-bar";
import { HomeHero } from "@/components/home-hero";
import { HomeFeatures } from "@/components/home-features";
import { ComparisonTable } from "@/components/comparison-table";
import { Button } from "@/components/ui/button";
import { CATEGORIES, PROMPTS } from "@/lib/prompts-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "رِفد للتقنية — منصة سعودية لتوليد محتوى المتاجر بالذكاء الاصطناعي" },
      {
        name: "description",
        content:
          "40 قالب AI جاهز بالعامية السعودية — منشورات، أوصاف منتجات، إعلانات وبوسترات في 10 ثواني. جرّب مجاناً بدون بطاقة.",
      },
      { property: "og:title", content: "رِفد للتقنية — آلة محتوى ذكية لمتجرك السعودي" },
      {
        property: "og:description",
        content: "حوّل متجرك إلى آلة محتوى. ChatGPT و Gemini مدرّبين بالعامية السعودية.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <MarketingLayout>
      <TrustBar />
      <HomeHero />
      <HomeFeatures />

      {/* مقارنة مختصرة */}
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

      {/* لمحة عن المكتبة */}
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

      {/* شهادات (مبدئية بإطار "ما هي حقيقية بعد") */}
      <section className="border-t border-border bg-secondary/30 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold">آراء المختبرين الأوائل</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              بعض الانطباعات من جلسات تجربة المنتج الأخيرة
            </p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              {
                quote: "كنت أستخدم ChatGPT وكان يعطيني فصحى مكسّرة. مع رِفد، النصوص جايّة بنبرتي العامية مباشرة.",
                author: "أم عبدالعزيز",
                role: "متجر عبايات",
              },
              {
                quote: "وفّرت 800 ر.س شهرياً كنت أدفعها لمصمم. البوسترات بالعربي طلعت أحلى من اللي كنت أطلبها.",
                author: "محمد ال.",
                role: "متجر عطور",
              },
              {
                quote: "الذاكرة الذكية للمتجر غيّرت اللعبة — كل توليدة تجي مخصصة بدون ما أعيد كتابة التفاصيل.",
                author: "نورة س.",
                role: "متجر إكسسوارات",
              },
            ].map((t) => (
              <figure key={t.author} className="rounded-xl border border-border bg-card p-5 shadow-soft">
                <Quote className="h-6 w-6 text-primary/40" />
                <blockquote className="mt-3 text-sm leading-relaxed">{t.quote}</blockquote>
                <figcaption className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <div>
                    <div className="text-sm font-bold">{t.author}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                  <div className="flex gap-0.5 text-gold">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA الختامي */}
      <section className="border-t border-border bg-background py-16">
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
    </MarketingLayout>
  );
}
