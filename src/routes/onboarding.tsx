import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Sparkles, ArrowLeft, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { PRODUCT_TYPES, AUDIENCES } from "@/lib/demo-results";
import { supabase } from "@/integrations/supabase/client";
import { generateText } from "@/server/ai-functions";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { buildSuccessPack, type SuccessPack } from "@/lib/onboarding-success";
import { OnboardingSuccessPack } from "@/components/onboarding-success-pack";
import {
  formatSaudiPhoneDisplay,
  normalizeSaudiPhone,
  validateSaudiPhone,
  SAUDI_PHONE_ERROR,
  SAUDI_PHONE_PLACEHOLDER,
} from "@/lib/phone";
import { getRememberedAttribution, trackEvent } from "@/lib/ab-test";

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
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [storeName, setStoreName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [productType, setProductType] = useState("dropshipping");
  const [audience, setAudience] = useState("young");
  const [tone, setTone] = useState("fun");
  const [color, setColor] = useState("#1a5d3e");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [successPack, setSuccessPack] = useState<SuccessPack | null>(null);

  // المستخدم لازم يكون مسجل دخول للوصول
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      void navigate({ to: "/auth" });
      return;
    }
    // إذا أكمل onboarding من قبل وعنده رقم واتساب → dashboard مباشرة
    // (المستخدمون القدامى بدون رقم يكملون الاستمارة لإضافته)
    if (profile?.onboarded && profile?.whatsapp) {
      void navigate({ to: "/dashboard" });
    }
    // عبّي القيم لو فيه profile جزئي
    if (profile?.store_name) setStoreName(profile.store_name);
    if (profile?.whatsapp) setWhatsapp(formatSaudiPhoneDisplay(profile.whatsapp));
    if (profile?.product_type) setProductType(profile.product_type);
    if (profile?.audience) setAudience(profile.audience);
    if (profile?.tone) setTone(profile.tone);
    if (profile?.brand_color) setColor(profile.brand_color);
  }, [authLoading, user, profile, navigate]);

  const next = () => setStep((s) => Math.min(5, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const finish = async () => {
    if (!user) return;
    // تحقق نهائي قبل الحفظ (في حال تم تجاوز الزر بأي طريقة)
    if (!validateSaudiPhone(whatsapp)) {
      toast.error(SAUDI_PHONE_ERROR);
      setStep(1);
      return;
    }
    const normalizedWhatsapp = normalizeSaudiPhone(whatsapp)!;
    setGenerating(true);
    const heroVariant = getRememberedAttribution("hero_hook");
    if (heroVariant) {
      void trackEvent("hero_hook", heroVariant, "submit");
    }

    try {
      // 1) احفظ ملف المتجر
      const { error } = await supabase
        .from("profiles")
        .update({
          store_name: storeName.trim(),
          whatsapp: normalizedWhatsapp,
          product_type: productType,
          audience,
          tone,
          brand_color: color,
          onboarded: true,
        })
        .eq("id", user.id);

      if (error) throw error;
      await refreshProfile();

      // 2) ولّد أول منشور حقيقي عبر AI (يستخدم سياق الملف الجديد)
      const productLabel =
        PRODUCT_TYPES.find((p) => p.id === productType)?.label ?? productType;
      const audienceLabel =
        AUDIENCES.find((a) => a.id === audience)?.label ?? audience;
      const promptText = `اكتب منشور إنستقرام ترحيبي لمتجر "${storeName.trim()}" المتخصص في ${productLabel}، يستهدف ${audienceLabel}. اجعله جذاباً وقصيراً مع 3 هاشتاقات.`;

      const out = await generateText({
        data: {
          prompt: promptText,
          templateTitle: "منشور ترحيبي",
          templateId: "onboarding-welcome",
        },
      });

      setResult(out.result);
      setSuccessPack(
        buildSuccessPack({
          storeName: storeName.trim(),
          productTypeLabel: productLabel,
          audienceLabel,
          tone,
          primaryPost: out.result,
        })
      );
      setStep(5);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل إنشاء المحتوى");
    } finally {
      setGenerating(false);
    }
  };

  if (authLoading || !user) {
    return (
      <MarketingLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </MarketingLayout>
    );
  }

  return (
    <MarketingLayout>
      <div className="mx-auto max-w-2xl px-4 py-10">
        {step <= 4 && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">الخطوة {step} من 4</span>
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
                <h2 className="mt-3 text-2xl font-extrabold">عرّفنا على متجرك</h2>
                <p className="mt-1 text-sm text-muted-foreground">معلومتان سريعتان نستخدمهما في كل محتوى نولّده لك</p>
              </div>
              <div>
                <Label htmlFor="store">
                  اسم المتجر <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="store"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="مثلاً: متجر النور"
                  className="mt-1"
                  maxLength={80}
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="whatsapp">
                  رقم واتساب <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="whatsapp"
                  className="mt-1 ltr"
                  dir="ltr"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder={SAUDI_PHONE_PLACEHOLDER}
                  maxLength={20}
                  inputMode="tel"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  للتنبيهات المهمة وتفعيل اشتراكك — لن نتصل بك مطلقاً، واتساب فقط ✅
                </p>
              </div>
              <Button
                onClick={next}
                disabled={!storeName.trim() || !validateSaudiPhone(whatsapp)}
                className="w-full gradient-primary text-primary-foreground"
              >
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
                  {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري الحفظ...</> : <>أنشئ أول محتوى لي ✨</>}
                </Button>
              </div>
            </div>
          )}

          {step === 5 && result && successPack && (
            <OnboardingSuccessPack pack={successPack} />
          )}
        </div>
      </div>
    </MarketingLayout>
  );
}
