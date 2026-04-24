/**
 * AdminGuard — حارس موحّد لجميع صفحات /admin/*
 *
 * يعتمد على `useAuth().isAdmin` المركزي (يُحمَّل مرة واحدة لكل جلسة)
 * بدلاً من تكرار استعلامات user_roles في كل صفحة.
 *
 * ⚠️ هذا الحارس واجهة فقط — الحماية الحقيقية على الـserver functions
 * عبر `requireSupabaseAuth + assertAdmin`. الهدف هنا منع flicker وتجربة
 * مستخدم نظيفة + إعادة توجيه فورية للمستخدمين غير المخوّلين.
 */

import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { ShieldAlert, Loader2 } from "lucide-react";

interface AdminGuardProps {
  children: ReactNode;
  /** عنوان الصفحة لعرضه في رأس شاشة التحميل (اختياري) */
  loadingLabel?: string;
}

export function AdminGuard({ children, loadingLabel }: AdminGuardProps) {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || isAdmin === null) return;
    if (!user) {
      void navigate({ to: "/auth", search: { redirect: window.location.pathname } as never });
      return;
    }
    if (isAdmin === false) {
      void navigate({ to: "/dashboard" });
    }
  }, [user, isAdmin, loading, navigate]);

  // ---- حالة التحميل ----
  if (loading || isAdmin === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {loadingLabel ?? "جاري التحقق من الصلاحيات…"}
          </p>
        </div>
      </div>
    );
  }

  // ---- مستخدم غير مخوَّل ----
  if (!user || isAdmin === false) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-destructive" />
          <h2 className="mb-2 text-lg font-bold text-foreground">
            صلاحية غير كافية
          </h2>
          <p className="text-sm text-muted-foreground">
            هذه الصفحة متاحة لمسؤولي المنصة فقط. ستتم إعادة توجيهك…
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
