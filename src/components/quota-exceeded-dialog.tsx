/**
 * Friendly upgrade dialog shown when a user hits their plan quota.
 * Detects "وصلت حدّ" or "متاح في الباقة الاحترافية" Arabic patterns
 * thrown by the AI server functions and converts the toast into a
 * call-to-action that routes the user to /dashboard/billing.
 */

import { Link } from "@tanstack/react-router";
import { Crown, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** "نص" أو "صورة" — للسياق في النص */
  kind: "نص" | "صورة";
  /** رسالة الخطأ الأصلية من السيرفر (اختيارية للعرض) */
  reason?: string;
};

/**
 * Returns true when the given error message indicates a plan-quota limit
 * thrown by the server (Arabic). Used by callers to decide whether to
 * open the dialog instead of showing a regular toast.
 */
export function isQuotaError(message: string): boolean {
  return (
    message.includes("وصلت حدّ") ||
    message.includes("الباقة الاحترافية فقط") ||
    message.includes("رقّ باقتك")
  );
}

export function QuotaExceededDialog({ open, onOpenChange, kind, reason }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        {/* Top gradient banner */}
        <div className="relative gradient-primary px-6 pb-6 pt-8 text-center text-primary-foreground">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute left-3 top-3 rounded-full p-1 opacity-70 transition hover:opacity-100"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-foreground/15 backdrop-blur">
            <Crown className="h-7 w-7" />
          </div>
          <DialogTitle className="text-xl font-extrabold">
            وصلت حدّ باقتك المجانية
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-primary-foreground/90">
            {kind === "صورة"
              ? "توليد الصور الاحترافية متاح فقط في الباقات المدفوعة"
              : `استنفدت توليدات ${kind} هذا الشهر`}
          </DialogDescription>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 pt-5">
          {reason && (
            <div className="mb-4 rounded-lg bg-secondary/60 p-3 text-center text-xs text-muted-foreground">
              {reason}
            </div>
          )}

          <ul className="space-y-2.5 text-sm">
            <BenefitRow text="200 توليدة نصية شهرياً + 60 صورة احترافية" />
            <BenefitRow text="نموذج Gemini Pro للجودة العالية" />
            <BenefitRow text="مكتبة قوالب كاملة + حفظ المفضلة" />
            <BenefitRow text="دعم واتساب مباشر مع المالك" />
          </ul>

          <div className="mt-5 rounded-lg border border-gold/30 bg-gold/5 p-3 text-center">
            <p className="text-xs font-bold text-gold">
              🔥 عرض المؤسسين: خصم 30% للأعضاء الـ 50 الأوائل
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <Button
              asChild
              className="w-full gradient-primary text-primary-foreground shadow-elegant"
              onClick={() => onOpenChange(false)}
            >
              <Link to="/dashboard/billing">
                <Sparkles className="h-4 w-4" />
                احجز مقعدك الآن
              </Link>
            </Button>
            <button
              onClick={() => onOpenChange(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              لاحقاً
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BenefitRow({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2 text-foreground">
      <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-success/15 text-[10px] text-success">
        ✓
      </span>
      <span>{text}</span>
    </li>
  );
}
