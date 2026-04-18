import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, ArrowLeft, Check, Loader2 } from "lucide-react";
import { MarketingLayout } from "@/components/marketing-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRODUCT_TYPES, AUDIENCES, generateDemoResult } from "@/lib/demo-results";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "ابدأ مع رِفد — 4 خطوات لأول محتوى مخصص لمتجرك" },
      { name: "description", content: "أنشئ ملف متجرك في 3 دقائق واحصل على أول نتيجة AI مخصصة فوراً." },
    ],
  }),
  component: OnboardingPage,
});

const TONES = [
  { id: "fun", label: "مرح وقريب" },
  { id: "pro", label: "احترافي" },
  { id: "luxury", label: "فخم وراقي" },
  { id: "friendly", label: "ودود وعائلي" },
];

function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [storeName, setStoreName] = useState("");
  const [productType, setProductType] = useState("dropshipping");
  const [audience, setAudience] = useState("young");
  const [tone, setTone] = useState("fun");
  const [color, setColor] = useState("#1a5d3e");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const next = () => setStep((s) => Math.min(5, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const finish = () => {
    setGenerating(true);
    setTimeout(() => {
      setResult(generateDemoResult({ storeName, productType, audience }));
      setGenerating(false);
      setStep(5);
    }, 1600);
  };

  return (
    <MarketingLayout>
      <div className="mx-auto max-w-2xl px-4 py-10">
        {step <= 4 && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">الخطوة {step} من 4</span>
              <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">تخطّي</Link>
            </div>
            <div className="mb-8 flex gap-1.5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors",
                    i <= step ? "bg-primary" : "bg-secondary"
                  )}
                />
              ))}
            </div>
          </>
        )}

        <div className="rounded-2xl border border-border bg-card p-7 shadow-elegant">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                  <Sparkles className="h-3 w-3" /> أهلاً بك في رِفد
                </span>
                <h2 className="mt-3 text-2xl font-extrabold">وش اسم متجرك؟</h2>
                <p className="mt-1 text-sm text-muted-foreground">نستخدمه في كل محتوى نولّده لك</p>
              </div>
              <div>
                <Label htmlFor="store">اسم المتجر</Label>
                <Input
                  id="store"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="مثلاً: متجر النور"
                  className="mt-1"
                  autoFocus
                />
              </div>
              <Button onClick={next} disabled={!storeName.trim()} className="w-full gradient-primary text-primary-foreground">
                التالي
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-extrabold">وش نوع منتجاتك؟</h2>
              <p className="text-sm text-muted-foreground">نخصص القوالب حسب نشاطك</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PRODUCT_TYPES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setProductType(p.id)}
                    className={cn(
                      "rounded-lg border p-3 text-sm font-medium transition-colors",
                      productType === p.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={prev} className="flex-1">السابق</Button>
                <Button onClick={next} className="flex-1 gradient-primary text-primary-foreground">التالي</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-extrabold">من جمهورك المستهدف؟</h2>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AUDIENCES.map((a) => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button variant="outline" onClick={prev} className="flex-1">السابق</Button>
                <Button onClick={next} className="flex-1 gradient-primary text-primary-foreground">التالي</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-extrabold">النبرة + لون الهوية</h2>
              <p className="text-sm text-muted-foreground">نستخدمها في النصوص والصور</p>
              <div className="grid grid-cols-2 gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={cn(
                      "rounded-lg border p-3 text-sm font-medium",
                      tone === t.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div>
                <Label htmlFor="color">لون الهوية</Label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    id="color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-10 w-16 cursor-pointer rounded-md border border-input bg-background"
                  />
                  <Input value={color} onChange={(e) => setColor(e.target.value)} className="font-mono" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={prev} className="flex-1">السابق</Button>
                <Button onClick={finish} disabled={generating} className="flex-1 gradient-primary text-primary-foreground shadow-elegant">
                  {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري التوليد...</> : <>أنشئ أول محتوى لي ✨</>}
                </Button>
              </div>
            </div>
          )}

          {step === 5 && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/15">
                  <Check className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold">تم! 🎉</h2>
                  <p className="text-sm text-muted-foreground">هذا أول محتوى مخصص لمتجرك</p>
                </div>
              </div>
              <pre className="whitespace-pre-wrap rounded-xl border border-primary/20 bg-secondary/50 p-4 text-right font-sans text-sm leading-relaxed">
                {result}
              </pre>
              <Button asChild className="w-full gradient-primary text-primary-foreground shadow-elegant">
                <Link to="/dashboard">
                  ادخل لوحة التحكم
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </MarketingLayout>
  );
}
