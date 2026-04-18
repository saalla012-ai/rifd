import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Mail, Lock, User } from "lucide-react";
import { MarketingLayout } from "@/components/marketing-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — رِفد للتقنية" },
      { name: "description", content: "ادخل حسابك في رِفد أو سجّل جديد للبدء بـ5 توليدات مجانية." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");

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
                : "5 توليدات نص + 2 صورة مجاناً، بدون بطاقة"}
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

          <form
            onSubmit={(e) => {
              e.preventDefault();
              // الموجة 2: ربط Cloud Auth
              window.location.href = "/onboarding";
            }}
            className="space-y-4"
          >
            {mode === "signup" && (
              <div>
                <Label htmlFor="name">الاسم الكامل</Label>
                <div className="relative mt-1">
                  <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="name" placeholder="مثلاً: أحمد العتيبي" required className="pr-10" />
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative mt-1">
                <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" required className="pr-10" />
              </div>
            </div>
            <div>
              <Label htmlFor="password">كلمة السر</Label>
              <div className="relative mt-1">
                <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" required minLength={8} placeholder="••••••••" className="pr-10" />
              </div>
            </div>

            <Button type="submit" className="w-full gradient-primary text-primary-foreground shadow-elegant">
              {mode === "login" ? "ادخل لحسابي" : "أنشئ حسابي مجاناً"}
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

          <div className="mt-4 rounded-lg bg-secondary/60 p-3 text-center text-xs text-muted-foreground">
            🔒 ربط الحسابات الفعلي يصير جاهز في الموجة القادمة
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
