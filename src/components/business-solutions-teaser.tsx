import { Link } from "@tanstack/react-router";
import { ArrowLeft, BriefcaseBusiness, Building2, ChartNoAxesCombined, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";

const pillars = [
  {
    icon: BriefcaseBusiness,
    title: "AI Content OS",
    description: "ذاكرة علامة، حملات، ومخرجات متعددة الجاهزية لفِرق المتجر أو الوكالة.",
  },
  {
    icon: Building2,
    title: "Commerce Build",
    description: "بناء أو تطوير متجر، صفحات هبوط، وتحسين التحويل لمسارات البيع الأساسية.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Growth System",
    description: "تشغيل حملات، تقاويم محتوى، ولوحات متابعة تدعم النمو المتكرر.",
  },
  {
    icon: Workflow,
    title: "Business Systems",
    description: "CRM، أتمتة، تطبيقات داخلية، وأنظمة خاصة مرتبطة بالذكاء الاصطناعي.",
  },
];

export function BusinessSolutionsTeaser() {
  return (
    <section className="border-t border-border bg-background py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-xs font-bold text-gold-foreground">
              <BriefcaseBusiness className="h-3.5 w-3.5 text-gold" />
              رِفد للأعمال (حلول التحول التجاري بالذكاء الاصطناعي)
            </div>
            <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
              للمتاجر الكبيرة والوكالات: <span className="text-gradient-gold">رِفد لا يقدّم محتوى فقط، بل يبني نظام تشغيل نمو.</span>
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              عندما تحتاج أكثر من توليد سريع، يتحول رِفد إلى طبقة تشغيل تشمل الذاكرة، الحملات، بناء المتجر، الأنظمة، وقنوات العمل المباشر.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="gradient-gold text-gold-foreground shadow-gold">
                <Link to="/business-solutions">
                  استكشف رِفد للأعمال
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <a href="https://wa.me/966582286215" target="_blank" rel="noreferrer noopener">
                  رد مباشر من المؤسس خلال دقائق
                </a>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {pillars.map((pillar) => (
              <article key={pillar.title} className="rounded-xl border border-border bg-card p-5 shadow-soft">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                  <pillar.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-sm font-extrabold">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{pillar.description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}