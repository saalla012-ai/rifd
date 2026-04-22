import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BarChart3, Blocks, BriefcaseBusiness, Building2, CheckCircle2, Compass, Workflow } from "lucide-react";
import { MarketingLayout } from "@/components/marketing-layout";
import { Button } from "@/components/ui/button";

const tracks = [
  {
    icon: BriefcaseBusiness,
    title: "AI Content OS",
    bullets: ["ذاكرة متقدمة متعددة السياقات", "تقويم محتوى وحملات", "مخرجات قابلة للمراجعة والاعتماد"],
  },
  {
    icon: Building2,
    title: "Commerce Build",
    bullets: ["بناء أو تطوير المتجر", "تحسين UX وصفحات المنتجات", "صفحات هبوط ورفع التحويل"],
  },
  {
    icon: BarChart3,
    title: "Growth & Marketing System",
    bullets: ["إدارة حملات موسمية", "تشغيل نمو وتقارير", "تنسيق قنوات المحتوى والإعلانات"],
  },
  {
    icon: Workflow,
    title: "Business Systems",
    bullets: ["CRM وأتمتة", "تطبيقات داخلية", "أنظمة مخصصة مرتبطة بالذكاء الاصطناعي"],
  },
];

const signals = [
  "أكثر من قناة محتوى أو إعلان تُدار يدوياً",
  "تكرار في كتابة الحملات من البداية كل مرة",
  "حاجة إلى مواءمة بين المحتوى، المتجر، والعمليات",
  "رغبة في شريك تنفيذي لا مجرد أداة SaaS",
];

const deliveryFlow = [
  {
    title: "تشخيص",
    description: "نفهم القنوات، الفريق، نقاط التعطل، وما الذي يجب أن يبنى أولاً لتحقيق أثر ربحي واضح.",
  },
  {
    title: "تصميم المسار",
    description: "نحوّل الاحتياج إلى مسار واضح: محتوى، تحويل، أنظمة، أو طبقة نمو تشغيلية متكاملة.",
  },
  {
    title: "تنفيذ منضبط",
    description: "ننفذ على مراحل قابلة للقياس مع مخرجات واضحة ومسؤوليات مفهومة ومؤشرات متابعة.",
  },
];

const fitCases = [
  "علامات لديها مواسم قوية وتحتاج Campaign Packs متكررة وسريعة.",
  "وكالات تريد طبقة محتوى وتحويل أكثر انضباطاً لعملائها.",
  "متاجر كبيرة تحتاج مواءمة بين UX، العروض، والتشغيل بالذكاء الاصطناعي.",
];

export const Route = createFileRoute("/business-solutions")({
  head: () => ({
    meta: [
      { title: "رِفد للأعمال — حلول التحول التجاري بالذكاء الاصطناعي" },
      {
        name: "description",
        content:
          "رِفد للأعمال يقدّم للمتاجر الكبيرة والوكالات طبقة تشغيل تشمل المحتوى، التحويل، الأنظمة، والعمليات المدعومة بالذكاء الاصطناعي.",
      },
      { property: "og:title", content: "رِفد للأعمال" },
      {
        property: "og:description",
        content: "خط أعمال مخصص للوكالات والمتاجر الكبيرة والشركات التي تريد تحولاً تجارياً عملياً بالذكاء الاصطناعي.",
      },
      { tagName: "link", rel: "canonical", href: "https://rifd.site/business-solutions" },
    ],
  }),
  component: BusinessSolutionsPage,
});

function BusinessSolutionsPage() {
  return (
    <MarketingLayout>
      <section className="gradient-hero border-b border-border py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-xs font-bold text-gold-foreground">
            <Blocks className="h-3.5 w-3.5 text-gold" />
            رِفد للأعمال (حلول التحول التجاري بالذكاء الاصطناعي)
          </div>
          <h1 className="mt-4 max-w-4xl text-4xl font-extrabold leading-tight sm:text-5xl">
            عندما يصبح المحتوى وحده غير كافٍ، <span className="text-gradient-gold">يتوسع رِفد ليصبح نظام تشغيل للنمو.</span>
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
            هذا المسار مخصص للوكالات، والعلامات متعددة المتاجر، والشركات التي تريد بنية تشغيل ومحتوى وأنظمة وواجهات متصلة بالذكاء الاصطناعي ضمن خدمة أكثر عمقاً وإشرافاً.
          </p>
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {signals.map((signal) => (
              <div key={signal} className="rounded-xl border border-border bg-card/70 px-4 py-4 text-sm text-muted-foreground shadow-soft backdrop-blur-sm">
                {signal}
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="gradient-gold text-gold-foreground shadow-gold">
              <a href="https://wa.me/966582286215?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85+%D8%B9%D9%84%D9%8A%D9%83%D9%85%D8%8C+%D8%A3%D8%B1%D9%8A%D8%AF+%D8%AA%D8%B4%D8%AE%D9%8A%D8%B5+%D8%A7%D8%AD%D8%AA%D9%8A%D8%A7%D8%AC+%D8%B1%D9%90%D9%81%D8%AF+%D9%84%D9%84%D8%A3%D8%B9%D9%85%D8%A7%D9%84" target="_blank" rel="noreferrer noopener">
                اطلب تشخيص احتياجك
                <ArrowLeft className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link to="/contact">تواصل معنا مباشرة</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-5 md:grid-cols-2">
            {tracks.map((track) => (
              <article key={track.title} className="rounded-2xl border border-border bg-card p-6 shadow-elegant">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-primary">
                  <track.icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-xl font-extrabold">{track.title}</h2>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  {track.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-2xl border border-gold/25 bg-card p-6 shadow-soft">
              <h2 className="text-xl font-extrabold">كيف نعمل معك؟</h2>
              <div className="mt-5 space-y-4">
                {deliveryFlow.map((step, index) => (
                  <div key={step.title} className="flex gap-3 rounded-xl border border-border bg-secondary/30 p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/15 text-sm font-extrabold text-gold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-bold">{step.title}</h3>
                      <p className="mt-1 text-sm leading-7 text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <Compass className="h-3.5 w-3.5" />
                متى يكون هذا المسار مناسباً؟
              </div>
              <div className="mt-5 grid gap-3">
                {fitCases.map((item) => (
                  <div key={item} className="rounded-xl border border-border bg-background px-4 py-4 text-sm text-muted-foreground">
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-xl border border-primary/15 bg-primary/5 p-4">
                <h3 className="font-bold">النتيجة المتوقعة</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  ليس مجرد محتوى أكثر، بل وضوح أعلى في الرسائل، سرعة أكبر في الإطلاقات، وتقليل للتشظي بين المتجر، الحملات، والعمليات التشغيلية.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-2xl gradient-primary p-8 text-primary-foreground shadow-elegant">
            <h2 className="text-2xl font-extrabold sm:text-3xl">هل تريد معرفة إن كان رِفد للأعمال مناسباً لك؟</h2>
            <p className="mt-3 max-w-3xl text-primary-foreground/90">
              أرسل لنا نبذة قصيرة عن متجرك، قنواتك الحالية، وما الذي يبطئ النمو عندك — وسنقترح عليك المسار الأنسب بوضوح وبدون مبالغة.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary">
                <a href="https://wa.me/966582286215?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85+%D8%B9%D9%84%D9%8A%D9%83%D9%85%D8%8C+%D8%A3%D8%B1%D9%8A%D8%AF+%D8%AA%D9%82%D9%8A%D9%8A%D9%85+%D9%85%D8%B3%D8%A7%D8%B1+%D8%B1%D9%90%D9%81%D8%AF+%D9%84%D9%84%D8%A3%D8%B9%D9%85%D8%A7%D9%84+%D9%84%D9%85%D8%AA%D8%AC%D8%B1%D9%8A" target="_blank" rel="noreferrer noopener">
                  ابدأ التقييم الآن
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Link to="/pricing">راجع الباقات الحالية أولاً</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
