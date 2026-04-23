import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const STORAGE_KEY = "rifd-cookie-consent-v1";

type Consent = "accepted" | "rejected";

function readConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "accepted" || v === "rejected" ? v : null;
  } catch {
    return null;
  }
}

function writeConsent(value: Consent) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
  }
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (readConsent() === null) {
      const t = window.setTimeout(() => setVisible(true), 600);
      return () => window.clearTimeout(t);
    }
  }, []);

  if (!visible) return null;

  const accept = () => {
    writeConsent("accepted");
    setVisible(false);
  };

  const reject = () => {
    writeConsent("rejected");
    setVisible(false);
  };

  return (
      <div
        role="dialog"
        aria-live="polite"
        aria-label="إشعار ملفات تعريف الارتباط"
        className="fixed inset-x-0 bottom-16 z-[60] px-3 pb-3 sm:bottom-4 sm:px-6 sm:pb-0 lg:start-auto lg:end-6 lg:w-full lg:max-w-[30rem] lg:px-0"
      >
      <div className="mx-auto flex max-w-3xl flex-col gap-2 rounded-2xl border border-border bg-background/95 p-3 shadow-2xl backdrop-blur-md sm:flex-row sm:items-center sm:gap-4 sm:p-5 lg:mx-0 lg:flex-col lg:items-start">
        <button
          type="button"
          onClick={reject}
          aria-label="إغلاق ورفض"
          className="absolute end-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex-1 pe-8 text-xs leading-6 text-muted-foreground sm:pe-0 sm:text-sm sm:leading-relaxed">
          <span className="sm:hidden">نستخدم ملفات أساسية للتشغيل وأخرى اختيارية لتحسين الأداء. اطّلع على </span>
          <span className="hidden sm:inline">نستخدم ملفات تعريف الارتباط الأساسية لتشغيل الموقع، وملفات اختيارية لتحسين التجربة وتحليل الأداء. اطّلع على </span>
          <Link to="/legal/privacy" className="font-medium text-primary underline-offset-4 hover:underline">
            سياسة الخصوصية
          </Link>
          .
        </div>
        <div className="flex shrink-0 items-center gap-2 lg:w-full lg:justify-start">
          <Button variant="ghost" size="sm" onClick={reject} className="h-9 px-3 text-muted-foreground">
            رفض
          </Button>
          <Button size="sm" onClick={accept} className="h-9 px-3">
            موافق
          </Button>
        </div>
      </div>
    </div>
  );
}
