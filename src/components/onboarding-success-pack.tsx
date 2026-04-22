import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Clapperboard, Copy, ImagePlus, Lightbulb, Megaphone, Tags, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SuccessPack } from "@/lib/onboarding-success";

type OnboardingSuccessPackProps = {
  pack: SuccessPack;
};

export function OnboardingSuccessPack({ pack }: OnboardingSuccessPackProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success/15">
          <Check className="h-5 w-5 text-success" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold">هذه مجرد أول نتيجة — والباقي أقوى داخل حسابك</h2>
          <p className="text-sm text-muted-foreground">حزمة بداية مبنية على القطاع والجمهور والنبرة التي أدخلتها.</p>
        </div>
      </div>

      <div className="rounded-xl border border-primary/20 bg-secondary/50 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-primary">
          <Megaphone className="h-4 w-4" />
          المنشور الرئيسي
        </div>
        <pre className="whitespace-pre-wrap text-right font-sans text-sm leading-7">{pack.primaryPost}</pre>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Lightbulb className="h-4 w-4 text-primary" />
            3 هوكات بديلة
          </div>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {pack.hooks.map((hook) => (
              <li key={hook} className="rounded-lg bg-secondary/60 px-3 py-2">{hook}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Tags className="h-4 w-4 text-primary" />
            CTA + هاشتاقات
          </div>
          <div className="mt-3 rounded-lg bg-secondary/60 px-3 py-2 text-sm">{pack.cta}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {pack.hashtags.map((tag) => (
              <span key={tag} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-bold">
            <ImagePlus className="h-4 w-4 text-primary" />
            اقتراح الصورة
          </div>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{pack.imageIdea}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Clapperboard className="h-4 w-4 text-primary" />
            اقتراح Reel قصير
          </div>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{pack.reelIdea}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gold/30 bg-gold/10 p-4">
        <div className="text-sm font-bold text-gold-foreground">لماذا هذه النتيجة مناسبة لمتجرك؟</div>
        <p className="mt-2 text-sm leading-7 text-foreground">{pack.whyItFits}</p>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-primary">
          <Wand2 className="h-4 w-4" />
          ما الذي تغيّر الآن عن التوليد العادي؟
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            "أخذت منشوراً رئيسياً + زوايا توسع، لا مخرجاً واحداً فقط.",
            "حصلت على اتجاه صورة وريل لتبدأ حملة لا مجرد بوست منفرد.",
            "كل نتيجة لاحقة داخل حسابك ستبنى على بيانات متجرك نفسها.",
          ].map((item) => (
            <div key={item} className="rounded-lg border border-border bg-background/80 px-3 py-3 text-sm leading-6 text-muted-foreground">
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild className="flex-1 gradient-primary text-primary-foreground shadow-elegant">
          <Link to="/dashboard">
            ادخل لوحة التحكم
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <Button type="button" variant="outline" className="flex-1 gap-2" onClick={() => navigator.clipboard.writeText(pack.primaryPost)}>
          <Copy className="h-4 w-4" />
          انسخ المنشور الرئيسي
        </Button>
      </div>
    </div>
  );
}