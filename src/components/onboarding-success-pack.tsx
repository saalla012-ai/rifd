import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Clapperboard, Copy, ImagePlus, Lightbulb, Megaphone, Tags, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SuccessPack } from "@/lib/onboarding-success";

const nextSteps = [
  "انسخ المنشور الرئيسي واستخدمه كأول إعلان أو منشور اليوم.",
  "حوّل اقتراح الصورة إلى تصميم أو توليد صورة داخل حسابك.",
  "استخدم فكرة الريلز لتبدأ سلسلة محتوى بدل بوست منفرد.",
];

const activationWins = [
  "خرجت بنتيجة مبنية على نوع متجرك وجمهورك لا نص عام.",
  "صار عندك اتجاه حملة أولية: منشور + صورة + ريلز + CTA.",
  "كل التوليدات القادمة داخل حسابك ستبقى مبنية على نفس ذاكرة المتجر.",
];

type OnboardingSuccessPackProps = {
  pack: SuccessPack;
};

export function OnboardingSuccessPack({ pack }: OnboardingSuccessPackProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pack.primaryPost);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success/15">
          <Check className="h-5 w-5 text-success" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold">هذه ليست نتيجة عابرة — هذه بداية حملتك الأولى</h2>
          <p className="text-sm text-muted-foreground">حزمة بداية مبنية على القطاع والجمهور والنبرة التي أدخلتها، مع خطوة تالية واضحة داخل حسابك.</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {activationWins.map((item) => (
          <div key={item} className="rounded-xl border border-border bg-background/80 px-4 py-4 text-sm leading-6 text-muted-foreground">
            {item}
          </div>
        ))}
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
          ماذا تفعل بهذه الحزمة خلال أول 15 دقيقة؟
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {nextSteps.map((item, index) => (
            <div key={item} className="rounded-lg border border-border bg-background/80 px-3 py-3 text-sm leading-6 text-muted-foreground">
              <div className="mb-2 text-xs font-extrabold text-primary">الخطوة {index + 1}</div>
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Button asChild className="gradient-primary text-primary-foreground shadow-elegant md:col-span-1">
          <Link to="/dashboard">
            ادخل لوحة التحكم
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <Button type="button" variant="outline" className="gap-2 md:col-span-1" onClick={handleCopy}>
          <Copy className="h-4 w-4" />
          {copied ? "تم نسخ المنشور" : "انسخ المنشور الرئيسي"}
        </Button>
        <Button asChild variant="outline" className="md:col-span-1">
          <Link to="/dashboard/templates">افتح القوالب التالية</Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 text-sm leading-7 text-muted-foreground">
        <span className="font-extrabold text-foreground">الخطوة التالية داخل الخطة:</span> بعد تثبيت هذه البداية، سنعمّق الحزمة لتصبح أكثر قطاعية وربطاً بنتيجة الصورة والريلز داخل مسار التفعيل الكامل.
      </div>
    </div>
  );
}