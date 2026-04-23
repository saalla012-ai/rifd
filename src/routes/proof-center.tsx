import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  Clapperboard,
  Clock3,
  Images,
  MessageSquareQuote,
  ShieldCheck,
  Sparkles,
  Store,
  Target,
} from "lucide-react";
import { MarketingLayout } from "@/components/marketing-layout";
import { Button } from "@/components/ui/button";

const decisionFramework = [
  {
    title: "1) افهم الفرق",
    description: "شاهد كيف ينتقل المتجر من طلب عام إلى حزمة تشغيل أوضح في الرسالة والصورة والـ CTA.",
  },
  {
    title: "2) طابقه على قطاعك",
    description: "لا تعتمد على إثبات عام؛ قارن المثال بالقطاع الأقرب لمتجرك حتى تعرف إن كان المنطق مناسباً لك فعلاً.",
  },
  {
    title: "3) اختر المسار التالي",
    description: "بعد الاقتناع، انتقل مباشرة إلى التجربة أو الباقات أو رِفد للأعمال بحسب نوع قرارك.",
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

const proofPackets = [
  {
    title: "العطور والجمال",
    problem: "المنتج يبدو جميلاً لكن الرسالة غالباً تبقى عامة: فخامة، جودة، عرض محدود.",
    output: "حزمة تبدأ بالإحساس والانطباع الأول، ثم تربط ذلك بالثقة في الاختيار وقرار الشراء.",
    outcome: "الناتج يصبح أقرب لبيع تجربة العطر لا مجرد وصف الزجاجة أو الخصم.",
    href: "/for-perfumes-beauty",
    icon: Sparkles,
  },
  {
    title: "الأزياء والعبايات",
    problem: "المحتوى يكرر وصف الخامة أو اللون بينما سبب الشراء الحقيقي هو الظهور والاستخدام والمناسبة.",
    output: "رسالة تربط القطعة بالمشهد النهائي على العميلة: تنسيق، حضور، واستخدام يومي أو مناسبة.",
    outcome: "ترتفع قيمة القطعة في ذهن العميلة لأن المحتوى يبرر الشراء بالهوية لا بالسعر فقط.",
    href: "/for-abayas-fashion",
    icon: Store,
  },
  {
    title: "الهدايا والحلويات والقهوة",
    problem: "الحملة تفشل حين تعرض المنتج وحده وتنسى المناسبة الاجتماعية التي تدفع الناس للطلب.",
    output: "زوايا بيعية مرتبطة بالإهداء والزيارة والضيافة والإطلاق الموسمي مع CTA أوضح للحجز والطلب.",
    outcome: "القرار يصبح أسرع لأن الرسالة تبيع اللحظة المناسبة لا مجرد الصنف المعروض.",
    href: "/for-gifts-sweets-coffee",
    icon: Briefcase,
  },
  {
    title: "الفرق والوكالات",
    problem: "الاحتياج هنا ليس منشوراً واحداً فقط بل منطقاً يمكن تكراره عبر أكثر من عميل أو حساب.",
    output: "مسار مؤسسي يرفع من وضوح التسليم والحزم والحالات المناسبة للتشغيل المتكرر.",
    outcome: "هذا هو الجسر الطبيعي إلى رِفد للأعمال عندما يصبح المطلوب أقرب لنظام تشغيل لا أداة فردية فقط.",
    href: "/business-solutions",
    icon: ShieldCheck,
  },
];

const objections = [
  {
    title: "هل الناتج مجرد نص عام؟",
    proof: "ستلاحظ أن الإثبات هنا لا يكتفي بمنشور واحد؛ بل يربط المنشور بالهوك والصورة والـ Reel والـ CTA في نفس الحزمة.",
    answer: "هذا يقلل مشكلة النصوص العامة لأن كل مخرج يخدم نفس الزاوية البيعية بدلاً من أن يعمل منفصلاً عن الآخر.",
    next: "إذا كان هذا هو اعتراضك الرئيسي، فالخطوة الأدق هي بدء التجربة المجانية ومقارنة أول مخرج بما تكتبه عادة بنفسك.",
  },
  {
    title: "هل يصلح فعلاً للسوق السعودي؟",
    proof: "الأمثلة هنا مبنية على قطاعات محلية وسياقات شراء فعلية: الإهداء، الفخامة، الاستخدام اليومي، والموسمية.",
    answer: "لذلك التخصيص ليس شكلياً؛ بل يظهر في نبرة الرسالة، وطريقة العرض، والاعتراضات التي يجري الرد عليها.",
    next: "افتح الصفحة القطاعية الأقرب لمتجرك، لأن هذه الخطوة تكشف سريعاً إن كان المنطق البيعي مفهوماً لواقع سوقك أم لا.",
  },
  {
    title: "هل يوفّر وقتاً حقيقياً؟",
    proof: "القيمة ليست في السرعة المجردة، بل في اختصار 3 مراحل معاً: التفكير، الكتابة، وتحديد الاتجاه البصري الأول.",
    answer: "حين تبدأ من مخرج مترابط، تقل العودة لنقطة الصفر وتصبح دورة أسبوع المحتوى أخف وأكثر اتساقاً.",
    next: "انزل إلى النتائج التشغيلية بالأسفل لتعرف أين بالضبط يتم اختصار الوقت داخل العمل الأسبوعي.",
  },
  {
    title: "هل يناسب الفرق والوكالات؟",
    proof: "إذا كان احتياجك يتجاوز متجراً واحداً أو يحتاج تأهيلاً وتسليماً أوضح، فالمسار الفردي وحده لن يكون كافياً.",
    answer: "هنا يأتي دور رِفد للأعمال كامتداد مؤسسي، لا كمجرد نسخة أكبر من نفس الصفحة التسويقية.",
    next: "إن كنت تدير فريقاً أو عدة حسابات، انتقل مباشرة إلى رِفد للأعمال بدلاً من الحكم على المنتج فقط بمنطق التجربة الفردية.",
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

const fitGuidance = [
  {
    title: "مناسب لك إذا...",
    points: [
      "تريد بداية حملة أسرع بدل البدء من صفحة فارغة كل مرة.",
      "تحتاج محتوى أوضح لقطاع محدد لا قالباً عاماً قابلاً للنسخ على أي متجر.",
      "تريد ربط النص والصورة والـ Reel بنفس الزاوية من أول محاولة.",
    ],
  },
  {
    title: "ليس الخيار الأدق الآن إذا...",
    points: [
      "كنت تبحث عن إدارة تشغيل كاملة لفريقك قبل اختبار المنطق الأساسي للحملة.",
      "كنت تتوقع أن يغنيك عن فهم عرضك أو موسميتك أو جمهورك تماماً دون إدخال واضح.",
      "كنت تريد إنتاجاً مؤسسياً مع تدفقات تأهيل وتسليم قبل المرور بمسار رِفد للأعمال.",
    ],
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
  {
    title: "أدير فريقاً أو أكثر من عميل",
    description: "إذا كان قرارك مؤسسياً أو تشغيلياً، اذهب إلى رِفد للأعمال لأن مسارك مختلف عن المتجر الفردي.",
    href: "/business-solutions",
    label: "اذهب إلى رِفد للأعمال",
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
          <div className="grid gap-4 md:grid-cols-3">
            {decisionFramework.map((layer) => (
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

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {proofPackets.map((item) => (
              <article key={item.title} className="rounded-xl border border-border bg-card p-5 shadow-soft">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-extrabold">{item.title}</h3>
                <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                  <p><span className="font-bold text-foreground">المشكلة:</span> {item.problem}</p>
                  <p><span className="font-bold text-foreground">المخرج:</span> {item.output}</p>
                  <p><span className="font-bold text-foreground">ما الذي يتغير فعلياً:</span> {item.outcome}</p>
                </div>
                <Button asChild variant="outline" className="mt-4 w-full">
                  <Link to={item.href as never}>شاهد المثال القطاعي</Link>
                </Button>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
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
                  <div className="mt-3 rounded-lg border border-border bg-background/80 px-3 py-3 text-sm leading-6 text-muted-foreground">
                    <span className="font-extrabold text-foreground">الإثبات داخل الصفحة:</span> {item.proof}
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.answer}</p>
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

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {fitGuidance.map((group, index) => (
              <article
                key={group.title}
                className={`rounded-2xl border p-6 shadow-soft ${
                  index === 0 ? "border-primary/20 bg-primary/5" : "border-border bg-card"
                }`}
              >
                <div className="flex items-center gap-2 text-primary">
                  {index === 0 ? <CheckCircle2 className="h-5 w-5" /> : <Target className="h-5 w-5" />}
                  <h2 className="text-xl font-extrabold text-foreground">{group.title}</h2>
                </div>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                  {group.points.map((point) => (
                    <li key={point}>• {point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-primary/20 bg-secondary/30 p-6 shadow-elegant">
            <h2 className="text-2xl font-extrabold">إذا اقتنعت، ما هو المسار الصحيح بعد هذه الصفحة؟</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
