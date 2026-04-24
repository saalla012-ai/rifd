/**
 * نافذة موحَّدة للأخطاء عند نفاد الحصة/الرصيد.
 * تُميّز بين 3 حالات:
 *   1) text_quota_exceeded — استنفدت 200 توليدة نص يومية → CTA: ارجع غداً + ترقية
 *   2) insufficient_credits — رصيد النقاط لا يكفي → CTA: شحن /dashboard/credits
 *   3) plan_quota (legacy) — حد شهري في باقة قديمة → CTA: ترقية /dashboard/billing
 */

import { Link } from "@tanstack/react-router";
import { Crown, Sparkles, X, Coins, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export type QuotaErrorKind = "text_quota" | "insufficient_credits" | "plan_quota" | "unknown";

export function detectQuotaError(message: string): QuotaErrorKind | null {
  if (!message) return null;
  const m = message.toLowerCase();

  // كودات السيرفر (credits.ts + RPC)
  if (/text_quota_exceeded/i.test(message)) return "text_quota";
  if (/insufficient_credits/i.test(message)) return "insufficient_credits";
  // quota_exceeded من enforce_generation_quota trigger (legacy)
  if (/quota_exceeded:\s*plan=.*kind=text/i.test(message)) return "text_quota";
  if (/quota_exceeded:\s*plan=.*kind=image/i.test(message)) return "plan_quota";

  // أنماط عربية قديمة
  if (
    message.includes("استنفدت توليدات النص") ||
    message.includes("الحصة اليومية") ||
    message.includes("نفدت حصة النصوص") ||
    message.includes("حد النصوص اليومي")
  ) {
    return "text_quota";
  }
  if (
    message.includes("رصيد النقاط لا يكفي") ||
    message.includes("النقاط غير كافية") ||
    (m.includes("لا يكفي") && (m.includes("نقاط") || m.includes("نقطة"))) ||
    message.includes("نقاطك")
  ) {
    return "insufficient_credits";
  }
  if (
    message.includes("وصلت حدّ") ||
    message.includes("وصلت حد") ||
    message.includes("الباقة الاحترافية فقط") ||
    message.includes("رقّ باقتك") ||
    message.includes("رقي باقتك")
  ) {
    return "plan_quota";
  }
  return null;
}

/** للحفاظ على التوافق مع الاستدعاءات القديمة */
export function isQuotaError(message: string): boolean {
  return detectQuotaError(message) !== null;
}

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** نوع التوليد للسياق */
  kind: "نص" | "صورة";
  /** رسالة الخطأ الأصلية من السيرفر */
  reason?: string;
};

type Variant = {
  icon: typeof Crown;
  title: string;
  subtitle: string;
  badge: string;
  cta: { label: string; to: "/dashboard/credits" | "/dashboard/billing" };
  benefits: string[];
};

function getVariant(kindOfError: QuotaErrorKind, generationKind: "نص" | "صورة"): Variant {
  if (kindOfError === "text_quota") {
    return {
      icon: Clock,
      title: "وصلت حدّك اليومي للنصوص",
      subtitle: "200 توليدة نصية / يوم — يتجدّد العدّاد تلقائياً عند منتصف الليل (توقيت الرياض)",
      badge: "💡 احفظ القوالب المفضّلة في مكتبتك لاستخدامها لاحقاً",
      cta: { label: "ترقية لباقة أعلى (حدود أكبر)", to: "/dashboard/billing" },
      benefits: [
        "200 توليدة نصية يومياً (كل الباقات)",
        "صور احترافية بنماذج Flash + Pro",
        "مكتبة قوالب موسّعة + حفظ المفضّلة",
        "دعم واتساب مباشر",
      ],
    };
  }

  if (kindOfError === "insufficient_credits") {
    return {
      icon: Coins,
      title: "رصيد النقاط لا يكفي",
      subtitle:
        generationKind === "صورة"
          ? "صورة Flash تكلف 10 نقاط، وصورة Pro تكلف 25 نقطة. اشحن نقاط إضافية أو ارقَّ الباقة."
          : "هذه العملية تحتاج نقاط إضافية. اشحن باقة سريعة أو ارقَّ الباقة.",
      badge: "⚡ النقاط الإضافية لا تنتهي مع تجدّد الباقة الشهرية",
      cta: { label: "شحن نقاط فوراً", to: "/dashboard/credits" },
      benefits: [
        "حزمة 500 نقطة بـ 29 ر.س",
        "حزمة 1500 نقطة بـ 79 ر.س (الأفضل قيمة)",
        "حزمة 5000 نقطة بـ 249 ر.س",
        "تفعيل خلال 24 ساعة من رفع الإيصال",
      ],
    };
  }

  // plan_quota (legacy)
  return {
    icon: Crown,
    title: "وصلت حدّ باقتك الحالية",
    subtitle:
      generationKind === "صورة"
        ? "توليد الصور الاحترافية متاح في الباقات المدفوعة"
        : `استنفدت توليدات ${generationKind} هذا الشهر`,
    badge: "🔥 عرض المؤسسين: خصم 30% للأعضاء الـ 50 الأوائل",
    cta: { label: "ترقّ باقتك الآن", to: "/dashboard/billing" },
    benefits: [
      "200 توليدة نصية يومياً + 50 صورة احترافية",
      "نموذج Gemini Pro للجودة العالية",
      "مكتبة قوالب كاملة + حفظ المفضلة",
      "دعم واتساب مباشر مع المالك",
    ],
  };
}

export function QuotaExceededDialog({ open, onOpenChange, kind, reason }: Props) {
  const errorKind = reason ? (detectQuotaError(reason) ?? "plan_quota") : "plan_quota";
  const variant = getVariant(errorKind, kind);
  const Icon = variant.icon;

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
            <Icon className="h-7 w-7" />
          </div>
          <DialogTitle className="text-xl font-extrabold">{variant.title}</DialogTitle>
          <DialogDescription className="mt-2 text-sm text-primary-foreground/90">
            {variant.subtitle}
          </DialogDescription>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 pt-5">
          {reason && errorKind === "unknown" && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{reason}</span>
            </div>
          )}

          <ul className="space-y-2.5 text-sm">
            {variant.benefits.map((b) => (
              <BenefitRow key={b} text={b} />
            ))}
          </ul>

          <div className="mt-5 rounded-lg border border-gold/30 bg-gold/5 p-3 text-center">
            <p className="text-xs font-bold text-gold">{variant.badge}</p>
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <Button
              asChild
              className="w-full gradient-primary text-primary-foreground shadow-elegant"
              onClick={() => onOpenChange(false)}
            >
              <Link to={variant.cta.to}>
                <Sparkles className="h-4 w-4" />
                {variant.cta.label}
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
