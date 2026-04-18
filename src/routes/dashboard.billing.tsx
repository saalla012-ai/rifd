import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/billing")({
  head: () => ({ meta: [{ title: "الفواتير — رِفد" }] }),
  component: () => (
    <DashboardShell>
      <h1 className="text-2xl font-extrabold">الفواتير والاشتراك</h1>
      <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold">باقتك الحالية: احترافي</h3>
            <p className="text-sm text-muted-foreground">79 ر.س / شهرياً • التجديد القادم: 17 مايو 2026</p>
          </div>
          <Button asChild variant="outline"><Link to="/pricing">تغيير الباقة</Link></Button>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        لم يتم إنشاء أي فواتير بعد. ربط الدفع الفعلي يصير في الموجة 3.
      </div>
    </DashboardShell>
  ),
});
