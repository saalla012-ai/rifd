import { Link } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, Clapperboard, Images, MessageSquareText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const proofItems = [
  {
    icon: MessageSquareText,
    title: "محتوى جاهز للنشر",
    description: "منشورات، هوكات، وCTA بصياغة سعودية مفهومة ومقنعة.",
  },
  {
    icon: Images,
    title: "مخرجات بصرية قابلة للحملة",
    description: "صورة، بوستر، وفكرة Carousel بدل مجرد وصف عام أو مخرج مبهم.",
  },
  {
    icon: Clapperboard,
    title: "تمهيد لحزمة Reel",
    description: "Hook بصري، تسلسل لقطات، وزاوية بيع مختصرة للريل القادم.",
  },
  {
    icon: ShieldCheck,
    title: "قرار شراء أوضح",
    description: "اعتراضات الزائر الأساسية تُجاب عبر أمثلة عملية لا ادعاءات عامة.",
  },
];

export function ProofCenterPreview() {
  return (
    <section className="border-t border-border bg-secondary/30 py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
              <BadgeCheck className="h-3.5 w-3.5" />
              Proof Center
            </div>
            <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
              مركز إثبات أوسع — يجاوب السؤال الحقيقي: <span className="text-gradient-primary">هل يناسب متجري فعلاً؟</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              أمثلة قطاعية، قبل/بعد، ومخرجات حملة كاملة توضح كيف يتحول الطلب البسيط إلى محتوى وصور وأفكار فيديو قابلة للتشغيل.
            </p>
          </div>

          <Button asChild variant="outline" className="gap-2 self-start sm:self-auto">
            <Link to="/proof-center">
              ادخل مركز الإثبات
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {proofItems.map((item) => (
            <article key={item.title} className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-extrabold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}