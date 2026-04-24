import { createFileRoute } from "@tanstack/react-router";
import { Coins, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Progress } from "@/components/ui/progress";
import { useCreditsSummary } from "@/hooks/use-credits-summary";

export const Route = createFileRoute("/dashboard/usage")({
  head: () => ({ meta: [{ title: "الاستخدام — رِفد" }] }),
  component: UsagePage,
});

const PLAN_LABEL: Record<string, string> = {
  free: "مجاني",
  starter: "بداية",
  growth: "نمو",
  pro: "احترافي",
  business: "أعمال",
};

function fmt(n: number) {
  return n.toLocaleString("ar-SA");
}

function UsagePage() {
  const { data, loading } = useCreditsSummary();

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </DashboardShell>
    );
  }

  const textPct = Math.min(100, ((data?.dailyTextUsed ?? 0) / Math.max(1, data?.dailyTextCap ?? 1)) * 100);
  const imgPct = Math.min(100, ((data?.dailyImageUsed ?? 0) / Math.max(1, data?.dailyImageCap ?? 1)) * 100);
  const plan = data?.plan ?? "free";

  return (
    <DashboardShell>
      <h1 className="text-2xl font-extrabold">الاستخدام والرصيد</h1>
      <p className="mt-1 text-sm text-muted-foreground">باقتك الحالية: <strong>{PLAN_LABEL[plan] ?? plan}</strong></p>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex justify-between text-sm">
            <span className="inline-flex items-center gap-2 font-bold"><FileText className="h-4 w-4 text-primary" /> نصوص اليوم</span>
            <span>{fmt(data?.dailyTextUsed ?? 0)} / {fmt(data?.dailyTextCap ?? 0)}</span>
          </div>
          <Progress value={textPct} className="mt-3" />
          <p className="mt-2 text-xs text-muted-foreground">مجانية ضمن سقف حماية يومي</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex justify-between text-sm">
            <span className="inline-flex items-center gap-2 font-bold"><ImageIcon className="h-4 w-4 text-primary" /> صور اليوم</span>
            <span>{fmt(data?.dailyImageUsed ?? 0)} / {fmt(data?.dailyImageCap ?? 0)}</span>
          </div>
          <Progress value={imgPct} className="mt-3" />
          <p className="mt-2 text-xs text-muted-foreground">مجانية ضمن سقف حماية يومي</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex justify-between text-sm">
            <span className="inline-flex items-center gap-2 font-bold"><Coins className="h-4 w-4 text-primary" /> نقاط الفيديو</span>
            <span>{fmt(data?.totalCredits ?? 0)}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md bg-secondary/40 p-2"><span className="text-muted-foreground">من الباقة</span><p className="font-bold">{fmt(data?.planCredits ?? 0)}</p></div>
            <div className="rounded-md bg-secondary/40 p-2"><span className="text-muted-foreground">إضافية</span><p className="font-bold">{fmt(data?.topupCredits ?? 0)}</p></div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">تُستخدم للفيديو فقط</p>
        </div>
      </div>
    </DashboardShell>
  );
}
