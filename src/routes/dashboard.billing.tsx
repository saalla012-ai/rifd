import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Crown,
  ShieldCheck,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Loader2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { TrustBadges } from "@/components/trust-badges";
import { ActivationSteps } from "@/components/activation-steps";
import { SubscribersCounter } from "@/components/subscribers-counter";
import { FounderCard } from "@/components/founder-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  formatSaudiPhoneDisplay,
  normalizeSaudiPhone,
  validateSaudiPhone,
  SAUDI_PHONE_ERROR,
  SAUDI_PHONE_PLACEHOLDER,
} from "@/lib/phone";

export const Route = createFileRoute("/dashboard/billing")({
  head: () => ({ meta: [{ title: "الفواتير والاشتراك — رِفد" }] }),
  component: BillingPage,
});

const PLAN_LABELS = {
  free: "مجاني",
  pro: "احترافي",
  business: "أعمال",
} as const;

const PLAN_PRICES = {
  pro: { monthly: 79, yearly: 790 },
  business: { monthly: 199, yearly: 1990 },
} as const;

const FUTURE_INCREASE_PCT = 30;

function priceAfterIncrease(price: number) {
  return Math.round(price * (1 + FUTURE_INCREASE_PCT / 100));
}

const STATUS_META: Record<
  string,
  { label: string; tone: "warning" | "info" | "success" | "danger" | "muted"; icon: typeof Clock }
> = {
  pending: { label: "قيد الانتظار", tone: "warning", icon: Clock },
  contacted: { label: "تم التواصل معك", tone: "info", icon: MessageCircle },
  activated: { label: "تم تفعيل الاشتراك ✨", tone: "success", icon: CheckCircle2 },
  rejected: { label: "تم الرفض", tone: "danger", icon: AlertCircle },
  expired: { label: "انتهت صلاحية الطلب", tone: "muted", icon: AlertCircle },
};

type Settings = {
  whatsapp_number: string;
  founding_total_seats: number;
  founding_program_active: boolean;
  founding_base_count?: number;
  founding_discount_pct?: number;
};

type RequestRow = {
  id: string;
  plan: "pro" | "business";
  billing_cycle: string;
  store_name: string | null;
  whatsapp: string;
  email: string;
  payment_method: string | null;
  notes: string | null;
  status: keyof typeof STATUS_META;
  created_at: string;
};

function BillingPage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [seatsTaken, setSeatsTaken] = useState<number>(0);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [plan, setPlan] = useState<"pro" | "business">("pro");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [storeName, setStoreName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("bank_transfer_sa");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!user) return;
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (profile?.store_name) setStoreName(profile.store_name);
    if (profile?.whatsapp) setWhatsapp(formatSaudiPhoneDisplay(profile.whatsapp));
  }, [profile]);

  async function loadAll() {
    setLoading(true);
    const [settingsRes, seatsRes, reqRes] = await Promise.all([
      supabase.from("app_settings").select("*").eq("id", 1).maybeSingle(),
      supabase
        .from("subscription_requests")
        .select("id", { count: "exact", head: true })
        .in("status", ["activated", "contacted"]),
      supabase
        .from("subscription_requests")
        .select("id, plan, billing_cycle, store_name, whatsapp, email, payment_method, notes, status, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);
    setSettings((settingsRes.data as Settings | null) ?? null);
    setSeatsTaken(seatsRes.count ?? 0);
    setRequests((reqRes.data as RequestRow[] | null) ?? []);
    setLoading(false);
  }

  const seatsTotal = settings?.founding_total_seats ?? 1000;
  const seatsLeft = Math.max(0, seatsTotal - seatsTaken);
  const seatsPct = (seatsTaken / seatsTotal) * 100;
  const whatsappNumber = settings?.whatsapp_number ?? "966582286215";
  const increasePct = settings?.founding_discount_pct ?? FUTURE_INCREASE_PCT;

  const price = PLAN_PRICES[plan][billingCycle];
  const futurePrice = Math.round(price * (1 + increasePct / 100));
  const planLabel = PLAN_LABELS[plan];

  const pendingRequest = useMemo(
    () => requests.find((r) => r.status === "pending" || r.status === "contacted"),
    [requests]
  );

  const isPaidUser = Boolean(profile?.plan && profile.plan !== "free");

  // Auto-redirect: لو في طلب pending → ننقله مباشرة لصفحة التأكيد
  // (إلا لو مفعّل بالفعل — يبقى يشوف صفحة الفوترة)
  useEffect(() => {
    if (loading || !pendingRequest || isPaidUser) return;
    void navigate({
      to: "/dashboard/billing/confirm/$requestId",
      params: { requestId: pendingRequest.id },
      replace: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, pendingRequest?.id, isPaidUser]);

  function buildWhatsappUrl(reqId?: string) {
    const lines = [
      "السلام عليكم 👋",
      "أرغب بالاشتراك في برنامج الأعضاء المؤسسين لرِفد",
      "",
      `📦 الباقة: ${planLabel} ${billingCycle === "yearly" ? "(سنوي)" : "(شهري)"}`,
      `💰 سعر المؤسسين المجمّد: ${price} ر.س (سيرتفع لـ ${futurePrice} ر.س بعد اكتمال 1000 عضو)`,
      `🔒 سعرك ثابت مدى الحياة لن يتغير`,
      storeName ? `🏪 المتجر: ${storeName}` : "",
      `📱 واتساب: ${whatsapp}`,
      `📧 البريد: ${user?.email ?? ""}`,
      `💳 طريقة الدفع المفضلة: ${paymentMethodLabel(paymentMethod)}`,
      reqId ? `🔖 رقم الطلب: ${reqId.slice(0, 8)}` : "",
      notes ? `📝 ملاحظة: ${notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines)}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!whatsapp.trim()) {
      toast.error("الرجاء إدخال رقم الواتساب");
      return;
    }
    if (!validateSaudiPhone(whatsapp)) {
      toast.error(SAUDI_PHONE_ERROR);
      return;
    }
    const normalizedWhatsapp = normalizeSaudiPhone(whatsapp)!;
    setSubmitting(true);
    const { data, error } = await supabase
      .from("subscription_requests")
      .insert({
        user_id: user.id,
        plan,
        billing_cycle: billingCycle,
        store_name: storeName || null,
        whatsapp: normalizedWhatsapp,
        email: user.email ?? "",
        payment_method: paymentMethod,
        notes: notes || null,
      })
      .select("id")
      .single();
    setSubmitting(false);

    if (error || !data) {
      toast.error("فشل إرسال الطلب، حاول مرة أخرى");
      return;
    }

    toast.success("✅ تم استلام طلبك! ننتقل لصفحة التأكيد...");
    await refreshProfile();
    // ننتقل لصفحة التأكيد المخصصة بدل فتح واتساب مباشرة
    void navigate({
      to: "/dashboard/billing/confirm/$requestId",
      params: { requestId: data.id },
    });
  }

  const isPaidUser = profile?.plan && profile.plan !== "free";
  const proFutureMonthly = priceAfterIncrease(PLAN_PRICES.pro.monthly);
  const businessFutureMonthly = priceAfterIncrease(PLAN_PRICES.business.monthly);

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold">الفواتير والاشتراك</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          إدارة باقتك والاطلاع على طلباتك السابقة
        </p>
      </div>

      {/* Current Plan Card */}
      <div
        className={cn(
          "rounded-2xl border p-6 shadow-soft",
          isPaidUser
            ? "border-gold/40 bg-gradient-to-br from-gold/10 to-transparent"
            : "border-border bg-card"
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              {isPaidUser && <Crown className="h-5 w-5 text-gold" />}
              <h3 className="text-lg font-bold">
                باقتك الحالية: {PLAN_LABELS[profile?.plan ?? "free"]}
              </h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {isPaidUser
                ? "✨ شكراً لكونك من الأعضاء المؤسسين! سعرك ثابت مدى الحياة."
                : "ابدأ مجاناً واستكشف، ثم رقّ لما تحتاج توسع نشاطك."}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/pricing">عرض كل الباقات</Link>
          </Button>
        </div>
      </div>

      {/* Pending request banner */}
      {pendingRequest && (
        <PendingBanner
          request={pendingRequest}
          waUrl={buildWhatsappUrl(pendingRequest.id)}
        />
      )}

      {/* Founding members + Form */}
      {!isPaidUser && (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-soft"
          >
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">طلب الاشتراك</h2>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">
              املأ المعلومات وسنفتح لك واتساب فوراً مع تأكيد لحظي للطلب — دعم متاح 24/7.
            </p>

            {/* Live subscribers counter — social proof */}
            <div className="mb-5">
              <SubscribersCounter />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 block">الباقة</Label>
                <Select value={plan} onValueChange={(v) => setPlan(v as "pro" | "business")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pro">
                      احترافي — {PLAN_PRICES.pro.monthly} ر.س/شهر · 🔥 الأكثر اختياراً
                      <span className="ml-1 text-[10px] text-warning">(سيرتفع لـ {proFutureMonthly} لاحقاً)</span>
                    </SelectItem>
                    <SelectItem value="business">
                      أعمال — {PLAN_PRICES.business.monthly} ر.س/شهر · 👑 الأفضل قيمة للوكالات
                      <span className="ml-1 text-[10px] text-warning">(سيرتفع لـ {businessFutureMonthly} لاحقاً)</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">الدورة</Label>
                <Select value={billingCycle} onValueChange={(v) => setBillingCycle(v as "monthly" | "yearly")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">شهري</SelectItem>
                    <SelectItem value="yearly">سنوي (وفّر شهرين)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">اسم المتجر</Label>
                <Input
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="مثال: متجر ندى للعطور"
                />
              </div>
              <div>
                <Label className="mb-1.5 block">رقم الواتساب *</Label>
                <Input
                  required
                  dir="ltr"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder={SAUDI_PHONE_PLACEHOLDER}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  رقم جوال سعودي يبدأ بـ 5 — نتواصل معك من خلاله
                </p>
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-1.5 block">طريقة الدفع المفضلة</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer_sa">تحويل بنكي (بنك سعودي)</SelectItem>
                    <SelectItem value="other">طريقة أخرى (نناقشها في واتساب)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-1.5 block">ملاحظة (اختياري)</Label>
                <Textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي تفاصيل إضافية تحب نعرفها قبل التواصل"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold/30 bg-gradient-to-l from-gold/10 via-secondary/50 to-secondary/50 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-gold">
                    🔒 سعر المؤسسين — مجمّد مدى الحياة
                  </span>
                </div>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <div className="text-2xl font-extrabold text-foreground">
                    {price}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      ر.س / {billingCycle === "yearly" ? "سنوياً" : "شهرياً"}
                    </span>
                  </div>
                </div>
                <div className="mt-1 text-[11px] font-bold text-primary">
                  {plan === "pro"
                    ? "≈ 2.6 ر.س يومياً • أرخص من فنجان قهوة ☕"
                    : "≈ 39.8 ر.س لكل متجر (5 ملفات) • يعادل موظف بـ4,000 ر.س"}
                </div>
                <div className="mt-1 text-[11px] font-medium text-warning">
                  ⚠️ سيرتفع لـ {futurePrice} ر.س بعد اكتمال 1000 عضو
                </div>
                <div className="mt-0.5 text-[11px] font-medium text-success">
                  ✓ سعرك ثابت مدى الحياة — لن يتأثر بأي زيادة مستقبلية
                </div>
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="gradient-primary text-primary-foreground shadow-elegant"
              >
                {submitting ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="ml-2 h-4 w-4" />
                )}
                إرسال الطلب وعرض بيانات التحويل
              </Button>
            </div>

            <div className="mt-4 rounded-xl border border-success/20 bg-success/5 p-3">
              <TrustBadges variant="row" items={4} />
            </div>
          </form>

          {/* Right column: Founder card + Steps + Founding members */}
          <div className="space-y-5">
            <FounderCard whatsappNumber={whatsappNumber} />
            <ActivationSteps />

            <aside className="rounded-2xl border-2 border-gold/40 bg-gradient-to-br from-gold/10 via-gold/5 to-transparent p-6 shadow-gold">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-gold" />
                <span className="text-xs font-bold uppercase tracking-wide text-gold">
                  الأعضاء المؤسسين
                </span>
              </div>
              <h3 className="mt-3 text-xl font-extrabold">
                احجز سعرك قبل الزيادة — أول 1000 عضو
              </h3>

              <div className="mt-5 rounded-xl bg-card/50 p-4 backdrop-blur">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Users className="h-4 w-4 text-gold" /> المقاعد المتبقية
                  </span>
                  <span className="font-extrabold text-gold">
                    {loading ? "..." : `${seatsLeft.toLocaleString("ar-SA")} / ${seatsTotal.toLocaleString("ar-SA")}`}
                  </span>
                </div>
                <Progress value={seatsPct} className="mt-2 h-2" />
                <p className="mt-2 text-xs text-muted-foreground">
                  بعد اكتمال {seatsTotal.toLocaleString("ar-SA")} عضو سترتفع الأسعار {increasePct}%
                </p>
              </div>

              <ul className="mt-5 space-y-2.5 text-sm">
                {[
                  `🔒 سعرك مجمّد مدى الحياة — لن يرتفع أبداً حتى لو ارتفعت الأسعار`,
                  "💬 دعم مباشر من المؤسس على مدار الساعة 24/7",
                  "⚡ تأكيد فوري للطلب — بدون قوائم انتظار",
                  "🎯 تأثيرك على خارطة الطريق (تقترح ميزات نطورها)",
                  "🧾 فاتورة ضريبية رسمية بعد كل دفعة",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      )}

      {/* Trust badges grid — visible to everyone */}
      {!isPaidUser && (
        <div className="mt-6">
          <TrustBadges items={6} />
        </div>
      )}

      {/* Requests history */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h3 className="mb-4 text-base font-bold">طلباتك السابقة</h3>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : requests.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            ما عندك أي طلبات سابقة. ابدأ بإرسال طلب من النموذج أعلاه.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-right text-xs text-muted-foreground">
                  <th className="px-2 py-2 font-medium">التاريخ</th>
                  <th className="px-2 py-2 font-medium">الباقة</th>
                  <th className="px-2 py-2 font-medium">الدورة</th>
                  <th className="px-2 py-2 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => {
                  const meta = STATUS_META[r.status];
                  const Icon = meta.icon;
                  return (
                    <tr key={r.id} className="border-b border-border/50 last:border-0">
                      <td className="px-2 py-3 text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString("ar-SA")}
                      </td>
                      <td className="px-2 py-3 font-medium">{PLAN_LABELS[r.plan]}</td>
                      <td className="px-2 py-3 text-xs text-muted-foreground">
                        {r.billing_cycle === "yearly" ? "سنوي" : "شهري"}
                      </td>
                      <td className="px-2 py-3">
                        <Badge variant={toneToVariant(meta.tone)} className="gap-1">
                          <Icon className="h-3 w-3" /> {meta.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function paymentMethodLabel(method: string) {
  if (method === "bank_transfer_sa") return "تحويل بنكي سعودي";
  return "أخرى";
}

function toneToVariant(
  tone: "warning" | "info" | "success" | "danger" | "muted"
): "default" | "secondary" | "destructive" | "outline" {
  if (tone === "success") return "default";
  if (tone === "danger") return "destructive";
  if (tone === "warning" || tone === "info") return "secondary";
  return "outline";
}

function PendingBanner({
  request,
  waUrl,
}: {
  request: RequestRow;
  waUrl: string;
}) {
  const meta = STATUS_META[request.status];
  return (
    <div className="mt-6 rounded-2xl border-2 border-warning/40 bg-gradient-to-br from-warning/10 to-transparent p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div>
            <h3 className="font-bold">عندك طلب نشط: {meta.label}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {PLAN_LABELS[request.plan]} • {request.billing_cycle === "yearly" ? "سنوي" : "شهري"} •
              {" "}
              أُرسل في {new Date(request.created_at).toLocaleDateString("ar-SA")}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              افتح صفحة التأكيد لرفع إيصال التحويل ومتابعة الحالة لحظياً.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="gradient-primary text-primary-foreground shadow-elegant">
            <Link to="/dashboard/billing/confirm/$requestId" params={{ requestId: request.id }}>
              <CheckCircle2 className="ml-2 h-4 w-4" /> فتح صفحة التأكيد
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-success text-success hover:bg-success/10">
            <a href={waUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="ml-2 h-4 w-4" /> واتساب
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
