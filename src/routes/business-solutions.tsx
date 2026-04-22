import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Blocks, BriefcaseBusiness, Building2, CheckCircle2, Workflow } from "lucide-react";
import { MarketingLayout } from "@/components/marketing-layout";

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

          <div className="mt-8 rounded-2xl border border-gold/25 bg-card p-6 shadow-soft">
            <h2 className="text-xl font-extrabold">ما الذي يظهر بوضوح في هذا المسار؟</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                "White-glove onboarding",
                "قناة مباشرة مع الفريق",
                "Workspaces وRoles لاحقاً",
                "KPI dashboards ومسارات تشغيل متعددة",
              ].map((item) => (
                <div key={item} className="rounded-lg bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">{item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
