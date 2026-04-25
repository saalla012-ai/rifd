import { ReactNode, useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  LayoutDashboard,
  Wand2,
  Image as ImageIcon,
  Clapperboard,
  ImagePlus,
  Library,
  LayoutGrid,
  Megaphone,
  Store,
  BarChart3,
  CreditCard,
  Settings,
  Sparkles,
  LogOut,
  Loader2,
  ShieldCheck,
  TrendingUp,
  Mail,
  Inbox,
  Coins,
  Database,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { getNewContactCount } from "@/server/admin-contact-submissions";
import { CreditsBar } from "@/components/credits-bar";

const NAV = [
  { to: "/dashboard", label: "نظرة عامة", icon: LayoutDashboard },
  { to: "/dashboard/generate-text", label: "توليد نص", icon: Wand2 },
  { to: "/dashboard/generate-image", label: "توليد صور", icon: ImageIcon },
  { to: "/dashboard/generate-video", label: "توليد فيديو", icon: Clapperboard },
  { to: "/dashboard/campaign-studio", label: "استوديو الحملات", icon: Megaphone },
  { to: "/dashboard/edit-image", label: "تعديل صور", icon: ImagePlus },
  { to: "/dashboard/templates", label: "معرض القوالب", icon: LayoutGrid },
  { to: "/dashboard/library", label: "مكتبتي", icon: Library },
  { to: "/dashboard/store-profile", label: "ملف متجري", icon: Store },
  { to: "/dashboard/usage", label: "الاستخدام", icon: BarChart3 },
  { to: "/dashboard/credits", label: "شحن نقاط الفيديو", icon: Coins },
  { to: "/dashboard/billing", label: "الفواتير", icon: CreditCard },
  { to: "/dashboard/settings", label: "الإعدادات", icon: Settings },
] as const;

const ADMIN_NAV = [
  { to: "/admin/analytics", label: "تحليلات الأدمن", icon: TrendingUp },
  { to: "/admin/subscriptions", label: "إدارة الاشتراكات", icon: ShieldCheck },
  { to: "/admin/video-jobs", label: "إدارة الفيديو", icon: Video },
  { to: "/admin/credits", label: "شحن نقاط الفيديو", icon: Coins },
  { to: "/admin/credit-ledger", label: "دفتر نقاط الفيديو", icon: BarChart3 },
  { to: "/admin/reconcile", label: "مزامنة الاستخدام", icon: Database },
  { to: "/admin/contact-submissions", label: "رسائل التواصل", icon: Inbox, badgeKey: "contact" as const },
  { to: "/admin/email-monitor", label: "مراقبة البريد", icon: Mail },
] as const;

export function DashboardShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user, profile, loading, isAdmin, signOut } = useAuth();
  const fetchNewContacts = useServerFn(getNewContactCount);
  const [newContactCount, setNewContactCount] = useState(0);

  // حماية: غير المسجلين يُحوَّلون إلى /auth
  useEffect(() => {
    if (!loading && !user) {
      void navigate({ to: "/auth" });
    }
  }, [loading, user, navigate]);

  // عدّاد رسائل التواصل الجديدة (للأدمن فقط)
  useEffect(() => {
    if (!isAdmin) return;
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetchNewContacts({});
        if (alive) setNewContactCount(r.count);
      } catch {
        // silent
      }
    };
    void tick();
    const id = setInterval(tick, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [isAdmin, fetchNewContacts]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("تم تسجيل الخروج");
      void navigate({ to: "/" });
    } catch {
      toast.error("فشل تسجيل الخروج");
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = profile?.full_name || profile?.store_name || user.email?.split("@")[0] || "مستخدم";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-l border-sidebar-border bg-sidebar md:flex">
        <Link to="/" className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4 font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span>رِفد</span>
        </Link>

        <div className="border-b border-sidebar-border px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary text-sm font-bold text-primary-foreground">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
              activeOptions={{ exact: item.to === "/dashboard" }}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <>
              <div className="mt-4 mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-gold/80">
                الإدارة
              </div>
              {ADMIN_NAV.map((item) => {
                const showBadge =
                  "badgeKey" in item && item.badgeKey === "contact" && newContactCount > 0;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gold hover:bg-gold/10"
                    activeProps={{ className: "bg-gold/15 text-gold" }}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1">{item.label}</span>
                    {showBadge && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                        {newContactCount > 99 ? "99+" : newContactCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </>
          )}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <div className="flex-1 overflow-x-hidden">
        {/* Desktop top bar — يحوي شريط الرصيد */}
        <header className="sticky top-0 z-10 hidden border-b border-border bg-background/80 backdrop-blur md:block">
          <div className="flex items-center justify-end gap-3 px-6 py-3">
            <CreditsBar />
          </div>
        </header>

        {/* Mobile top bar */}
        <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur md:hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-3">
            <Link to="/" className="flex items-center gap-2 font-bold">
              <Sparkles className="h-4 w-4 text-primary" /> رِفد
            </Link>
            <div className="flex items-center gap-2">
              <CreditsBar />
              <button
                onClick={handleLogout}
                aria-label="تسجيل الخروج"
                className="rounded-md p-2 text-muted-foreground hover:bg-secondary"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-border px-2 py-2">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="shrink-0 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary"
                activeProps={{ className: "bg-secondary text-foreground" }}
                activeOptions={{ exact: item.to === "/dashboard" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
