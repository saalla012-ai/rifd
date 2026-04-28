import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldCheck, Sparkles, Target, Zap } from "lucide-react";
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
import { track } from "@/lib/analytics/posthog";
import { buildSuccessPack, type SuccessPack } from "@/lib/onboarding-success";
import { OnboardingSuccessPack } from "@/components/onboarding-success-pack";
import { getRememberedAttribution, trackEvent } from "@/lib/ab-test";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "ابدأ مع رِفد — خطوتان لأول محتوى مخصص" },
      {
        name: "description",
        content: "أنشئ ملف متجرك بسرعة واحصل على بداية حملة أولى مخصصة فوراً، لا مجرد نص منفرد.",
      },
      { property: "og:title", content: "ابدأ مع رِفد — خطوتان لأول حملة مخصصة لمتجرك" },
      {
        property: "og:description",
        content: "ملف متجرك في 3 دقائق + أول Success Pack مترابط: نص، صورة، فكرة Reel، وCTA.",
      },
      { name: "twitter:title", content: "ابدأ مع رِفد — خطوتان لأول حملة مخصصة لمتجرك" },
      {
        name: "twitter:description",
        content: "ملف متجرك في 3 دقائق + أول Success Pack مترابط: نص، صورة، فكرة Reel، وCTA.",
      },
    ],
    links: [{ rel: "canonical", href: "https://rifd.site/onboarding" }],
  }),
  component: OnboardingPage,
});

const TONES = [
  { id: "fun", label: "مرح وقريب" },
  { id: "pro", label: "احترافي" },
  { id: "luxury", label: "فخم وراقي" },
  { id: "friendly", label: "ودود وعائلي" },
];

const setupProof = [
  { icon: Target, label: "زاوية بيع أوضح" },
  { icon: ShieldCheck, label: "اعتراضات أقل قبل الشراء" },
  { icon: Sparkles, label: "مخرجات جاهزة للحملة" },
] as const;

const quickOutputs = ["زاوية بيع سعودية", "منشور جاهز", "فكرة صورة", "سكربت Reel"] as const;

function OnboardingPage() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [storeName, setStoreName] = useState("");
  const [productType, setProductType] = useState("dropshipping");
  const [audience, setAudience] = useState("young");
  const [tone, setTone] = useState("fun");
  const [color, setColor] = useState("#1a5d3e");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [successPack, setSuccessPack] = useState<SuccessPack | null>(null);
  const trimmedStoreName = storeName.trim();

  // المستخدم لازم يكون مسجل دخول للوصول
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      void navigate({ to: "/auth", search: { redirect: "/onboarding" } });
      return;
    }
    if (profile?.onboarded) {
      void navigate({ to: "/dashboard" });
    }
    // عبّي القيم لو فيه profile جزئي
    if (profile?.store_name) setStoreName(profile.store_name);
    if (profile?.product_type) setProductType(profile.product_type);
    if (profile?.audience) setAudience(profile.audience);
    if (profile?.tone) setTone(profile.tone);
    if (profile?.brand_color) setColor(profile.brand_color);
  }, [authLoading, user, profile, navigate]);

  const next = () => setStep((s) => Math.min(2, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const finish = async () => {
    if (!user) return;
    setGenerating(true);
    const heroVariant = getRememberedAttribution("hero_hook");
    if (heroVariant) {
      void trackEvent("hero_hook", heroVariant, "submit");
    }

    try {
      // 1) احفظ ملف المتجر
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          email: user.email ?? null,
          full_name: (user.user_metadata?.full_name as string | undefined) ?? (user.user_metadata?.name as string | undefined) ?? profile?.full_name ?? null,
          store_name: trimmedStoreName,
          product_type: productType,
          audience,
          tone,
          brand_color: color,
          onboarded: true,
        });

      if (error) throw error;
      track("onboarding_completed", { product_type: productType, audience });
      await refreshProfile();

      // 2) ولّد أول منشور حقيقي عبر AI (يستخدم سياق الملف الجديد)
      const productLabel = PRODUCT_TYPES.find((p) => p.id === productType)?.label ?? productType;
      const audienceLabel = AUDIENCES.find((a) => a.id === audience)?.label ?? audience;
      const promptText = `اكتب منشور إنستقرام ترحيبي لمتجر "${trimmedStoreName}" المتخصص في ${productLabel}، يستهدف ${audienceLabel}. اجعله جذاباً وقصيراً مع 3 هاشتاقات.`;

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
          storeName: trimmedStoreName,
          productTypeLabel: productLabel,
          audienceLabel,
          tone,
          primaryPost: out.result,
        }),
      );
      setStep(3);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      console.warn("[onboarding] failed", message);
      toast.error("فشل إنشاء المحتوى");
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
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
        {step <= 2 && (
          <>
            <div className="mb-5 text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-extrabold text-primary">
                <Zap className="h-3.5 w-3.5" />
                بناء متجر يختصر قرار الشراء
              </span>
              <h1 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">
                ابنِ ذاكرة متجرك ثم شاهد أول حزمة بيع جاهزة
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                خطوتان فقط تحوّل وصف المتجر إلى زاوية بيع، منشور، صورة، Reel وCTA واضح يناسب السوق
                السعودي.
              </p>
            </div>
            <div className="mb-5 grid gap-2 sm:grid-cols-3">
              {setupProof.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground shadow-soft"
                >
                  <item.icon className="h-3.5 w-3.5 text-primary" />
                  {item.label}
                </div>
              ))}
            </div>
            <div className="mb-6 flex items-center justify-between rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
              <span className="text-xs font-bold text-muted-foreground">صفحة واحدة فقط</span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-success">
                <ShieldCheck className="h-3.5 w-3.5" />
                جاهزة خلال دقيقة
              </span>
            </div>
          </>
        )}

        <div className="rounded-2xl border border-border bg-card p-5 shadow-elegant sm:p-7">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                  <Sparkles className="h-3 w-3" /> أهلاً بك في رِفد
                </span>
                <h2 className="mt-3 text-2xl font-extrabold">
                  حوّل بيانات متجرك إلى ذاكرة بيع دقيقة
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  نأخذ اسم النشاط، المجال، الجمهور والنبرة فقط حتى يبدأ رِفد بمخرجات سعودية مخصصة بدون أسئلة زائدة.
                </p>
              </div>
              <div>
                <Label htmlFor="store">
                  اسم المتجر <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="store"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="مثلاً: لمسة عطر / دار العباءة"
                  className="mt-1"
                  maxLength={80}
                  autoFocus
                />
              </div>
              <div>
                <Label>وش نوع منتجاتك؟</Label>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {PRODUCT_TYPES.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProductType(p.id)}
                      className={cn(
                        "rounded-lg border p-3 text-sm font-medium transition-colors",
                        productType === p.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                onClick={next}
                disabled={!trimmedStoreName}
                className="h-12 w-full gradient-primary font-extrabold text-primary-foreground"
              >
                أكمل زاوية البيع
              </Button>
              <div className="grid gap-2 sm:grid-cols-2">
                {quickOutputs.map((item) => (
                  <div
                    key={item}
                    className="rounded-lg bg-secondary/60 px-3 py-2 text-xs font-bold text-muted-foreground"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-extrabold">ثبّت الجمهور والنبرة قبل أول نتيجة</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  هذه الاختيارات تحدد: هل نخاطب العميل بالسعر، الثقة، الهدية، الفخامة، أو سرعة
                  القرار.
                </p>
              </div>
              <Label>من جمهورك المستهدف؟</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCES.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label>النبرة الأقرب لعلامتك</Label>
              <div className="grid grid-cols-2 gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    className={cn(
                      "rounded-lg border p-3 text-sm font-medium",
                      tone === t.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/40",
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
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={prev} className="flex-1">
                  السابق
                </Button>
                <Button
                  onClick={finish}
                  disabled={generating}
                  className="flex-1 gradient-primary font-extrabold text-primary-foreground shadow-elegant"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> جاري بناء الحزمة البيعية...
                    </>
                  ) : (
                    <>أنشئ أول حزمة بيع ✨</>
                  )}
                </Button>
              </div>
              <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm leading-7 text-foreground/85">
                النتيجة التالية ليست منشوراً واحداً فقط؛ ستظهر زاوية حملة، CTA، فكرة صورة، وسكربت
                Reel حتى تعرف ماذا تنشر بعد الضغط مباشرة.
              </div>
            </div>
          )}

          {step === 3 && result && successPack && <OnboardingSuccessPack pack={successPack} />}
        </div>
      </div>
    </MarketingLayout>
  );
}
