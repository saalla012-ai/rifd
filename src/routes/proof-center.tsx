import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  Clapperboard,
  Compass,
  MessageSquareQuote,
  Route as RouteIcon,
  ShieldCheck,
  Sparkles,
  Store,
  Target,
} from "lucide-react";
import { MarketingLayout } from "@/components/marketing-layout";
import { ProofCenterOperationalProof } from "@/components/proof-center-operational-proof";
import { Button } from "@/components/ui/button";

const decisionFramework = [
  {
    title: "1) افهم نقطة التحول",
    description: "ابدأ من الفرق بين طلب عام وبين حزمة تشغيل مترابطة تقود النص والصورة والـ CTA بنفس الزاوية.",
  },
  {
    title: "2) اختر الإثبات الأقرب لقطاعك",
    description: "لا تتعامل مع الصفحة كعرض عام؛ استخدم المثال الأقرب لمتجرك حتى تحكم على صلاحية المنطق البيعي فعلاً.",
  },
  {
    title: "3) انتقل للمسار الصحيح",
    description: "بعد وضوح الإثبات، خذ القرار المناسب: تجربة، باقة، صفحة قطاعية، أو مسار أعمال إذا كان احتياجك مؤسسياً.",
  },
];

const beforeAfter = [
  {
    title: "قبل: طلب مبعثر",
    items: [
      "أبغى بوست عن عرض جديد للعطور.",
      "أحتاج صورة مناسبة لكن ما أعرف الاتجاه.",
      "ودي بريل قصير بس ما عندي زاوية واضحة.",
    ],
  },
  {
    title: "بعد: حزمة تشغيل أولية",
    items: [
      "منشور رئيسي بنبرة تخدم دافع الشراء الحقيقي.",
      "هوكات بديلة + CTA أوضح + اتجاه بصري متسق.",
      "فكرة Reel قصيرة تنطلق من نفس الرسالة بدل فكرة منفصلة.",
    ],
  },
];

const proofPackets = [
  {
    title: "العطور والجمال",
    problem: "المحتوى يبقى غالباً عند كلمات مثل الفخامة والجودة دون بيع الإحساس والانطباع الأول.",
    output: "الإثبات هنا يربط الرسالة بالتجربة والثقة في الاختيار، ثم يترجمها إلى محتوى وصورة وReel متناسقين.",
    outcome: "العميلة ترى سبب الشراء بشكل أوضح: الانطباع، الثبات، والملاءمة — لا مجرد وصف المنتج.",
    href: "/for-perfumes-beauty",
    icon: Sparkles,
  },
  {
    title: "الأزياء والعبايات",
    problem: "التسويق يكرر الخامة واللون بينما قرار الشراء الحقيقي يرتبط بالظهور والاستخدام والمناسبة.",
    output: "المخرج الجيد هنا يبيع المشهد النهائي: كيف تبدو القطعة، متى تُلبس، ولماذا تبدو اختياراً مناسباً.",
    outcome: "القيمة ترتفع لأن الرسالة تبرر الشراء بالهوية والاستخدام لا بالخصم فقط.",
    href: "/for-abayas-fashion",
    icon: Store,
  },
  {
    title: "الهدايا والحلويات والقهوة",
    problem: "إظهار المنتج وحده لا يكفي لأن الشراء هنا تحركه المناسبة واللحظة الاجتماعية أكثر من الصنف بحد ذاته.",
    output: "الإثبات يربط المحتوى بالإهداء والزيارة والضيافة والإطلاق الموسمي مع CTA أقرب للحجز والطلب.",
    outcome: "يصبح القرار أسرع لأن الصفحة تبيع المناسبة التي سيُطلب المنتج لأجلها.",
    href: "/for-gifts-sweets-coffee",
    icon: Briefcase,
  },
  {
    title: "الفرق والوكالات",
    problem: "الاحتياج هنا لا يتوقف عند منشور واحد، بل يحتاج منطق تشغيل يمكن تكراره وتسليمه على أكثر من حساب.",
    output: "الإثبات المؤسسي يوضح متى ينتقل الاستخدام من أداة محتوى فردية إلى مسار أعمال أوضح في التأهيل والتسليم.",
    outcome: "الزائر يعرف هل يكفيه المسار الفردي أم أن القرار الصحيح هو التوجه مباشرة إلى رِفد للأعمال.",
    href: "/business-solutions",
    icon: ShieldCheck,
  },
];

const objections = [
  {
    title: "هل الناتج مجرد نص عام؟",
    proof: "الإثبات هنا لا يعرض منشوراً معزولاً، بل يربطه بهوك وصورة وفكرة Reel وCTA ضمن نفس الحزمة.",
    answer: "هذا يقلل مشكلة المحتوى العام لأن كل عنصر في الحملة يخدم نفس الدافع البيعي بدلاً من العمل كمخرجات منفصلة.",
    next: "ابدأ التجربة المجانية ثم قارن أول مخرج بما تكتبه عادة بنفسك، لأن الفرق الحقيقي يظهر في ترابط الحزمة لا في طول النص فقط.",
    ctaLabel: "ابدأ التجربة المجانية",
    href: "/onboarding",
  },
  {
    title: "هل يصلح فعلاً للسوق السعودي؟",
    proof: "الأمثلة مبنية على قطاعات محلية وسياقات شراء حقيقية مثل الإهداء والفخامة والاستخدام اليومي والموسمية.",
    answer: "التخصيص هنا ليس شكلياً؛ بل يظهر في نبرة الرسالة، والاعتراضات التي يجري الرد عليها، وطريقة دفع القرار الشرائي.",
    next: "انتقل إلى الصفحة القطاعية الأقرب لمتجرك، لأن الحكم الأدق يكون من منطق سوقك لا من مثال بعيد عنك.",
    ctaLabel: "شاهد المثال القطاعي",
    href: "/for-perfumes-beauty",
  },
  {
    title: "هل يوفّر وقتاً حقيقياً؟",
    proof: "القيمة ليست في السرعة وحدها، بل في اختصار ثلاث حلقات دفعة واحدة: الفكرة، الصياغة، والاتجاه البصري الأول.",
    answer: "حين تبدأ من مخرج مترابط، تقل العودة إلى نقطة الصفر وتصبح دورة تجهيز المحتوى الأسبوعية أخف وأكثر اتساقاً.",
    next: "راجع طبقة الإثبات التشغيلي بالأسفل لتعرف ما الذي يجب أن تراه فعلياً في أول أسبوع، وكيف تنتقل بعدها إلى الباقة المناسبة.",
    ctaLabel: "تابع إلى الإثبات التشغيلي",
    href: "/pricing",
  },
  {
    title: "هل يناسب الفرق والوكالات؟",
    proof: "إذا كان احتياجك يتجاوز متجراً واحداً أو يحتاج تأهيلاً وتسليماً أوضح، فالمسار الفردي وحده لن يغطي هذا العمق.",
    answer: "هنا يظهر رِفد للأعمال كامتداد مؤسسي، لا كنسخة أكبر فقط من نفس التجربة الفردية.",
    next: "إذا كنت تدير فريقاً أو عدة حسابات، فالمسار الصحيح هو رِفد للأعمال لأن قرارك تشغيلي قبل أن يكون مجرد قرار تجربة.",
    ctaLabel: "اذهب إلى رِفد للأعمال",
    href: "/business-solutions",
  },
];

const fitGuidance = [
  {
    title: "مناسب لك إذا...",
    points: [
      "تريد بداية حملة أسرع بدل البدء من صفحة فارغة كل مرة.",
      "تحتاج محتوى أوضح لقطاع محدد لا صياغة عامة قابلة للنسخ على أي متجر.",
      "تريد ربط النص والصورة والـ Reel بنفس الزاوية من أول محاولة.",
    ],
  },
  {
    title: "ليس الخيار الأدق الآن إذا...",
    points: [
      "كنت تبحث عن تشغيل مؤسسي كامل قبل اختبار منطق الحملة نفسه.",
      "كنت تتوقع أن يغنيك عن فهم عرضك وموسميتك وجمهورك دون إدخال واضح.",
      "كنت تريد مسار تسليم وتأهيل فرق قبل المرور برِفد للأعمال.",
    ],
  },
];

const subscriptionPaths = [
  {
    title: "ابدأ مجاناً إذا كان هدفك إثبات الفكرة",
    description: "هذا هو المسار الأنسب عندما تريد اختبار منطق رِفد على متجر واحد والتأكد أن المخرج أوضح من طريقتك الحالية قبل أي التزام.",
    proof: "يناسب من يريد الحكم على الترابط بين النص والصورة والزاوية البيعية من أول تجربة.",
    href: "/onboarding",
    label: "اختبره مجاناً أولاً",
  },
  {
    title: "اذهب إلى احترافي إذا كان لديك تشغيل مستمر",
    description: "عندما يصبح المطلوب أسبوعياً ومتكرراً، فالقيمة لا تعود في منشور واحد بل في تحويل الإثبات إلى روتين محتوى مستمر وواضح.",
    proof: "هذا هو الامتداد الطبيعي إذا اقتنعت بالإثبات وتريد استخدامه داخل دورة المحتوى الشهرية لمتجرك.",
    href: "/pricing",
    label: "قارن باقة احترافي",
  },
  {
    title: "اذهب إلى رِفد للأعمال إذا كان القرار مؤسسياً",
    description: "إذا كنت تدير فريقاً أو عدة متاجر أو تحتاج مسار تأهيل وتسليم أوضح، فالمقارنة الصحيحة ليست بين منشور وآخر بل بين نظامي تشغيل.",
    proof: "هنا يصبح رِفد للأعمال هو المسار المنطقي لأن احتياجك تجاوز الاستخدام الفردي فعلاً.",
    href: "/business-solutions",
    label: "انتقل إلى رِفد للأعمال",
  },
];

const proofRoutes = [
  {
    title: "أريد أن أعرف إن كان منطق رِفد يناسب متجري",
    detail: "ابدأ من قبل/بعد ثم انتقل إلى المثال القطاعي الأقرب لك.",
    icon: Compass,
  },
  {
    title: "أريد أن أفهم أين يظهر الأثر داخل التشغيل",
    detail: "اقرأ النتائج التشغيلية ثم عد إلى قرار التجربة أو الباقة.",
    icon: RouteIcon,
  },
  {
    title: "أريد أن أعرف هل أحتاج المسار الفردي أم المؤسسي",
    detail: "استخدم قسم الملاءمة ثم احسم بين رِفد العادي ورِفد للأعمال.",
    icon: Target,
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
      { title: "Proof Center — مركز إثبات رِفد للمتاجر السعودية" },
      {
        name: "description",
        content:
          "مركز إثبات رِفد: قبل/بعد، أمثلة قطاعية، اعتراضات شراء، ومسارات قرار واضحة توضّح كيف يخدم المتاجر السعودية عملياً.",
      },
      { property: "og:title", content: "Proof Center — مركز إثبات رِفد" },
      {
        property: "og:description",
        content: "شاهد الفرق بين الطلب العام وحزمة تشغيل مترابطة، ثم اختر المسار الأنسب لمتجرك أو فريقك.",
      },
    ],
    links: [{ rel: "canonical", href: "https://rifd.site/proof-center" }],
  }),
  component: ProofCenterPage,
});

function ProofCenterPage() {
  return (
    <MarketingLayout>
      <section className="gradient-hero border-b border-border py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
            <BadgeCheck className="h-3.5 w-3.5" />
            مركز الإثبات المعتمد في V8
          </div>
          <h1 className="mt-4 max-w-4xl text-3xl font-extrabold leading-tight sm:text-5xl">
            لا نكتفي بقول إن رِفد مناسب للسوق السعودي — <span className="text-gradient-primary">نثبت ذلك بالأمثلة.</span>
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
            هذه الصفحة ليست معرضاً عاماً؛ بل نظام قرار يوضح كيف ينتقل المتجر من طلب مبسط إلى حزمة تشغيل أقرب للنشر، ثم يوجهك إلى الخطوة الصحيحة التالية.
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

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {proofRoutes.map((item) => (
              <article key={item.title} className="rounded-xl border border-primary/15 bg-primary/5 p-5 shadow-soft">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background text-primary shadow-soft">
                  <item.icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-base font-extrabold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
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
            <h2 className="text-xl font-extrabold">ما الذي يثبته هذا القسم فعلياً؟</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground">
              يثبت أن الفارق ليس في تحسين الجمل فقط، بل في نقل المتجر من طلب مبعثر إلى نقطة انطلاق قابلة للنشر: وعد أوضح، زاوية بيع واحدة، واقتراحات بصرية مرتبطة بنفس الهدف.
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
              كل قطاع يشتري بطريقة مختلفة، لذلك يجب أن يظهر الإثبات بنفس منطق السوق الذي يخاطبه.
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
                  <Link to={item.href as never}>شاهد المثال الأقرب</Link>
                </Button>
              </article>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-elegant">
            <div className="flex items-center gap-2 text-primary">
              <Clapperboard className="h-5 w-5" />
              <h2 className="text-2xl font-extrabold">اعتراضات الشراء الأساسية — والرد العملي على كل واحد</h2>
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
                  <Button asChild variant="outline" className="mt-4 w-full">
                    <Link to={item.href as never}>{item.ctaLabel}</Link>
                  </Button>
                </article>
              ))}
            </div>
          </div>

          <ProofCenterOperationalProof />

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

          <div className="mt-8 grid gap-4 xl:grid-cols-3">
            {subscriptionPaths.map((item) => (
              <article key={item.title} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <h2 className="text-lg font-extrabold">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.description}</p>
                <div className="mt-4 rounded-lg border border-primary/15 bg-primary/5 px-3 py-3 text-sm leading-6 text-foreground/80">
                  <span className="font-extrabold text-primary">لماذا هذا هو المسار الصحيح:</span> {item.proof}
                </div>
                <Button asChild className="mt-4 w-full" variant="outline">
                  <Link to={item.href as never}>{item.label}</Link>
                </Button>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-primary/20 bg-secondary/30 p-6 pb-28 shadow-elegant lg:pb-20">
            <h2 className="text-2xl font-extrabold">إذا اقتنعت، ما هو المسار الصحيح بعد هذه الصفحة؟</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
              هذه النقطة هي جوهر PRF-50: لا نترك الزائر مقتنعاً فقط، بل نربطه مباشرة بالخطوة التالية المنطقية بحسب حجم احتياجه ونوع قراره.
            </p>
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
