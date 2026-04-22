import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, Moon, Sun, Sparkles, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "الرئيسية" },
  { to: "/proof-center", label: "مركز الإثبات" },
  { to: "/library", label: "المكتبة" },
  { to: "/business-solutions", label: "رِفد للأعمال" },
  { to: "/vs-chatgpt", label: "vs ChatGPT" },
  { to: "/pricing", label: "الأسعار" },
  { to: "/about", label: "من نحن" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { user, loading } = useAuth();
  const isAuthed = !loading && !!user;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
          <Link to="/" className="flex min-w-0 items-center gap-2 font-bold">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-elegant sm:h-11 sm:w-11">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
          </span>
          <span className="text-lg font-extrabold sm:text-xl">
            رِفد <span className="text-xs font-medium text-muted-foreground">للأعمال</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="تبديل الوضع"
            className="hidden sm:inline-flex"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {isAuthed ? (
            <Button asChild size="sm" className="hidden md:inline-flex shadow-elegant gap-2">
              <Link to="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                لوحة التحكم
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden lg:inline-flex">
                <Link to="/auth">تسجيل دخول</Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:inline-flex shadow-elegant">
                <Link to="/onboarding">ابدأ مجاناً</Link>
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="القائمة"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "border-t border-border md:hidden",
          open ? "block" : "hidden"
        )}
      >
        <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-2 flex gap-2 border-t border-border pt-3">
            {isAuthed ? (
              <Button asChild size="sm" className="flex-1">
                <Link to="/dashboard" onClick={() => setOpen(false)}>لوحة التحكم</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link to="/auth" onClick={() => setOpen(false)}>تسجيل دخول</Link>
                </Button>
                <Button asChild size="sm" className="flex-1">
                  <Link to="/onboarding" onClick={() => setOpen(false)}>ابدأ مجاناً</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
