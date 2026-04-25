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
import { redirect, useNavigate, type ParsedLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { ShieldAlert, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_AUTH_TIMEOUT_MS = 3_500;

function authTimeout() {
  return new Promise<null>((resolve) => {
    window.setTimeout(() => resolve(null), ADMIN_AUTH_TIMEOUT_MS);
  });
}

export async function adminBeforeLoad({ location }: { location: ParsedLocation }) {
  if (typeof window === "undefined") return;
  const session = await Promise.race([
    supabase.auth.getSession().then(({ data }) => data.session).catch(() => null),
    authTimeout(),
  ]);

  if (!session) {
    throw redirect({ to: "/auth", search: { redirect: location.href } });
  }

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", session.user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (error || data?.role !== "admin") {
    throw redirect({ to: "/dashboard" });
  }
}

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
      const redirectPath = window.location.pathname + window.location.search + window.location.hash;
      void navigate({ to: "/auth", search: { redirect: redirectPath } as never });
      return;
    }
    if (isAdmin === false) {
      void navigate({ to: "/dashboard" });
    }
  }, [user, isAdmin, loading, navigate]);

  // ---- حالة التحميل ----
  if (loading || (!user && isAdmin === null)) {
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
