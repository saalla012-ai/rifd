import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/dashboard/usage")({
  head: () => ({ meta: [{ title: "الاستخدام — رِفد" }] }),
  component: () => (
    <DashboardShell>
      <h1 className="text-2xl font-extrabold">الاستخدام هذا الشهر</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex justify-between text-sm"><span className="font-bold">توليدات نصية</span><span>23 / ∞</span></div>
          <Progress value={100} className="mt-3" />
          <p className="mt-2 text-xs text-success">✓ غير محدودة في باقتك</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex justify-between text-sm"><span className="font-bold">توليدات صور</span><span>12 / 60</span></div>
          <Progress value={20} className="mt-3" />
          <p className="mt-2 text-xs text-muted-foreground">يتجدد في 1 من الشهر القادم</p>
        </div>
      </div>
    </DashboardShell>
  ),
});
