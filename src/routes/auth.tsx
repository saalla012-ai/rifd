import { useEffect, useState } from "react";
import { createFileRoute, Link, useLocation, useNavigate, useSearch } from "@tanstack/react-router";
import { Sparkles, Mail, Lock, User, Loader2, MessageCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { MarketingLayout } from "@/components/marketing-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics/posthog";
import {
  normalizeSaudiPhone,
  validateSaudiPhone,
  SAUDI_PHONE_ERROR,
  SAUDI_PHONE_PLACEHOLDER,
} from "@/lib/phone";

function sanitizeRedirectPath(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  if (!value.startsWith("/") || value.startsWith("//")) return undefined;
  if (value.includes("://")) return undefined;
  return value;
}

const PENDING_SIGNUP_PHONE_KEY = "rifd_pending_signup_whatsapp";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — رِفد للتقنية" },
      { name: "description", content: "ادخل حسابك في رِفد أو سجّل جديداً لتجهيز أول حزمة محتوى سعودية لمتجرك: منشور، صورة، وفكرة فيديو." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const redirect = sanitizeRedirectPath(search.redirect);
    return redirect ? { redirect } : {};
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const search = useSearch({ from: "/auth" });
  const redirectPath = search.redirect ?? "/dashboard";
  const onboardingIntent =
    redirectPath === "/onboarding" ||
    location.searchStr.includes("redirect=/onboarding") ||
    location.searchStr.includes("redirect=%2Fonboarding");
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(onboardingIntent ? "signup" : "login");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const whatsappTouched = whatsapp.trim().length > 0;
  const whatsappValid = validateSaudiPhone(whatsapp);

  useEffect(() => {
    if (onboardingIntent) setMode("signup");
  }, [onboardingIntent]);

  // إذا المستخدم مسجل دخول، حوّله مباشرة
  useEffect(() => {
    if (authLoading) return;
    if (user) {
      const pendingWhatsapp = window.localStorage.getItem(PENDING_SIGNUP_PHONE_KEY);
      if (pendingWhatsapp && !profile?.whatsapp) {
        window.localStorage.removeItem(PENDING_SIGNUP_PHONE_KEY);
        void supabase
          .from("profiles")
          .update({ whatsapp: pendingWhatsapp })
          .eq("id", user.id)
          .then(() => void refreshProfile());
      }
      if (profile && !profile.onboarded) {
        void navigate({ to: "/onboarding" });
      } else if (`${location.pathname}${location.searchStr}${location.hash}` !== redirectPath) {
        void navigate({ to: redirectPath as never });
      }
    }
  }, [authLoading, user, profile, refreshProfile, navigate, redirectPath, location.pathname, location.searchStr, location.hash]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (mode === "signup") {
        const normalizedWhatsapp = normalizeSaudiPhone(whatsapp);
        if (!normalizedWhatsapp) {
          toast.error(SAUDI_PHONE_ERROR);
          setSubmitting(false);
          return;
        }
        window.localStorage.setItem(PENDING_SIGNUP_PHONE_KEY, normalizedWhatsapp);
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`,
            data: { full_name: name.trim() },
          },
        });
        if (error) throw error;
        track("signup_completed", { method: "email" });
        toast.success("تم إنشاء حسابك! جاري التحويل...");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        toast.success("أهلاً بعودتك 👋");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
      // ترجمات سعودية ودودة لرسائل Supabase الشائعة
      if (msg.includes("Invalid login credentials")) {
        toast.error("البريد أو كلمة السر غير صحيحة");
      } else if (msg.includes("already registered") || msg.includes("User already")) {
        toast.error("هذا البريد مسجّل مسبقاً — جرّب تسجيل الدخول");
      } else if (msg.toLowerCase().includes("password")) {
        toast.error("كلمة السر ضعيفة — استخدم 8 أحرف على الأقل");
      } else {
        console.warn("[auth] handled auth error", msg);
        toast.error("تعذر إكمال العملية الآن. حاول مرة أخرى أو تواصل مع الدعم.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      if (mode === "signup") {
        const normalizedWhatsapp = normalizeSaudiPhone(whatsapp);
        if (!normalizedWhatsapp) {
          toast.error(SAUDI_PHONE_ERROR);
          setGoogleLoading(false);
          return;
        }
        window.localStorage.setItem(PENDING_SIGNUP_PHONE_KEY, normalizedWhatsapp);
      }
      const authReturnPath = redirectPath === "/dashboard"
        ? "/auth"
        : `/auth?redirect=${encodeURIComponent(redirectPath)}`;
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}${authReturnPath}`,
      });
      if (result.error) {
        console.warn("[auth] google oauth rejected", result.error.message);
        toast.error("فشل الاتصال بـGoogle. حاول مرة أخرى بعد قليل.");
        setGoogleLoading(false);
        return;
      }
      // إذا redirected = true، المتصفح بيتحول لGoogle تلقائياً
      // إذا رجعت tokens، الجلسة بتنحفظ والـuseEffect أعلاه يحوّل للوجهة الصحيحة
    } catch (err) {
      console.warn("[auth] google oauth error", err);
      toast.error("فشل الاتصال بـGoogle. حاول مرة أخرى بعد قليل.");
      setGoogleLoading(false);
    }
  };

  return (
    <MarketingLayout>
      <div className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-md items-center px-4 py-10">
        <div className="w-full rounded-2xl border border-border bg-card p-7 shadow-elegant">
          <div className="mb-6 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-elegant">
              <Sparkles className="h-6 w-6" />
            </span>
              <h1 className="mt-4 text-2xl font-extrabold">
                {mode === "login" ? "أهلاً بعودتك" : "ابدأ مجاناً مع رِفد"}
            </h1>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {mode === "login"
                ? "ادخل لمتابعة توليد المحتوى لمتجرك"
                  : "أنشئ حسابك ثم جهّز أول حزمة محتوى لمتجرك بالعامية السعودية: منشور، صورة، وفكرة فيديو"}
            </p>
          </div>

          <div className="mb-5 flex rounded-lg border border-border bg-secondary p-1">
            <button
              onClick={() => setMode("login")}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium",
                mode === "login" ? "bg-background text-foreground shadow-soft" : "text-muted-foreground"
              )}
            >
              دخول
            </button>
            <button
              onClick={() => setMode("signup")}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium",
                mode === "signup" ? "bg-background text-foreground shadow-soft" : "text-muted-foreground"
              )}
            >
              تسجيل جديد
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogle}
            disabled={googleLoading || submitting}
            className="w-full gap-2"
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            متابعة بحساب Google
          </Button>

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            أو
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <Label htmlFor="name">الاسم الكامل</Label>
                  <div className="relative mt-1">
                    <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثلاً: أحمد العتيبي"
                      required
                      className="pr-10"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="whatsapp">رقم الجوال للواتساب</Label>
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-extrabold text-success">
                      بدون OTP
                    </span>
                  </div>
                  <div
                    className={cn(
                      "mt-1 flex min-h-11 items-center overflow-hidden rounded-lg border bg-background shadow-sm transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring",
                      whatsappTouched && !whatsappValid ? "border-destructive" : "border-input",
                    )}
                  >
                    <div className="flex h-11 shrink-0 items-center gap-2 border-l border-border bg-secondary px-3 text-sm font-extrabold text-foreground">
                      <MessageCircle className="h-4 w-4 text-success" />
                      <span dir="ltr">+966</span>
                    </div>
                    <Input
                      id="whatsapp"
                      dir="ltr"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder={SAUDI_PHONE_PLACEHOLDER}
                      required
                      maxLength={20}
                      inputMode="tel"
                      autoComplete="tel"
                      aria-invalid={whatsappTouched && !whatsappValid}
                      className="h-11 border-0 bg-transparent px-3 text-left font-bold shadow-none focus-visible:ring-0"
                    />
                  </div>
                  <div className="mt-2 flex items-start gap-2 text-xs leading-5">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                    <p className={cn("text-muted-foreground", whatsappTouched && !whatsappValid && "text-destructive")}>
                      {whatsappTouched && !whatsappValid ? SAUDI_PHONE_ERROR : "مطلوب فقط للتواصل الخاص بتجهيز الحساب."}
                    </p>
                  </div>
                </div>
              </>
            )}
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative mt-1">
                <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="pr-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="password">كلمة السر</Label>
              <div className="relative mt-1">
                <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  className="pr-10"
                />
              </div>
              <div className="mt-1 flex items-center justify-between">
                {mode === "signup" ? (
                  <p className="text-xs text-muted-foreground">8 أحرف على الأقل</p>
                ) : (
                  <span />
                )}
                {mode === "login" && (
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary hover:underline"
                  >
                    نسيت كلمة السر؟
                  </Link>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting || googleLoading || (mode === "signup" && !whatsappValid)}
              className="w-full gradient-primary text-primary-foreground shadow-elegant"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> جاري التنفيذ...
                </>
              ) : mode === "login" ? (
                "ادخل لحسابي"
              ) : (
                "أنشئ حسابي مجاناً"
              )}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            بإنشائك للحساب توافق على{" "}
            <Link to="/legal/terms" className="text-primary hover:underline">
              الشروط
            </Link>{" "}
            و{" "}
            <Link to="/legal/privacy" className="text-primary hover:underline">
              الخصوصية
            </Link>
          </p>
        </div>
      </div>
    </MarketingLayout>
  );
}
