import { useEffect } from "react";
import {
  createFileRoute,
  Outlet,
  Link,
  useRouter,
  useNavigate,
  redirect,
} from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({
  /**
   * Auth guard مُحسَّن — يعمل قبل أي render.
   * يمنع flash of protected content للزوّار غير المسجّلين.
   *
   * - يعمل في المتصفح (TanStack يستدعي beforeLoad على الـ client أيضاً)
   * - SSR-safe: لا يفحص الجلسة على السيرفر (Supabase session في localStorage)
   * - لا يفحص onboarding هنا — يبقى client-side لأنه يعتمد على بيانات profile
   */
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/auth" });
    }
  },
  component: DashboardLayout,
  errorComponent: DashboardError,
  notFoundComponent: DashboardNotFound,
  pendingComponent: DashboardPending,
});

function DashboardLayout() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  // Onboarding redirect — client-side فقط (يعتمد على بيانات profile).
  // الجلسة نفسها مفحوصة في beforeLoad أعلاه.
  useEffect(() => {
    if (loading) return;
    if (!user) {
      // حماية إضافية لو فات beforeLoad (مثلاً جلسة انتهت بعد التحميل)
      void navigate({ to: "/auth" });
      return;
    }
    if (!profile) return;
    const needsOnboarding = !profile.onboarded || !profile.whatsapp;
    if (needsOnboarding) {
      void navigate({ to: "/onboarding" });
    }
  }, [loading, user, profile, navigate]);

  return <Outlet />;
}

function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  // SECURITY: لا نعرض error.message للمستخدم في الإنتاج لتفادي تسريب
  // أسماء جداول/سياسات RLS/شظايا SQL أو أي معلومات تشخيصية حساسة.
  // في وضع التطوير فقط نعرض التفاصيل لتسهيل الـdebugging.
  const isDev = import.meta.env.DEV;
  return (
    <DashboardShell>
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-destructive/10 p-4">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-extrabold">حدث خطأ غير متوقّع</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          تعذّر تحميل هذه الصفحة. حاول مجدداً، وإن استمرّت المشكلة تواصل معنا.
        </p>
        {isDev && error.message && (
          <pre className="mt-2 max-h-40 max-w-md overflow-auto rounded-md bg-muted p-3 text-left font-mono text-xs text-destructive">
            {error.message}
          </pre>
        )}
        <div className="flex gap-2">
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            حاول مجدداً
          </Button>
          <Button variant="outline" asChild>
            <Link to="/dashboard">العودة للوحة</Link>
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}

function DashboardNotFound() {
  return (
    <DashboardShell>
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-xl font-extrabold">الصفحة غير موجودة</h2>
        <p className="text-sm text-muted-foreground">
          الرابط الذي وصلت إليه غير صحيح أو تمّ نقله.
        </p>
        <Button asChild>
          <Link to="/dashboard">الرجوع للوحة التحكم</Link>
        </Button>
      </div>
    </DashboardShell>
  );
}

function DashboardPending() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-64" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    </div>
  );
}
