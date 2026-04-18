import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Loader2,
  Crown,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Receipt,
  FileX,
  Download,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatSaudiPhoneDisplay, normalizeSaudiPhone } from "@/lib/phone";

export const Route = createFileRoute("/admin/subscriptions")({
  head: () => ({ meta: [{ title: "إدارة الاشتراكات — رِفد" }] }),
  component: AdminSubscriptionsPage,
});

type Req = {
  id: string;
  user_id: string;
  plan: "pro" | "business";
  billing_cycle: string;
  store_name: string | null;
  whatsapp: string;
  email: string;
  payment_method: string | null;
  notes: string | null;
  admin_notes: string | null;
  status: "pending" | "contacted" | "activated" | "rejected" | "expired";
  receipt_path: string | null;
  receipt_uploaded_at: string | null;
  created_at: string;
};

const PLAN_LABELS = { pro: "احترافي", business: "أعمال" } as const;

const STATUS_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  contacted: "secondary",
  activated: "default",
  rejected: "destructive",
  expired: "outline",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "قيد الانتظار",
  contacted: "تم التواصل",
  activated: "مفعّل",
  rejected: "مرفوض",
  expired: "منتهي",
};

function AdminSubscriptionsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      void navigate({ to: "/auth" });
      return;
    }
    // ننتظر تحديد دور الأدمن (يأتي من AuthContext، استعلام واحد فقط لكل جلسة)
    if (isAdmin === null) return;
    if (isAdmin) {
      void loadRequests();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, isAdmin]);

  async function loadRequests() {
    setLoading(true);
    const { data } = await supabase
      .from("subscription_requests")
      .select("*")
      .order("created_at", { ascending: false });
    setRequests((data as Req[] | null) ?? []);
    setLoading(false);
  }

  async function updateStatus(req: Req, newStatus: Req["status"], adminNotes?: string) {
    setSavingId(req.id);
    const updates: {
      status: Req["status"];
      admin_notes?: string | null;
      activated_at?: string;
      activated_until?: string;
    } = { status: newStatus };
    if (adminNotes !== undefined) updates.admin_notes = adminNotes;

    if (newStatus === "activated") {
      const now = new Date();
      const until = new Date(now);
      if (req.billing_cycle === "yearly") until.setFullYear(until.getFullYear() + 1);
      else until.setMonth(until.getMonth() + 1);
      updates.activated_at = now.toISOString();
      updates.activated_until = until.toISOString();
    }

    const { error: reqErr } = await supabase
      .from("subscription_requests")
      .update(updates)
      .eq("id", req.id);

    if (reqErr) {
      toast.error("فشل تحديث الطلب");
      setSavingId(null);
      return;
    }

    if (newStatus === "activated") {
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ plan: req.plan })
        .eq("id", req.user_id);
      if (profileErr) {
        toast.error("تم تحديث الطلب لكن فشل ترقية الباقة في الملف");
      } else {
        toast.success(`تم تفعيل باقة ${PLAN_LABELS[req.plan]} للمستخدم ✨`);
      }
    } else {
      toast.success("تم تحديث حالة الطلب");
    }

    setSavingId(null);
    await loadRequests();
  }

  if (authLoading || isAdmin === null) {
    return (
      <DashboardShell>
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </DashboardShell>
    );
  }

  if (!isAdmin) {
    return (
      <DashboardShell>
        <div className="mx-auto max-w-md rounded-2xl border border-destructive/40 bg-destructive/5 p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
          <h2 className="mt-3 text-xl font-bold">صلاحيات غير كافية</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            هذه الصفحة مخصصة لمدراء النظام فقط.
          </p>
        </div>
      </DashboardShell>
    );
  }

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);
  const counts = {
    pending: requests.filter((r) => r.status === "pending").length,
    contacted: requests.filter((r) => r.status === "contacted").length,
    activated: requests.filter((r) => r.status === "activated").length,
  };

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold">
            <Crown className="h-5 w-5 text-gold" /> إدارة الاشتراكات
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            مراجعة طلبات الأعضاء المؤسسين وتفعيل الباقات
          </p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل ({requests.length})</SelectItem>
            <SelectItem value="pending">قيد الانتظار ({counts.pending})</SelectItem>
            <SelectItem value="contacted">تم التواصل ({counts.contacted})</SelectItem>
            <SelectItem value="activated">مفعّل ({counts.activated})</SelectItem>
            <SelectItem value="rejected">مرفوض</SelectItem>
            <SelectItem value="expired">منتهي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="قيد الانتظار 🔥" value={counts.pending} tone="warning" />
        <StatCard label="تم التواصل" value={counts.contacted} tone="info" />
        <StatCard label="مفعّل" value={counts.activated} tone="success" />
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">لا توجد طلبات.</p>
        ) : (
          filtered.map((r) => (
            <RequestCard
              key={r.id}
              request={r}
              saving={savingId === r.id}
              onUpdate={updateStatus}
            />
          ))
        )}
      </div>
    </DashboardShell>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "warning" | "info" | "success";
}) {
  const colors = {
    warning: "border-warning/40 bg-warning/5 text-warning",
    info: "border-primary/40 bg-primary/5 text-primary",
    success: "border-success/40 bg-success/5 text-success",
  } as const;
  return (
    <div className={`rounded-xl border p-4 ${colors[tone]}`}>
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="mt-1 text-3xl font-extrabold">{value}</div>
    </div>
  );
}

function RequestCard({
  request,
  saving,
  onUpdate,
}: {
  request: Req;
  saving: boolean;
  onUpdate: (r: Req, status: Req["status"], notes?: string) => Promise<void>;
}) {
  const [adminNotes, setAdminNotes] = useState(request.admin_notes ?? "");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const normalizedWa = normalizeSaudiPhone(request.whatsapp);
  const waUrl = `https://wa.me/${normalizedWa ?? request.whatsapp.replace(/[^\d]/g, "")}`;
  const hasReceipt = Boolean(request.receipt_path);
  const isPdf = request.receipt_path?.toLowerCase().endsWith(".pdf");

  async function loadReceipt() {
    if (!request.receipt_path || receiptUrl) return;
    setLoadingReceipt(true);
    const { data, error } = await supabase.storage
      .from("payment-receipts")
      .createSignedUrl(request.receipt_path, 300);
    setLoadingReceipt(false);
    if (error || !data?.signedUrl) {
      toast.error("فشل تحميل الإيصال");
      return;
    }
    setReceiptUrl(data.signedUrl);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={STATUS_BADGE[request.status]}>{STATUS_LABEL[request.status]}</Badge>
            <span className="font-bold">{PLAN_LABELS[request.plan]}</span>
            <span className="text-xs text-muted-foreground">
              ({request.billing_cycle === "yearly" ? "سنوي" : "شهري"})
            </span>
            {hasReceipt ? (
              <Badge className="gap-1 bg-success/15 text-success hover:bg-success/15">
                <Receipt className="h-3 w-3" /> إيصال جاهز
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 border-warning/40 text-warning">
                <FileX className="h-3 w-3" /> بدون إيصال
              </Badge>
            )}
          </div>
          <h3 className="mt-2 font-bold">{request.store_name || "بدون اسم متجر"}</h3>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>📧 {request.email}</span>
            <span dir="ltr">📱 {formatSaudiPhoneDisplay(request.whatsapp)}</span>
            <span>💳 {request.payment_method === "bank_transfer_sa" ? "تحويل بنكي" : "أخرى"}</span>
            <span>🕐 {new Date(request.created_at).toLocaleString("ar-SA")}</span>
            {request.receipt_uploaded_at && (
              <span className="text-success">
                🧾 رُفع: {new Date(request.receipt_uploaded_at).toLocaleString("ar-SA")}
              </span>
            )}
          </div>
          {request.notes && (
            <p className="mt-2 rounded-md bg-secondary/50 p-2 text-sm">📝 {request.notes}</p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {hasReceipt && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={loadReceipt}>
                  <Receipt className="ml-1 h-3 w-3" /> عرض الإيصال
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>إيصال التحويل البنكي</DialogTitle>
                </DialogHeader>
                <div className="mt-2 max-h-[70vh] overflow-auto">
                  {loadingReceipt && (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {receiptUrl && !isPdf && (
                    <img
                      src={receiptUrl}
                      alt="إيصال التحويل"
                      className="mx-auto max-h-[60vh] rounded-lg border border-border object-contain"
                    />
                  )}
                  {receiptUrl && isPdf && (
                    <iframe
                      src={receiptUrl}
                      title="إيصال التحويل (PDF)"
                      className="h-[60vh] w-full rounded-lg border border-border"
                    />
                  )}
                </div>
                {receiptUrl && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <a href={receiptUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="ml-1 h-3 w-3" /> فتح في تبويب جديد
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <a href={receiptUrl} download>
                        <Download className="ml-1 h-3 w-3" /> تحميل
                      </a>
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
          <Button asChild variant="outline" size="sm">
            <a href={waUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="ml-1 h-3 w-3" /> واتساب
            </a>
          </Button>
        </div>
      </div>

      <Textarea
        value={adminNotes}
        onChange={(e) => setAdminNotes(e.target.value)}
        placeholder="ملاحظات الإدارة (مرئية للأدمن فقط)"
        rows={2}
        className="mt-3"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {request.status !== "contacted" && request.status !== "activated" && (
          <Button
            size="sm"
            variant="secondary"
            disabled={saving}
            onClick={() => onUpdate(request, "contacted", adminNotes)}
          >
            <MessageCircle className="ml-1 h-3 w-3" /> تم التواصل
          </Button>
        )}
        {request.status !== "activated" && (
          <Button
            size="sm"
            disabled={saving}
            onClick={() => onUpdate(request, "activated", adminNotes)}
            className="bg-success text-success-foreground hover:bg-success/90"
          >
            <CheckCircle2 className="ml-1 h-3 w-3" /> تفعيل الباقة
          </Button>
        )}
        {request.status !== "rejected" && (
          <Button
            size="sm"
            variant="destructive"
            disabled={saving}
            onClick={() => onUpdate(request, "rejected", adminNotes)}
          >
            <XCircle className="ml-1 h-3 w-3" /> رفض
          </Button>
        )}
        {saving && <Loader2 className="h-4 w-4 animate-spin self-center text-muted-foreground" />}
      </div>
    </div>
  );
}
