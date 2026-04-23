import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, Briefcase, Clapperboard, Clock3, Images, MessageSquareQuote, ShieldCheck, Sparkles, Store } from "lucide-react";
import { MarketingLayout } from "@/components/marketing-layout";
import { Button } from "@/components/ui/button";

const layers = [
  {
    title: "قبل / بعد",
    description: "كيف يتحول طلب بسيط إلى محتوى بيع وصياغة أقرب لواقع المتجر السعودي.",
  },
  {
    title: "أمثلة قطاعية",
    description: "عطور، أزياء، هدايا، وإلكترونيات بأمثلة مخصصة بدل ادعاءات عامة.",
  },
  {
    title: "حزم حملة كاملة",
    description: "منشور + هوك + صورة + Reel concept + CTA ضمن منطق حملة واحد.",
  },
  {
    title: "اعتراضات وردود",
    description: "هل العامية مناسبة؟ هل يصلح للوكالات؟ هل الناتج جاهز للنشر؟ كلها تُجاب عملياً.",
  },
  {
    title: "نتائج تشغيلية",
    description: "وقت أقل، كثافة إنتاج أعلى، ووضوح أكبر في دورة المحتوى الأسبوعية.",
  },
];

const beforeAfter = [
  {
    title: "قبل: طلب عام ومشتت",
    items: [
      "أبغى بوست عن عرض جديد للعطور.",
      "أحتاج صورة مناسبة لكن ما أعرف الاتجاه.",
      "ودي بريل قصير بس ما عندي زاوية واضحة.",
    ],
  },
  {
    title: "بعد: حزمة تشغيل أولية",
    items: [
      "منشور رئيسي بنبرة راقية يركز على الثبات والانطباع.",
      "3 هوكات بديلة + CTA منخفض الاحتكاك + هاشتاقات مناسبة.",
      "اتجاه صورة واضح + Reel concept بثلاث لقطات قابلة للتنفيذ.",
    ],
  },
];

const sectorCases = [
  {
    title: "العطور والجمال",
    description: "رسائل توازن بين الفخامة والبيع، مع إبراز الإحساس والثبات والانطباع الأول.",
    href: "/for-perfumes-beauty",
    icon: Sparkles,
  },
  {
    title: "الأزياء والعبايات",
    description: "محتوى يرفع قيمة القطعة ويبرر الشراء بالهوية والتنسيق والمناسبة، لا بالخصم فقط.",
    href: "/for-abayas-fashion",
    icon: Store,
  },
  {
    title: "الهدايا والحلويات والقهوة",
    description: "زوايا جاهزة للموسم والإهداء والعروض السريعة مع CTA أوضح للحجز والطلب.",
    href: "/for-gifts-sweets-coffee",
    icon: Briefcase,
  },
];

const objections = [
  {
    title: "هل الناتج مجرد نص عام؟",
    answer: "لا. المعروض هنا يثبت أن المخرجات تُبنى كحزمة: منشور، هوكات، CTA، صورة، وفكرة Reel ضمن منطق بيع واحد.",
    next: "ابدأ بـ قبل/بعد ثم قارن ذلك بما ستحصل عليه في التجربة المجانية.",
  },
  {
    title: "هل يصلح فعلاً للسوق السعودي؟",
    answer: "نعم، لأن الأمثلة مبنية على عامية محلية وسياقات شراء فعلية لقطاعات سعودية محددة، لا ترجمة حرفية لنسخ أجنبية.",
    next: "انتقل إلى الصفحة القطاعية الأقرب لمتجرك لترى الصياغة المناسبة فعلاً لنفس السوق.",
  },
  {
    title: "هل يوفّر وقتاً حقيقياً؟",
    answer: "نعم، لأنه يختصر جلسة التفكير والكتابة والتوجيه البصري في مخرج أولي متماسك أسرع بكثير من البدء من الصفر.",
    next: "انظر إلى النتائج التشغيلية بالأسفل لتفهم أين يُختصر الوقت فعلياً داخل أسبوع المحتوى.",
  },
  {
    title: "هل يناسب الفرق والوكالات؟",
    answer: "نعم، وهذا هو الجسر الطبيعي نحو رِفد للأعمال حيث تتوسع الحزم إلى تشغيل مؤسسي ومسارات أكثر عمقاً.",
    next: "إذا كنت تعمل لفريق أو عدة متاجر، انتقل بعدها إلى رِفد للأعمال بدلاً من التجربة الفردية فقط.",
  },
];

const operationalOutcomes = [
  {
    title: "قبل جلسة الكتابة",
    description: "بدل البدء من صفحة فارغة، تبدأ من زاوية بيع واضحة مبنية على القطاع والجمهور والنبرة.",
  },
  {
    title: "أثناء تجهيز الحملة",
    description: "تتحرك من المنشور إلى الصورة والـ Reel والـ CTA بنفس المنطق، لا كمهام منفصلة متضاربة.",
  },
  {
    title: "بعد أول نشر",
    description: "يصبح التكرار أسهل لأنك تطور زاوية ثبتت، لا لأنك تعيد اختراع المحتوى كل مرة من الصفر.",
  },
];

const decisionPaths = [
  {
    title: "عندي متجر وأريد إثباتاً سريعاً",
    description: "ابدأ بالتجربة المجانية ثم ارجع إلى هذه الصفحة إذا أردت مقارنة النتيجة بما رأيته هنا.",
    href: "/onboarding",
    label: "ابدأ التجربة المجانية",
  },
  {
    title: "أريد مثالاً أقرب لقطاعي",
    description: "اختر الصفحة القطاعية الأقرب لتعرف كيف تتغير الرسالة والاعتراضات من سوق إلى آخر.",
    href: "/for-perfumes-beauty",
    label: "شاهد مثالاً قطاعياً",
  },
  {
    title: "أقارن قبل قرار الاشتراك",
    description: "راجع الباقات بعد فهم الإثبات حتى يكون قرارك مبنياً على قيمة واضحة لا على السعر وحده.",
    href: "/pricing",
    label: "قارن الباقات",
  },
];

export const Route = createFileRoute("/proof-center")({
  head: () => ({
    meta: [
      { title: "Proof Center — أمثلة وإثباتات رِفد للمتاجر السعودية" },
      {
        name: "description",
        content:
          "استكشف مركز الإثبات في رِفد: قبل/بعد، أمثلة قطاعية، وحزم حملات كاملة توضّح كيف يخدم المتاجر السعودية عملياً.",
      },
      { property: "og:title", content: "Proof Center — أمثلة حية من رِفد" },
      {
        property: "og:description",
        content: "إثبات عملي يناسب قطاعك: محتوى، صور، وأفكار حملات جاهزة للتشغيل.",
      },
    ],
    links: [{ rel: "canonical", href: "https://rifd.site/proof-center" }],
  }),
  component: ProofCenterPage,
});

function ProofCenterPage() {
  return (
    <MarketingLayout>
      <section className="gradient-hero border-b border-border py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
            <BadgeCheck className="h-3.5 w-3.5" />
            مركز الإثبات المعتمد في V8
          </div>
          <h1 className="mt-4 max-w-4xl text-4xl font-extrabold leading-tight sm:text-5xl">
            لا نكتفي بقول إن رِفد مناسب للسوق السعودي — <span className="text-gradient-primary">نثبت ذلك بالأمثلة.</span>
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
            هنا يرى الزائر كيف يتحول البرومبت البسيط إلى مخرجات صالحة للنشر، وكيف تختلف النتيجة بحسب القطاع والموسم والنبرة والهدف البيعي.
          </p>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {layers.map((layer) => (
              <article key={layer.title} className="rounded-xl border border-border bg-card p-5 shadow-soft">
                <h2 className="text-base font-extrabold">{layer.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{layer.description}</p>
              </article>
            ))}
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {beforeAfter.map((column, index) => (
              <article
                key={column.title}
                className={`rounded-2xl border p-6 shadow-elegant ${
                  index === 0 ? "border-border bg-card" : "border-primary/20 bg-secondary/35"
                }`}
              >
                <div className="flex items-center gap-2 text-primary">
                  <MessageSquareQuote className="h-5 w-5" />
                  <h2 className="text-xl font-extrabold">{column.title}</h2>
                </div>
                <ul className="mt-5 space-y-3 text-sm leading-7 text-muted-foreground">
                  {column.items.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-primary/15 bg-primary/5 p-6 shadow-soft">
            <h2 className="text-xl font-extrabold">ماذا يثبت هذا القسم فعلياً؟</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground">
              يثبت أن الفرق ليس في تحسين الكلمات فقط، بل في نقل المتجر من طلب مبعثر إلى نقطة انطلاق قابلة للنشر: رسالة أوضح، زاوية بيع واحدة، واقتراحات بصرية مرتبطة بنفس الهدف.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-secondary/30 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-extrabold sm:text-4xl">
              إثبات حسب <span className="text-gradient-primary">القطاع</span> لا بنسخة عامة واحدة
            </h2>
            <p className="mt-3 text-muted-foreground">
              كل قطاع يشتري بطريقة مختلفة، لذلك يجب أن يَظهر الإثبات بنفس منطق السوق الذي يخاطبه.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {sectorCases.map((item) => (
              <article key={item.title} className="rounded-xl border border-border bg-card p-5 shadow-soft">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-extrabold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                <Button asChild variant="outline" className="mt-4 w-full">
                  <Link to={item.href as never}>شاهد المثال القطاعي</Link>
                </Button>
              </article>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Images, title: "هل يعطيني شيئاً جاهزاً؟", text: "نعم، لأن المخرج ليس مجرد فكرة، بل صياغة قابلة للاستخدام مع اقتراح بصري واضح." },
              { icon: Clock3, title: "هل يوفّر وقتاً فعلاً؟", text: "نعم، عبر حزمة محتوى أسبوعية بدل جلسات كتابة متفرقة تستهلك ساعات التشغيل." },
              { icon: ShieldCheck, title: "هل يناسب فريق أو وكالة؟", text: "نعم، وهذا ما يتمدد لاحقاً داخل رِفد للأعمال مع Workspaces وعمليات أوسع." },
            ].map((item) => (
              <article key={item.title} className="rounded-xl border border-border bg-card p-5 shadow-soft">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-extrabold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-elegant">
            <div className="flex items-center gap-2 text-primary">
              <Clapperboard className="h-5 w-5" />
              <h2 className="text-2xl font-extrabold">اعتراضات الشراء الأساسية — بإجابات عملية</h2>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {objections.map((item) => (
                <article key={item.title} className="rounded-xl border border-border bg-secondary/30 p-4">
                  <h3 className="text-base font-extrabold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.answer}</p>
                  <div className="mt-3 rounded-lg border border-primary/15 bg-background/80 px-3 py-3 text-sm leading-6 text-foreground/80">
                    <span className="font-extrabold text-primary">الخطوة المنطقية التالية:</span> {item.next}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {operationalOutcomes.map((item) => (
              <article key={item.title} className="rounded-xl border border-border bg-card p-5 shadow-soft">
                <h2 className="text-base font-extrabold">{item.title}</h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.description}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-primary/20 bg-secondary/30 p-6 shadow-elegant">
            <h2 className="text-2xl font-extrabold">إذا اقتنعت، ما هو المسار الصحيح بعد هذه الصفحة؟</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {decisionPaths.map((item) => (
                <article key={item.title} className="rounded-xl border border-border bg-card p-5">
                  <h3 className="text-base font-extrabold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                  <Button asChild variant="outline" className="mt-4 w-full">
                    <Link to={item.href as never}>{item.label}</Link>
                  </Button>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="gradient-primary text-primary-foreground shadow-elegant">
              <Link to="/onboarding">
                ابدأ التجربة المجانية
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/for-perfumes-beauty">شاهد صفحة قطاعية كمثال</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/pricing">قارن الباقات</Link>
            </Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
