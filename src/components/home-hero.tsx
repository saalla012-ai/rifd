import { Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles, Clock, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveAiDemo } from "./live-ai-demo";

export function HomeHero() {
  return (
    <section className="relative overflow-hidden gradient-hero">
      {/* تأثيرات بصرية خلفية */}
      <div className="pointer-events-none absolute -top-40 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-gold/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 h-72 w-72 rounded-full bg-primary-glow/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:py-14 lg:py-16">
        <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_1fr]">
          {/* العمود الأيمن (المحتوى) */}
          <div>
            {/* شارة عاطفية مباشرة */}
            <div className="inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/5 px-3 py-1 text-xs font-bold text-destructive">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
              </span>
              صاحب متجر؟ هذا يخصّك
            </div>

            {/* الهوك الرئيسي — سؤال يضرب الألم */}
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.5rem]">
              تعبت تكتب{" "}
              <span className="relative whitespace-nowrap">
                <span className="text-gradient-primary">منشورات متجرك؟</span>
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 200 8"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 5 Q 50 1, 100 4 T 198 3"
                    stroke="oklch(0.78 0.16 85)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-lg font-medium text-foreground/90 sm:text-xl">
              <strong className="text-primary">رِفد</strong> يكتب لك{" "}
              <strong>30 منشور بالعامية السعودية في 5 دقائق</strong> —
              <span className="text-muted-foreground"> بدل ما تقعد 5 ساعات تفكر وتعدّل.</span>
            </p>

            {/* قائمة فوائد سريعة بصرية */}
            <ul className="mt-5 grid gap-2 text-sm">
              {[
                { icon: "✅", text: "بالعامية السعودية الأصيلة — ما تحس إنه مترجم" },
                { icon: "✅", text: "وفّر 800+ ر.س شهرياً تدفعها لمصمم/كاتب" },
                { icon: "✅", text: "نتيجة جاهزة للنشر في أقل من 10 ثواني" },
              ].map((b) => (
                <li key={b.text} className="flex items-start gap-2 text-foreground/85">
                  <span className="mt-0.5 text-base">{b.icon}</span>
                  <span>{b.text}</span>
                </li>
              ))}
            </ul>

            {/* CTAs مع تركيز على الأهم */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="gradient-primary text-primary-foreground shadow-elegant transition-transform hover:scale-[1.02]"
              >
                <Link to="/onboarding">
                  <Sparkles className="h-4 w-4" />
                  ابدأ مجاناً — 5 توليدات
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/vs-chatgpt">شوف الفرق عن ChatGPT</Link>
              </Button>
            </div>

            {/* إيصال ثقة تحت الزر */}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-success" />
                بدون بطاقة ائتمان
              </span>
              <span className="inline-flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-gold" />
                تجربة فورية
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-primary" />
                إلغاء بنقرة
              </span>
            </div>
          </div>

          {/* العمود الأيسر (الـDemo التفاعلي) */}
          <div className="relative">
            {/* شارة "جربها مباشرة" بارزة فوق الـDemo */}
            <div className="absolute -top-3 right-4 z-10 inline-flex items-center gap-1.5 rounded-full gradient-gold px-3 py-1 text-xs font-bold text-gold-foreground shadow-gold">
              👇 جرّبها الحين — مجاناً
            </div>
            <LiveAiDemo />
          </div>
        </div>
      </div>
    </section>
  );
}
