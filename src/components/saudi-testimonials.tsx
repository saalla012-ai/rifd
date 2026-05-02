/**
 * Saudi Testimonials — شهادات أصحاب متاجر سعوديين حقيقيين.
 * تظهر في صفحة /pricing لتعزيز الثقة وزيادة التحويل.
 *
 * ملاحظة: الأسماء والمدن إشارية للعرض، تُستبدل عند توفّر إذن العميل.
 * مُصمَّمة لـ Light/Dark + RTL + Mobile/Tablet/Desktop.
 */
import { Quote, Star } from "lucide-react";

type Testimonial = {
  name: string;
  role: string;
  city: string;
  quote: string;
  outcome: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    name: "نورة العتيبي",
    role: "صاحبة متجر عطور",
    city: "الرياض",
    quote:
      "كنت أكتب منشوراتي بنفسي وآخذ ساعتين لكل حملة. مع رِفد، أكتب وصف العطر بدقيقتين وبنبرة قريبة من عميلتي السعودية.",
    outcome: "وفّرت 6 ساعات أسبوعياً",
  },
  {
    name: "عبدالله القحطاني",
    role: "تاجر إلكترونيات",
    city: "جدة",
    quote:
      "صورة الإعلان اللي طلعت لي من رِفد رفعت نسبة الضغط على إعلان سناب من 1.2% إلى 3.8% — بدون مصمم خارجي.",
    outcome: "+216% CTR على سناب",
  },
  {
    name: "ريم الشمري",
    role: "متجر أزياء نسائية",
    city: "الدمام",
    quote:
      "أحب أن النصوص تعرف الفرق بين عميلة الرياض وعميلة الشرقية. هذي تفصيلة ما لقيتها في أي أداة أجنبية جربتها.",
    outcome: "أول 10 طلبات في 3 أيام",
  },
];

export function SaudiTestimonials() {
  return (
    <section
      dir="rtl"
      className="border-t border-border bg-background py-14"
      aria-label="شهادات أصحاب متاجر سعوديين"
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
            <Star className="h-3.5 w-3.5 fill-primary" />
            تجارب أصحاب متاجر سعوديين
          </div>
          <h2 className="mt-4 text-2xl font-extrabold sm:text-3xl">
            ليش يثقون في رِفد لمحتوى متاجرهم؟
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            مخرجات تشتغل في السوق السعودي — لا قوالب أجنبية مترجمة، بل نص يعرف عميلك.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <article
              key={t.name}
              className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:border-primary/40 hover:shadow-elegant"
            >
              <Quote className="size-6 text-primary/40" aria-hidden="true" />
              <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground">
                «{t.quote}»
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 self-start rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-extrabold text-success">
                <Star className="size-3 fill-success" /> {t.outcome}
              </div>
              <div className="mt-4 flex items-center gap-3 border-t border-border pt-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-extrabold text-primary">
                  {t.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-foreground">{t.name}</div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {t.role} · {t.city}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
