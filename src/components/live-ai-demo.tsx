import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, Copy, Check, Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  generateDemoResult,
  PRODUCT_TYPES,
  AUDIENCES,
} from "@/lib/demo-results";

export function LiveAiDemo() {
  const [storeName, setStoreName] = useState("");
  const [productType, setProductType] = useState("dropshipping");
  const [audience, setAudience] = useState("young");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    setLoading(true);
    setResult(null);
    setCopied(false);
    // محاكاة استدعاء AI واقعي بـ ~1.5 ثانية
    setTimeout(() => {
      setResult(generateDemoResult({ storeName, productType, audience }));
      setLoading(false);
    }, 1400);
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-elegant sm:p-7">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary text-primary-foreground">
            <Wand2 className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold">جرّب الآن — بدون تسجيل</h3>
            <p className="text-xs text-muted-foreground">شوف نتيجة حقيقية في 10 ثواني</p>
          </div>
        </div>
        <span className="hidden items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-bold text-success sm:inline-flex">
          ● مباشر
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">اسم متجرك</label>
          <Input
            placeholder="مثلاً: متجر النور"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            maxLength={40}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">نوع المنتج</label>
          <Select value={productType} onValueChange={setProductType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRODUCT_TYPES.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">الجمهور</label>
          <Select value={audience} onValueChange={setAudience}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {AUDIENCES.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={loading}
        size="lg"
        className="mt-4 w-full gradient-primary text-primary-foreground shadow-elegant hover:opacity-95"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> جاري التوليد...</>
        ) : (
          <><Sparkles className="h-4 w-4" /> ولّد منشور إنستقرام بالعامية</>
        )}
      </Button>

      {result && (
        <div className="mt-4 rounded-xl border border-primary/20 bg-secondary/40 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-primary">✨ النتيجة</span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded-md bg-background px-2 py-1 text-xs font-medium text-foreground hover:bg-accent"
            >
              {copied ? <><Check className="h-3 w-3 text-success" /> تم النسخ</> : <><Copy className="h-3 w-3" /> نسخ</>}
            </button>
          </div>
          <pre className="whitespace-pre-wrap text-right font-sans text-sm leading-relaxed text-foreground">
            {result}
          </pre>
          <div className="mt-4 rounded-lg bg-gradient-to-l from-gold/15 to-primary/10 p-3 text-center">
            <p className="text-sm font-medium">
              ✨ هذا غيض من فيض — في رِفد عندك <strong>40 قالب جاهز</strong> + ذاكرة متجر دائمة
            </p>
            <Button asChild size="sm" className="mt-2 gradient-gold text-gold-foreground shadow-gold">
              <Link to="/onboarding">سجّل واحصل على 5 توليدات مجانية</Link>
            </Button>
          </div>
        </div>
      )}

      {!result && !loading && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          لا حاجة لبطاقة ائتمان • نتائج بالعامية السعودية الأصيلة
        </p>
      )}
    </div>
  );
}
