import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/dashboard/store-profile")({
  head: () => ({ meta: [{ title: "ملف متجري — رِفد" }] }),
  component: () => (
    <DashboardShell>
      <h1 className="text-2xl font-extrabold">ملف متجري (الذاكرة الذكية)</h1>
      <p className="mt-1 text-sm text-muted-foreground">كل ما تكتبه هنا، نستخدمه في كل توليدة قادمة</p>
      <div className="mt-6 grid max-w-2xl gap-4 rounded-xl border border-border bg-card p-6 shadow-soft">
        <div><Label>اسم المتجر</Label><Input className="mt-1" defaultValue="متجر النور" /></div>
        <div><Label>وصف المتجر</Label><Textarea className="mt-1" defaultValue="متجر عطور سعودية فاخرة" /></div>
        <div><Label>الجمهور المستهدف</Label><Input className="mt-1" defaultValue="شباب 20-35" /></div>
        <div><Label>النبرة المفضلة</Label><Input className="mt-1" defaultValue="مرح وقريب" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>اللون الأساسي</Label><Input className="mt-1 font-mono" defaultValue="#1a5d3e" /></div>
          <div><Label>رابط الشعار</Label><Input className="mt-1" placeholder="https://..." /></div>
        </div>
        <Button className="gradient-primary text-primary-foreground">حفظ التغييرات</Button>
      </div>
    </DashboardShell>
  ),
});
