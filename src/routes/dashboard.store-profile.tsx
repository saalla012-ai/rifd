import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/dashboard/store-profile")({
  head: () => ({ meta: [{ title: "ملف متجري — رِفد" }] }),
  component: StoreProfilePage,
});

function StoreProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    store_name: "",
    audience: "",
    tone: "",
    brand_color: "#1a5d3e",
    product_type: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        store_name: profile.store_name ?? "",
        audience: profile.audience ?? "",
        tone: profile.tone ?? "",
        brand_color: profile.brand_color ?? "#1a5d3e",
        product_type: profile.product_type ?? "",
      });
    }
  }, [profile]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("تم الحفظ ✓");
    void refreshProfile();
  };

  if (!profile) {
    return (
      <DashboardShell>
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <h1 className="text-2xl font-extrabold">ملف متجري (الذاكرة الذكية)</h1>
      <p className="mt-1 text-sm text-muted-foreground">كل ما تكتبه هنا، نستخدمه في كل توليدة قادمة</p>
      <div className="mt-6 grid max-w-2xl gap-4 rounded-xl border border-border bg-card p-6 shadow-soft">
        <div>
          <Label>اسم المتجر</Label>
          <Input className="mt-1" value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} />
        </div>
        <div>
          <Label>نوع المتجر</Label>
          <select
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.product_type}
            onChange={(e) => setForm({ ...form, product_type: e.target.value })}
          >
            <option value="">— اختر —</option>
            <option value="dropshipping">دروبشيبنق</option>
            <option value="fashion">أزياء وملابس</option>
            <option value="beauty">تجميل وعناية</option>
            <option value="food">مأكولات</option>
            <option value="electronics">إلكترونيات</option>
            <option value="services">خدمات</option>
            <option value="handmade">منتجات يدوية</option>
            <option value="other">آخر</option>
          </select>
        </div>
        <div>
          <Label>الجمهور المستهدف</Label>
          <Textarea className="mt-1" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} placeholder="مثلاً: شباب 20-35، مهتمين بالعطور الفاخرة" />
        </div>
        <div>
          <Label>النبرة المفضلة</Label>
          <select
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.tone}
            onChange={(e) => setForm({ ...form, tone: e.target.value })}
          >
            <option value="">— اختر —</option>
            <option value="fun">مرح وقريب</option>
            <option value="pro">احترافي ورصين</option>
            <option value="warm">دافئ وعاطفي</option>
            <option value="bold">جريء وحماسي</option>
          </select>
        </div>
        <div>
          <Label>اللون الأساسي للهوية</Label>
          <div className="mt-1 flex items-center gap-2">
            <Input className="font-mono" value={form.brand_color} onChange={(e) => setForm({ ...form, brand_color: e.target.value })} />
            <input type="color" value={form.brand_color} onChange={(e) => setForm({ ...form, brand_color: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-input" />
          </div>
        </div>
        <Button onClick={save} disabled={saving} className="gradient-primary text-primary-foreground">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري الحفظ...</> : "حفظ التغييرات"}
        </Button>
      </div>
    </DashboardShell>
  );
}
