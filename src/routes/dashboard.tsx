import { createFileRoute, Link } from "@tanstack/react-router";
import { Wand2, Image as ImageIcon, Sparkles, TrendingUp, Clock, Star } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "لوحة التحكم — رِفد" }] }),
  component: DashboardPage,
});

const RECENT = [
  { title: "منشور إنستقرام لإطلاق العطر", time: "قبل ساعة", type: "نص" },
  { title: "بوستر جمعة بيضاء", time: "قبل 3 ساعات", type: "صورة" },
  { title: "وصف منتج عبايات", time: "أمس", type: "نص" },
  { title: "إعلان ميتا", time: "أمس", type: "نص" },
];

function DashboardPage() {
  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold">مرحباً 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          هذي نظرة سريعة على نشاطك في رِفد
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "توليدات نصية", value: "23 / ∞", icon: Wand2, color: "text-primary" },
          { label: "توليدات صور", value: "12 / 60", icon: ImageIcon, color: "text-gold" },
          { label: "المفضلة", value: "8", icon: Star, color: "text-warning" },
          { label: "الباقة", value: "احترافي", icon: Sparkles, color: "text-success" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <div className="mt-2 text-2xl font-extrabold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-soft">
          <h3 className="text-base font-bold">إجراءات سريعة ⚡</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              { to: "/dashboard/generate-text", label: "📱 منشور إنستقرام" },
              { to: "/dashboard/generate-text", label: "🛍️ وصف منتج" },
              { to: "/dashboard/generate-image", label: "🎨 بوستر إعلاني" },
              { to: "/dashboard/generate-image", label: "📸 تحسين صورة" },
            ].map((q) => (
              <Button key={q.label} asChild variant="outline" className="justify-start">
                <Link to={q.to}>{q.label}</Link>
              </Button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h3 className="text-base font-bold">حصة الصور</h3>
          <Progress value={20} className="mt-3" />
          <p className="mt-2 text-xs text-muted-foreground">12 من 60 صورة هذا الشهر</p>
          <Button asChild size="sm" variant="link" className="mt-2 h-auto p-0 text-primary">
            <Link to="/dashboard/usage">عرض التفاصيل ←</Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold">آخر التوليدات</h3>
          <Button asChild variant="ghost" size="sm" className="text-primary">
            <Link to="/dashboard/library">عرض الكل ←</Link>
          </Button>
        </div>
        <ul className="mt-3 divide-y divide-border">
          {RECENT.map((r, i) => (
            <li key={i} className="flex items-center justify-between py-3 text-sm">
              <span className="font-medium">{r.title}</span>
              <span className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="rounded-full bg-secondary px-2 py-0.5">{r.type}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {r.time}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 font-bold">
              <TrendingUp className="h-4 w-4 text-primary" /> ملف متجرك مكتمل بنسبة 80%
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              أكمل المعلومات للحصول على نتائج أكثر تخصصاً
            </p>
          </div>
          <Button asChild size="sm">
            <Link to="/dashboard/store-profile">إكمال</Link>
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}
