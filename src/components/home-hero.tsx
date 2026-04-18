import { Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles, Star, Users, ShoppingBag, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveAiDemo } from "./live-ai-demo";

export function HomeHero() {
  return (
    <section className="relative overflow-hidden gradient-hero">
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-gold/15 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:py-16 lg:py-20">
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              منصة سعودية • مدعومة بـChatGPT و Gemini
            </div>

            <h1 className="mt-5 text-4xl font-extrabold leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl">
              حوّل متجرك إلى{" "}
              <span className="text-gradient-primary">آلة محتوى ذكية</span>
              {" "}بالعامية السعودية
            </h1>

            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              40 قالب جاهز للنصوص والصور — مصمّمة خصيصاً لأصحاب المتاجر السعوديين.
              توليد منشورات، أوصاف، إعلانات، وبوسترات بنقرة واحدة.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="gradient-primary text-primary-foreground shadow-elegant">
                <Link to="/onboarding">
                  ابدأ مجاناً — 5 توليدات
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/vs-chatgpt">شوف الفرق عن ChatGPT</Link>
              </Button>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { icon: ShoppingBag, label: "40 قالب", sub: "نص وصور" },
                { icon: Users, label: "بالعامية", sub: "السعودية" },
                { icon: TrendingUp, label: "10 ثواني", sub: "لكل توليدة" },
                { icon: Star, label: "ضمان 7 أيام", sub: "استرجاع كامل" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-border bg-card/60 p-3">
                  <s.icon className="mb-1 h-4 w-4 text-primary" />
                  <div className="text-sm font-bold">{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <LiveAiDemo />
          </div>
        </div>
      </div>
    </section>
  );
}
