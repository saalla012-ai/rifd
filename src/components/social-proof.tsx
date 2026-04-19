import { Star, BadgeCheck, Quote, Lock, MapPin, X } from "lucide-react";

/**
 * SocialProof — شهادة موثقة (placeholder حالياً) + شارات أمان.
 * تُعرض بعد BrandStrip لتعزيز الثقة قبل الانتقال للـDemo الكامل.
 *
 * ملاحظة: تظهر شارة واضحة "نموذج توضيحي" حتى لا يضلل المستخدم.
 * ستُستبدل بشهادة حقيقية + صورة عميل عند توفرها.
 */
export function SocialProof() {
  return (
    <section className="border-b border-border/60 bg-background py-10 sm:py-14">
      <div className="mx-auto max-w-5xl px-4">
        <div className="grid gap-5 sm:grid-cols-[1.5fr_1fr] sm:gap-6">
          {/* الشهادة */}
          <article className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:shadow-elegant sm:p-7">
            {/* شارة placeholder شفافة لكن مرئية */}
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning">
              نموذج توضيحي
            </span>

            <Quote className="absolute -left-2 -top-2 h-20 w-20 text-primary/5 sm:h-24 sm:w-24" />

            <div className="relative">
              <div className="flex items-center gap-1 text-gold">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-gold" />
                ))}
                <span className="ms-1 text-xs font-extrabold text-foreground">5.0</span>
              </div>

              <p className="mt-3 text-base font-bold leading-relaxed text-foreground sm:text-lg">
                &ldquo;كنت أقعد ساعتين أكتب منشور وحد لمتجر العود — رِفد سوّاها لي
                في دقيقة واحدة بنفس الإحساس السعودي.&rdquo;
              </p>

              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-base font-extrabold text-primary-foreground shadow-elegant">
                  س.أ
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-extrabold">
                    سارة الأحمدي
                    <BadgeCheck className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    صاحبة متجر عود · الرياض
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* شارات أمان وثقة */}
          <aside className="grid grid-cols-1 gap-3">
            {[
              {
                icon: Lock,
                title: "بياناتك مشفّرة",
                sub: "ولا تُشارك مع أي طرف ثالث",
                color: "text-success bg-success/10",
              },
              {
                icon: MapPin,
                title: "صُنع في السعودية 🇸🇦",
                sub: "فريق سعودي يفهم لهجتك",
                color: "text-gold bg-gold/15",
              },
              {
                icon: X,
                title: "إلغاء بنقرة",
                sub: "بدون رسوم أو أسئلة",
                color: "text-destructive bg-destructive/10",
              },
            ].map((b) => (
              <div
                key={b.title}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-soft transition-all hover:shadow-elegant sm:p-4"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${b.color}`}>
                  <b.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold leading-tight">{b.title}</div>
                  <div className="text-[11px] text-muted-foreground leading-tight">
                    {b.sub}
                  </div>
                </div>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </section>
  );
}
