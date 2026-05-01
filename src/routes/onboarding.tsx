import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldCheck, Sparkles, Target, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
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
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics/posthog";
import { ConsentDialog, type ConsentDialogValues, type ConsentDialogKey } from "@/components/consent-dialog";
import { recordConsent, type ConsentType } from "@/server/consent-functions";
import { getRememberedAttribution, trackEvent } from "@/lib/ab-test";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboarding رِفد — صفحة واحدة" },
      {
        name: "description",
        content: "جهّز ذاكرة متجرك في صفحة واحدة واحصل على أول حزمة محتوى مخصصة للسوق السعودي.",
      },
      { property: "og:title", content: "Onboarding رِفد — صفحة واحدة" },
      {
        property: "og:description",
        content: "ذاكرة متجر مختصرة + أول Success Pack مترابط: نص، صورة، فكرة Reel، وCTA.",
      },
      { name: "twitter:title", content: "Onboarding رِفد — صفحة واحدة" },
      {
        name: "twitter:description",
        content: "ذاكرة متجر مختصرة + أول Success Pack مترابط: نص، صورة، فكرة Reel، وCTA.",
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

type OnboardingStage = "form";

function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return Promise.race<T>([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(`${label}-timeout`)), timeoutMs);
    }),
  ]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

function OnboardingPage() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [stage, setStage] = useState<OnboardingStage>("form");
  const [storeName, setStoreName] = useState("");
  const [productType, setProductType] = useState("dropshipping");
  const [audience, setAudience] = useState("young");
  const [tone, setTone] = useState("fun");
  const [color, setColor] = useState("#1a5d3e");
  const [generating, setGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("جاري تجهيز ذاكرة المتجر...");
  const [consents, setConsents] = useState<ConsentDialogValues>({
    email: true,
    whatsapp: false,
    productUpdates: true,
  });
  const trimmedStoreName = storeName.trim();

  // نسبة إنجاز ذاكرة المتجر — كل خطوة فعلية تُحسب لتعكس الجاهزية الحقيقية للحزمة الأولى.
  const completion = useMemo(() => {
    const checks = [
      trimmedStoreName.length > 0,
      Boolean(productType),
      Boolean(audience),
      Boolean(tone),
      Boolean(color),
      consents.email || consents.whatsapp || consents.productUpdates,
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }, [trimmedStoreName, productType, audience, tone, color, consents]);


  const handleConsentChange = (key: ConsentDialogKey, value: boolean) => {
    setConsents((prev) => ({ ...prev, [key]: value }));
  };

  const persistConsents = async (source: "onboarding") => {
    const pairs: Array<{ type: ConsentType; given: boolean }> = [
      { type: "marketing_email", given: consents.email },
      { type: "marketing_whatsapp", given: consents.whatsapp },
      { type: "product_updates", given: consents.productUpdates },
    ];
    const results = await Promise.allSettled(
      pairs.map((p) =>
        recordConsent({
          data: {
            consent_type: p.type,
            consent_given: p.given,
            source,
            metadata: { onboarding_step: "final" },
          },
        }),
      ),
    );
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      console.warn("[onboarding] consent persist partial failure", failed);
      toast.error("تعذّر حفظ بعض تفضيلات التواصل، تقدر تعدّلها من الإعدادات");
    }
  };

  const profilePayload = {
    email: user?.email ?? null,
    full_name: (user?.user_metadata?.full_name as string | undefined) ?? (user?.user_metadata?.name as string | undefined) ?? profile?.full_name ?? null,
    store_name: trimmedStoreName,
    product_type: productType,
    audience,
    tone,
    brand_color: color,
  };

  const baseProfilePayload = {
    email: user?.email ?? null,
    full_name: (user?.user_metadata?.full_name as string | undefined) ?? (user?.user_metadata?.name as string | undefined) ?? profile?.full_name ?? null,
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      void navigate({ to: "/auth", search: { redirect: "/onboarding" } });
      return;
    }
    if (profile?.onboarded && stage === "form") {
      void navigate({ to: "/dashboard" });
    }
    if (profile?.store_name) setStoreName(profile.store_name);
    if (profile?.product_type) setProductType(profile.product_type);
    if (profile?.audience) setAudience(profile.audience);
    if (profile?.tone) setTone(profile.tone);
    if (profile?.brand_color) setColor(profile.brand_color);
  }, [authLoading, user, profile, navigate, stage]);

  const finish = async () => {
    if (!user) return;
    setGenerating(true);
    setLoadingMessage("جاري حفظ بيانات المتجر...");
    const heroVariant = getRememberedAttribution("hero_hook");
    if (heroVariant) {
      void trackEvent("hero_hook", heroVariant, "submit");
    }

    try {
      const saveResult = await withTimeout(
        supabase
          .from("profiles")
          .upsert({
            id: user.id,
            ...profilePayload,
            onboarded: true,
          }),
        10000,
        "profile-save",
      );

      if (saveResult?.error) throw saveResult.error;
      track("onboarding_completed", { product_type: productType, audience });
      setLoadingMessage("نسجّل تفضيلات التواصل...");
      await withTimeout(persistConsents("onboarding"), 6000, "persist-consents").catch((consentError) => {
        console.warn("[onboarding] consent persist delayed/failed", consentError);
      });
      setLoadingMessage("تم حفظ البيانات — ننقلك الآن للوحة التحكم...");
      await withTimeout(refreshProfile(), 3500, "refresh-profile").catch((refreshError) => {
        console.warn("[onboarding] refresh before dashboard delayed", refreshError);
      });
      void navigate({ to: "/dashboard" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      console.warn("[onboarding] failed", message);
      toast.error("تعذّر إكمال الإعداد، حاول مرة أخرى");
    } finally {
      setGenerating(false);
    }
  };

  const skipToDashboard = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const optionalOnboardingPayload = trimmedStoreName
        ? profilePayload
        : baseProfilePayload;
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, ...optionalOnboardingPayload, onboarded: true });
      if (error) throw error;
      track("onboarding_skipped_pack", { product_type: productType, audience });
      await persistConsents("onboarding");
      await refreshProfile();
      void navigate({ to: "/dashboard" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      console.warn("[onboarding] skip failed", message);
      toast.error("تعذر حفظ الإعدادات الآن");
    } finally {
      setGenerating(false);
    }
  };

  if (authLoading) {
    return (
      <MarketingLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </MarketingLayout>
    );
  }

  if (!user) {
    return (
      <MarketingLayout>
        <main className="mx-auto flex min-h-[60vh] max-w-lg items-center px-4 py-12 text-center">
          <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-elegant sm:p-8">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <h1 className="mt-4 text-2xl font-black leading-tight">ابدأ الإعداد بعد تسجيل الدخول</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              نحفظ ذاكرة متجرك داخل حسابك حتى تظهر اقتراحات رِفد مخصصة لك في كل مرة.
            </p>
            <Button asChild className="mt-5 h-11 w-full gradient-primary font-extrabold text-primary-foreground">
              <Link to="/auth" search={{ redirect: "/onboarding" }}>تسجيل الدخول أو إنشاء حساب</Link>
            </Button>
          </div>
        </main>
      </MarketingLayout>
    );
  }

  return (
    <MarketingLayout>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
        {stage === "form" && (
          <>
            <div className="mb-5 text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-extrabold text-primary">
                <Zap className="h-3.5 w-3.5" />
                إعداد ذكي بدون احتكاك
              </span>
              <h1 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">
                جهّز ذاكرة متجرك وشاهد أول حزمة بيع جاهزة
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                صفحة واحدة تجمع أهم إشارات البيع: النشاط، الجمهور، النبرة والهوية — بدون طلب رقم الجوال مرة أخرى.
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
          {stage === "form" && !generating && (
            <div className="space-y-4">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                  <Sparkles className="h-3 w-3" /> أهلاً بك في رِفد
                </span>
                <h2 className="mt-3 text-2xl font-extrabold">بيانات قليلة، نتيجة أقرب للبيع</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  اكتب اسم النشاط واختر أقرب وصف له؛ رِفد يستخدمها لتوليد محتوى أقرب لطريقة شراء العميل السعودي.
                </p>
              </div>
              <div>
                <Label htmlFor="store">
                  اسم المتجر أو النشاط <span className="text-destructive">*</span>
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
                <Label>وش نوع نشاطك؟</Label>
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>من جمهورك المستهدف؟</Label>
                  <Select value={audience} onValueChange={setAudience}>
                    <SelectTrigger className="mt-2">
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
                </div>
                <div>
                  <Label htmlFor="color">لون الهوية</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      id="color"
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded-md border border-input bg-background"
                    />
                    <Input value={color} onChange={(e) => setColor(e.target.value)} className="font-mono" />
                  </div>
                </div>
              </div>
              <div>
                <Label>النبرة الأقرب لعلامتك</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {TONES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTone(t.id)}
                      className={cn(
                        "rounded-lg border p-3 text-sm font-medium",
                        tone === t.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <ConsentDialog values={consents} onChange={handleConsentChange} disabled={generating} />
              <Button
                onClick={finish}
                disabled={!trimmedStoreName || generating}
                className="h-12 w-full gradient-primary font-extrabold text-primary-foreground"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> جاري بناء الحزمة البيعية...
                  </>
                ) : (
                  <>أنشئ أول حزمة بيع ✨</>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => void skipToDashboard()}
                disabled={generating}
                className="h-10 w-full font-bold text-muted-foreground"
              >
                تخطي الآن والدخول للوحة
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
          {stage === "form" && generating && (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Loader2 className="h-7 w-7 animate-spin" />
              </span>
              <div>
                <h3 className="text-lg font-extrabold">لا تغلق الصفحة — نجهّز أول حزمة بيع</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{loadingMessage}</p>
              </div>
              <Button type="button" variant="outline" onClick={() => void skipToDashboard()} className="h-10 font-bold">
                الدخول للوحة بدون انتظار
              </Button>
            </div>
          )}
        </div>
      </div>
    </MarketingLayout>
  );
}
