import { Link } from "@tanstack/react-router";
import { ArrowLeft, Clapperboard, Images, MessageSquareText, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const proofSignals = ["وصف واحد", "4 مخرجات مترابطة", "جاهزة لبداية حملة"];

const steps = [
  {
    title: "1) وصف سريع",
    body: "اسم المتجر + نوع المنتج + الجمهور = نقطة بداية واضحة بدون تعقيد.",
    icon: Wand2,
  },
  {
    title: "2) نص سعودي مقنع",
    body: "منشور رئيسي، هوكات، ودعوة شراء واضحة تبدو كأنها مكتوبة لمتجرك تحديداً.",
    icon: MessageSquareText,
  },
  {
    title: "3) مخرج بصري جاهز للحملة",
    body: "فكرة صورة رئيسية، بوستر، واتجاه بصري يترجم الهوية إلى مادة قابلة للتنفيذ.",
    icon: Images,
  },
  {
    title: "4) فكرة ريلز",
    body: "افتتاحية بصرية، تسلسل لقطات، وزاوية بيع مختصرة تختصر عليك بداية المحتوى المرئي.",
    icon: Clapperboard,
  },
];

export function HeroProofFilm() {
  return (
    <section className="border-t border-border bg-background py-16 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
            <Clapperboard className="h-3.5 w-3.5" />
            فيديو الإثبات — كيف يتحول الطلب إلى حملة
          </div>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">
            لا يبهرك رِفد بالواجهة فقط — <span className="text-gradient-primary">يُريك كيف يخرج النص والصورة وفكرة الريلز من نفس الطلب.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
            هذه ليست معاينة شكلية. هذا هو منطق الإقناع في رِفد: وصف بسيط يدخل، ثم ترى أمامك نصاً وصورة وفكرة فيديو ضمن حزمة واحدة قابلة للتشغيل.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {proofSignals.map((signal) => (
              <span
                key={signal}
                className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground/85"
              >
                {signal}
              </span>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {steps.map((step) => (
              <article key={step.title} className="rounded-xl border border-border bg-card p-4 shadow-soft sm:p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <step.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-sm font-extrabold sm:text-base">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="w-full gradient-primary text-primary-foreground shadow-elegant sm:w-auto">
              <Link to="/onboarding">
                ابدأ التجربة المجانية
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link to="/proof-center">شاهد إثباتات أكثر عمقاً</Link>
            </Button>
          </div>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            إذا كان هدفك حسم القرار بسرعة، فهذا القسم يجيب على سؤال <span className="font-bold text-foreground">"كيف يختلف رِفد عملياً؟"</span> قبل أن تنتقل إلى مركز الإثبات أو صفحة الأسعار.
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-[2rem] bg-primary/10 blur-3xl" aria-hidden />
          <div className="rounded-[2rem] border border-border bg-card p-4 shadow-elegant sm:p-5">
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-border bg-secondary/50 px-4 py-3">
              <div>
                <div className="text-xs font-bold text-primary">مشهد الإبهار المقترح</div>
                <div className="mt-1 text-sm font-extrabold">وصف واحد يجهّز 4 مخرجات</div>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-bold text-success">
                <span className="h-2 w-2 rounded-full bg-success" />
                تدفّق مباشر
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-[1.5rem] border border-primary/15 bg-gradient-to-b from-secondary/80 to-background p-4">
                <div className="rounded-2xl border border-dashed border-primary/25 bg-background/80 p-4">
                  <div className="text-xs font-bold text-muted-foreground">المدخل</div>
                  <div className="mt-2 text-sm font-extrabold">متجر عطور — جمهور نسائي — نبرة راقية</div>
                  <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                    <div className="rounded-lg bg-secondary px-3 py-2">عرض جديد لثبات الرائحة</div>
                    <div className="rounded-lg bg-secondary px-3 py-2">التركيز على الفخامة لا الخصم</div>
                    <div className="rounded-lg bg-secondary px-3 py-2">دعوة شراء خفيفة</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs font-bold text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  رِفد ينسّق المخرجات كحزمة لا كأجزاء منفصلة
                </div>
              </div>

              <div className="space-y-3">
                <article className="rounded-2xl border border-border bg-background p-4">
                  <div className="text-xs font-bold text-primary">النص المقترح</div>
                  <p className="mt-2 text-sm leading-7 text-foreground">
                    عطر يثبت من أول حضور… نفحات راقية تعيش معك من بداية اليوم إلى آخره، بإحساس فخم يلفت بدون مبالغة.
                  </p>
                </article>

                <div className="grid gap-3 sm:grid-cols-2">
                  <article className="rounded-2xl border border-border bg-background p-4">
                    <div className="text-xs font-bold text-primary">اتجاه الصورة</div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      زجاجة العطر بإضاءة ذهبية ناعمة، خلفية داكنة متوازنة، ومساحة عنوان واضحة للعرض.
                    </p>
                  </article>
                  <article className="rounded-2xl border border-border bg-background p-4">
                    <div className="text-xs font-bold text-primary">فكرة الريلز</div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      لقطة أولى للعبوة، ثم رشّة قريبة، ثم جملة ختامية: الثبات الذي يترك انطباعاً من أول لحظة.
                    </p>
                  </article>
                </div>

                <div className="rounded-2xl border border-gold/30 bg-gold/10 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-xs font-bold text-gold-foreground">المحصلة النهائية</div>
                      <div className="mt-1 text-sm font-extrabold">وصف واحد يجهّز لك منشوراً + صورة + فكرة ريلز + دعوة شراء</div>
                    </div>
                    <div className="inline-flex self-start rounded-full bg-background px-3 py-1 text-xs font-bold text-foreground sm:self-auto">بدلاً من 5 ساعات</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}