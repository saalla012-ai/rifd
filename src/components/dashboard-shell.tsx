import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Wand2,
  Image as ImageIcon,
  Library,
  Store,
  BarChart3,
  CreditCard,
  Settings,
  Sparkles,
  LogOut,
} from "lucide-react";

const NAV = [
  { to: "/dashboard", label: "نظرة عامة", icon: LayoutDashboard },
  { to: "/dashboard/generate-text", label: "توليد نص", icon: Wand2 },
  { to: "/dashboard/generate-image", label: "توليد صور", icon: ImageIcon },
  { to: "/dashboard/library", label: "مكتبتي", icon: Library },
  { to: "/dashboard/store-profile", label: "ملف متجري", icon: Store },
  { to: "/dashboard/usage", label: "الاستخدام", icon: BarChart3 },
  { to: "/dashboard/billing", label: "الفواتير", icon: CreditCard },
  { to: "/dashboard/settings", label: "الإعدادات", icon: Settings },
] as const;

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-l border-sidebar-border bg-sidebar md:flex">
        <Link to="/" className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4 font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span>رِفد</span>
        </Link>
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
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </Link>
        </div>
      </aside>

      <div className="flex-1 overflow-x-hidden">
        <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Link to="/" className="flex items-center gap-2 font-bold">
              <Sparkles className="h-4 w-4 text-primary" /> رِفد
            </Link>
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
