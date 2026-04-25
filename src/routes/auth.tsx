import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Sparkles, Mail, Lock, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MarketingLayout } from "@/components/marketing-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { sendWelcomeEmail } from "@/server/send-welcome";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics/posthog";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — رِفد للتقنية" },
      { name: "description", content: "ادخل حسابك في رِفد أو سجّل جديداً لتجربة توليد محتوى متجرك ضمن حدود بداية واضحة وبدون بطاقة." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => (
    typeof search.redirect === "string" && search.redirect.startsWith("/")
      ? { redirect: search.redirect }
      : {}
  ),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const { user, profile, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // إذا المستخدم مسجل دخول، حوّله مباشرة
  useEffect(() => {
    if (authLoading) return;
    if (user) {
      // أرسل welcome مرة واحدة لكل user (idempotent عبر message_id في الخادم)
      // يغطي Google OAuth + email/password + أي تدفق مستقبلي
      if (user.email) {
        // الخادم يشتقّ userId+email من JWT الموثوق — نمرّر فقط fullName.
        void sendWelcomeEmail({
          data: {
            fullName:
              (user.user_metadata?.full_name as string | undefined) ||
              (user.user_metadata?.name as string | undefined) ||
              undefined,
          },
        }).catch((e) => console.error("welcome trigger failed", e));
      }
      if (profile && !profile.onboarded) {
        void navigate({ to: "/onboarding" });
      } else {
        void navigate({ to: (search.redirect ?? "/dashboard") as never });
      }
    }
  }, [authLoading, user, profile, navigate, search.redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (mode === "signup") {
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
        // welcome سيُرسل تلقائياً من useEffect عند تحديث user
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
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
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
              {mode === "login" ? "أهلاً بعودتك" : "أنشئ حسابك في ثوانٍ"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "login"
                ? "ادخل لمتابعة توليد المحتوى لمتجرك"
                : "جرّب رِفد بحدود بداية واضحة، بدون بطاقة"}
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
              disabled={submitting || googleLoading}
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
