import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "الإعدادات — رِفد" }] }),
  component: () => (
    <DashboardShell>
      <h1 className="text-2xl font-extrabold">الإعدادات</h1>
      <div className="mt-6 max-w-2xl space-y-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h3 className="mb-3 font-bold">معلومات الحساب</h3>
          <div className="grid gap-3">
            <div><Label>الاسم</Label><Input className="mt-1" defaultValue="أحمد العتيبي" /></div>
            <div><Label>البريد</Label><Input className="mt-1" type="email" defaultValue="ahmed@example.com" /></div>
          </div>
          <Button className="mt-4 gradient-primary text-primary-foreground">حفظ</Button>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h3 className="mb-3 font-bold">الإشعارات</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between text-sm"><span>إشعارات البريد</span><Switch defaultChecked /></label>
            <label className="flex items-center justify-between text-sm"><span>تنبيهات الحصة</span><Switch defaultChecked /></label>
            <label className="flex items-center justify-between text-sm"><span>عروض ترويجية</span><Switch /></label>
          </div>
        </div>
      </div>
    </DashboardShell>
  ),
});
