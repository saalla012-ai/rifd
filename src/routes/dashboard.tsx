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
  return (
    <DashboardShell>
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-destructive/10 p-4">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-extrabold">حدث خطأ غير متوقّع</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {error.message || "تعذّر تحميل هذه الصفحة. حاول مجدداً، وإن استمرّت المشكلة تواصل معنا."}
        </p>
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
    <DashboardShell>
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </DashboardShell>
  );
}
