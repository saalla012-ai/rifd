import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Loader2,
  CheckCircle2,
  Clock,
  MessageCircle,
  Copy,
  Upload,
  FileCheck2,
  AlertCircle,
  Crown,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Building2,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/billing/confirm/$requestId")({
  head: () => ({ meta: [{ title: "تأكيد طلب الاشتراك — رِفد" }] }),
  component: ConfirmRequestPage,
});

const PLAN_LABELS = { free: "مجاني", pro: "احترافي", business: "أعمال" } as const;
const PLAN_PRICES = {
  pro: { monthly: 79, yearly: 790 },
  business: { monthly: 199, yearly: 1990 },
} as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];

type RequestRow = {
  id: string;
  user_id: string;
  plan: "pro" | "business";
  billing_cycle: string;
  store_name: string | null;
  whatsapp: string;
  email: string;
  notes: string | null;
  status: "pending" | "contacted" | "activated" | "rejected" | "expired";
  receipt_path: string | null;
  receipt_uploaded_at: string | null;
  created_at: string;
};

type Settings = {
  whatsapp_number: string;
  bank_account_holder: string | null;
  bank_iban: string | null;
  bank_name: string | null;
};

function ConfirmRequestPage() {
  const { requestId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [request, setRequest] = useState<RequestRow | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      void navigate({ to: "/auth" });
      return;
    }
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, requestId]);

  // Realtime: تحديث الحالة لحظياً عند تغييرها من الأدمن
  useEffect(() => {
    if (!requestId) return;
    const channel = supabase
      .channel(`request-${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "subscription_requests",
          filter: `id=eq.${requestId}`,
        },
        (payload) => {
          setRequest((prev) => (prev ? { ...prev, ...(payload.new as RequestRow) } : prev));
          if ((payload.new as RequestRow).status === "activated") {
            toast.success("🎉 تم تفعيل اشتراكك! مرحباً بك في الأعضاء المؤسسين");
          }
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [requestId]);

  async function loadAll() {
    setLoading(true);
    const [reqRes, settingsRes] = await Promise.all([
      supabase
        .from("subscription_requests")
        .select("*")
        .eq("id", requestId)
        .maybeSingle(),
      supabase.from("app_settings").select("*").eq("id", 1).maybeSingle(),
    ]);

    if (!reqRes.data) {
      toast.error("لم نجد هذا الطلب");
      void navigate({ to: "/dashboard/billing" });
      return;
    }
    setRequest(reqRes.data as RequestRow);
    setSettings(settingsRes.data as Settings | null);
    setLoading(false);

    // إذا في إيصال مرفوع، جلب signed URL لعرضه
    if ((reqRes.data as RequestRow).receipt_path) {
      void loadReceiptPreview((reqRes.data as RequestRow).receipt_path!);
    }
  }

  async function loadReceiptPreview(path: string) {
    const { data, error } = await supabase.storage
      .from("payment-receipts")
      .createSignedUrl(path, 600);
    if (!error && data?.signedUrl) setPreviewUrl(data.signedUrl);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user || !request) return;

    // Validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("النوع غير مدعوم. الرجاء رفع JPG, PNG, WebP أو PDF");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`حجم الملف كبير. الحد الأقصى ${MAX_FILE_SIZE / 1024 / 1024} ميجابايت`);
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      // مسار آمن: {user_id}/{request_id}.{ext}
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${user.id}/${request.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-receipts")
        .upload(path, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        toast.error(`فشل الرفع: ${uploadError.message}`);
        return;
      }

      // تحديث الطلب
      const { error: updateError } = await supabase
        .from("subscription_requests")
        .update({
          receipt_path: path,
          receipt_uploaded_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (updateError) {
        toast.error("تم رفع الملف لكن فشل تحديث الطلب");
        return;
      }

      toast.success("✅ تم رفع الإيصال بنجاح! سنراجعه قريباً");
      await loadAll();
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function copyToClipboard(text: string, label: string) {
    void navigator.clipboard.writeText(text);
    toast.success(`تم نسخ ${label}`);
  }

  if (authLoading || loading) {
    return (
      <DashboardShell>
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </DashboardShell>
    );
  }

  if (!request) return null;

  const price = PLAN_PRICES[request.plan][request.billing_cycle as "monthly" | "yearly"];
  const planLabel = PLAN_LABELS[request.plan];
  const cycleLabel = request.billing_cycle === "yearly" ? "سنوي" : "شهري";
  const isActivated = request.status === "activated";
  const isRejected = request.status === "rejected";
  const hasReceipt = Boolean(request.receipt_path);

  // بيانات البنك
  const bankHolder = settings?.bank_account_holder ?? "محمود محمد علي";
  const bankIban = settings?.bank_iban ?? "SA0805000068204185025000";
  const bankName = settings?.bank_name ?? "البنك الأهلي السعودي (SNB)";
  const whatsappNumber = settings?.whatsapp_number ?? "966582286215";

  const waUrl = buildWhatsappUrl({
    whatsappNumber,
    requestId: request.id,
    planLabel,
    cycleLabel,
    price,
    storeName: request.store_name,
    hasReceipt,
  });

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/dashboard/billing"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="h-3 w-3 rotate-180" /> العودة للفوترة
          </Link>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-extrabold">
            <Receipt className="h-6 w-6 text-primary" />
            تأكيد طلب الاشتراك
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            رقم الطلب: <span className="font-mono font-bold">#{request.id.slice(0, 8).toUpperCase()}</span>
          </p>
        </div>

        {/* Status banner — يتغير حسب الحالة */}
        {isActivated && <ActivatedBanner />}
        {isRejected && <RejectedBanner whatsappUrl={waUrl} />}
        {!isActivated && !isRejected && (
          <StatusTracker status={request.status} hasReceipt={hasReceipt} />
        )}

        {/* بقية المحتوى يظهر فقط إذا الطلب نشط */}
        {!isActivated && !isRejected && (
          <>
            {/* الخطوة 1: بيانات الحساب البنكي */}
            <section className="mt-6 rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-6 shadow-elegant">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  1
                </div>
                <h2 className="text-lg font-bold">حوّل المبلغ على هذا الحساب</h2>
              </div>

              {/* المبلغ */}
              <div className="mb-5 rounded-xl border border-gold/40 bg-gold/5 p-4 text-center">
                <p className="text-xs font-medium text-muted-foreground">المبلغ المطلوب</p>
                <p className="mt-1 text-4xl font-extrabold text-foreground">
                  {price.toLocaleString("ar-SA")} <span className="text-lg font-bold">ر.س</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {planLabel} • {cycleLabel}
                </p>
              </div>

              {/* بيانات الحساب */}
              <div className="space-y-3">
                <BankRow
                  icon={<Building2 className="h-4 w-4" />}
                  label="البنك"
                  value={bankName}
                />
                <BankRow
                  label="اسم المستفيد"
                  value={bankHolder}
                  copyable
                  onCopy={() => copyToClipboard(bankHolder, "اسم المستفيد")}
                />
                <BankRow
                  label="رقم الآيبان (IBAN)"
                  value={bankIban}
                  copyable
                  ltr
                  highlighted
                  onCopy={() => copyToClipboard(bankIban, "رقم الآيبان")}
                />
              </div>

              <div className="mt-4 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                💡 <strong>نصيحة:</strong> انسخ الآيبان من الزر ✱، ثم افتح تطبيق بنكك واستخدم خيار "إضافة مستفيد جديد" أو "تحويل سريع".
              </div>
            </section>

            {/* الخطوة 2: رفع الإيصال */}
            <section className="mt-6 rounded-2xl border-2 border-success/30 bg-gradient-to-br from-success/5 to-transparent p-6 shadow-soft">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success text-sm font-bold text-success-foreground">
                  2
                </div>
                <h2 className="text-lg font-bold">ارفع إيصال التحويل</h2>
                <Badge className="ml-1 bg-warning/20 text-warning hover:bg-warning/20">
                  ⚡ تفعيل أسرع 3×
                </Badge>
              </div>

              {hasReceipt ? (
                <div className="rounded-xl border-2 border-success/40 bg-success/10 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <FileCheck2 className="mt-0.5 h-6 w-6 shrink-0 text-success" />
                      <div>
                        <p className="font-bold text-success">✅ تم استلام إيصالك</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          رُفع في {new Date(request.receipt_uploaded_at!).toLocaleString("ar-SA")}
                        </p>
                        <p className="mt-2 text-sm">
                          سيراجعه فريقنا خلال <strong className="text-success">24 ساعة</strong> (عادةً أقل من 4 ساعات في أوقات العمل).
                        </p>
                      </div>
                    </div>
                    {previewUrl && (
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-border bg-card p-1 transition hover:scale-105"
                      >
                        {previewUrl.includes(".pdf") ? (
                          <div className="flex h-20 w-20 items-center justify-center rounded bg-muted">
                            <Receipt className="h-8 w-8 text-muted-foreground" />
                          </div>
                        ) : (
                          <img
                            src={previewUrl}
                            alt="إيصال التحويل"
                            className="h-20 w-20 rounded object-cover"
                          />
                        )}
                      </a>
                    )}
                  </div>
                  {request.status === "pending" && (
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="ml-1 h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="ml-1 h-3 w-3" />
                      )}
                      استبدال الإيصال
                    </Button>
                  )}
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className={cn(
                      "flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-success/40 bg-card p-8 transition",
                      "hover:border-success hover:bg-success/5",
                      uploading && "cursor-not-allowed opacity-60"
                    )}
                  >
                    {uploading ? (
                      <Loader2 className="h-10 w-10 animate-spin text-success" />
                    ) : (
                      <Upload className="h-10 w-10 text-success" />
                    )}
                    <div>
                      <p className="text-sm font-bold">
                        {uploading ? "جاري الرفع..." : "اضغط لرفع إيصال التحويل"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        JPG, PNG, WebP أو PDF • حد أقصى 5MB
                      </p>
                    </div>
                  </button>
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    💡 ارفع لقطة شاشة من إشعار البنك أو إيصال التحويل من تطبيق البنك
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </section>

            {/* الخطوة 3: تواصل مع الدعم (اختياري) */}
            <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-bold">
                  3
                </div>
                <h2 className="text-lg font-bold">أو تواصل معنا مباشرة</h2>
                <Badge variant="outline" className="text-xs">اختياري</Badge>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                إذا واجهت أي مشكلة أو لديك استفسار، تواصل معنا فوراً عبر واتساب.
                {hasReceipt && (
                  <span className="text-success"> (إيصالك جاهز — هذه الخطوة للاستفسار فقط)</span>
                )}
              </p>
              <Button asChild size="lg" className="bg-success text-success-foreground hover:bg-success/90">
                <a href={waUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="ml-2 h-4 w-4" />
                  افتح واتساب وتحدث مع المؤسس
                </a>
              </Button>
            </section>

            {/* Trust footer */}
            <div className="mt-6 rounded-xl border border-success/20 bg-success/5 p-4">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <div className="text-xs text-muted-foreground">
                  <strong className="text-foreground">ضمان الخدمة:</strong> إذا لم تتم خدمتك خلال 24 ساعة من رفع الإيصال،
                  ستحصل على شهر إضافي مجاناً + استرداد كامل عند الطلب خلال 14 يوم.
                  بياناتك البنكية محمية ولن نطلب منك أبداً أي معلومات بنكية حساسة.
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

// ============= Sub-components =============

function BankRow({
  icon,
  label,
  value,
  copyable,
  ltr,
  highlighted,
  onCopy,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  copyable?: boolean;
  ltr?: boolean;
  highlighted?: boolean;
  onCopy?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border p-3",
        highlighted ? "border-primary/40 bg-primary/5" : "border-border bg-card"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {icon}
          {label}
        </div>
        <div
          dir={ltr ? "ltr" : undefined}
          className={cn(
            "mt-1 truncate font-bold",
            highlighted ? "text-primary" : "text-foreground",
            ltr ? "font-mono text-sm" : "text-base"
          )}
        >
          {value}
        </div>
      </div>
      {copyable && (
        <Button size="sm" variant="outline" onClick={onCopy} className="shrink-0">
          <Copy className="ml-1 h-3 w-3" /> نسخ
        </Button>
      )}
    </div>
  );
}

function StatusTracker({
  status,
  hasReceipt,
}: {
  status: string;
  hasReceipt: boolean;
}) {
  const steps = useMemo(
    () => [
      {
        label: "تم استلام الطلب",
        done: true,
        icon: CheckCircle2,
      },
      {
        label: hasReceipt ? "تم رفع الإيصال" : "ينتظر الإيصال",
        done: hasReceipt,
        icon: hasReceipt ? CheckCircle2 : Upload,
        active: !hasReceipt,
      },
      {
        label: status === "contacted" ? "قيد المراجعة" : "مراجعة الفريق",
        done: status === "contacted",
        active: hasReceipt && status !== "contacted",
        icon: status === "contacted" ? CheckCircle2 : Clock,
      },
      {
        label: "تفعيل الاشتراك",
        done: false,
        icon: Crown,
      },
    ],
    [status, hasReceipt]
  );

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h3 className="mb-4 text-sm font-bold">حالة طلبك</h3>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={i} className="flex flex-1 items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 transition",
                    step.done
                      ? "border-success bg-success text-success-foreground"
                      : step.active
                        ? "border-primary bg-primary/10 text-primary animate-pulse"
                        : "border-border bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={cn(
                    "text-center text-[10px] font-medium leading-tight",
                    step.done
                      ? "text-success"
                      : step.active
                        ? "text-primary"
                        : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "hidden h-0.5 flex-1 sm:block",
                    step.done ? "bg-success" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActivatedBanner() {
  return (
    <div className="mt-6 rounded-2xl border-2 border-success bg-gradient-to-br from-success/15 via-success/5 to-transparent p-6 shadow-elegant">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
            <Crown className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-success">🎉 تم تفعيل اشتراكك!</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              مرحباً بك في عائلة الأعضاء المؤسسين. سعرك ثابت مدى الحياة.
            </p>
          </div>
        </div>
        <Button asChild className="bg-success text-success-foreground hover:bg-success/90">
          <Link to="/dashboard">
            <ArrowRight className="ml-2 h-4 w-4 rotate-180" />
            ابدأ الإنشاء الآن
          </Link>
        </Button>
      </div>
    </div>
  );
}

function RejectedBanner({ whatsappUrl }: { whatsappUrl: string }) {
  return (
    <div className="mt-6 rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-destructive" />
        <div className="flex-1">
          <h2 className="text-lg font-bold text-destructive">تم رفض الطلب</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            للأسف لم نستطع تأكيد هذا الطلب. تواصل معنا عبر واتساب لمعرفة السبب وحل المشكلة.
          </p>
          <Button asChild className="mt-3 bg-success text-success-foreground hover:bg-success/90">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="ml-2 h-4 w-4" /> تواصل مع الدعم
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

function buildWhatsappUrl({
  whatsappNumber,
  requestId,
  planLabel,
  cycleLabel,
  price,
  storeName,
  hasReceipt,
}: {
  whatsappNumber: string;
  requestId: string;
  planLabel: string;
  cycleLabel: string;
  price: number;
  storeName: string | null;
  hasReceipt: boolean;
}) {
  const lines = [
    "السلام عليكم 👋",
    `بخصوص طلب الاشتراك رقم #${requestId.slice(0, 8).toUpperCase()}`,
    "",
    `📦 الباقة: ${planLabel} (${cycleLabel})`,
    `💰 المبلغ: ${price} ر.س`,
    storeName ? `🏪 المتجر: ${storeName}` : "",
    hasReceipt ? `🧾 الإيصال: تم رفعه على المنصة ✅` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines)}`;
}
