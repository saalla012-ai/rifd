import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  formatSaudiPhoneDisplay,
  normalizeSaudiPhone,
  validateSaudiPhone,
  SAUDI_PHONE_ERROR,
  SAUDI_PHONE_PLACEHOLDER,
} from "@/lib/phone";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "الإعدادات — رِفد" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      // Show stored value in pretty form if normalizable, else raw
      setWhatsapp(profile.whatsapp ? formatSaudiPhoneDisplay(profile.whatsapp) : "");
    }
  }, [profile]);

  const save = async () => {
    if (!user) return;
    // رقم الواتساب مطلوب دائماً (لا يمكن مسحه)
    if (!whatsapp.trim() || !validateSaudiPhone(whatsapp)) {
      toast.error(SAUDI_PHONE_ERROR);
      return;
    }
    const normalizedWhatsapp = normalizeSaudiPhone(whatsapp)!;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          whatsapp: normalizedWhatsapp,
        })
        .eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("تم حفظ الإعدادات");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <DashboardShell>
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <h1 className="text-2xl font-extrabold">الإعدادات</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        أدر معلومات حسابك وتفضيلاتك
      </p>

      <div className="mt-6 max-w-2xl space-y-4">
        {/* معلومات الحساب */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h3 className="mb-4 font-bold">معلومات الحساب</h3>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                className="mt-1 bg-muted"
                type="email"
                value={user?.email ?? ""}
                disabled
                readOnly
              />
              <p className="mt-1 text-xs text-muted-foreground">
                لا يمكن تغيير البريد من هنا
              </p>
            </div>
            <div>
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input
                id="fullName"
                className="mt-1"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="اسمك"
                maxLength={80}
              />
            </div>
            <div>
              <Label htmlFor="whatsapp">رقم واتساب (اختياري)</Label>
              <Input
                id="whatsapp"
                className="mt-1 ltr"
                dir="ltr"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder={SAUDI_PHONE_PLACEHOLDER}
                maxLength={20}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                رقم جوال سعودي يبدأ بـ 5 — نستخدمه فقط للتواصل بخصوص اشتراكك
              </p>
            </div>
          </div>
          <Button
            onClick={save}
            disabled={saving}
            className="mt-5 gradient-primary text-primary-foreground"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                حفظ التعديلات
              </>
            )}
          </Button>
        </div>

        {/* الإشعارات (قريباً) */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft opacity-60">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold">الإشعارات</h3>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
              قريباً
            </span>
          </div>
          <div className="space-y-3">
            <label className="flex items-center justify-between text-sm">
              <span>إشعارات البريد</span>
              <Switch disabled />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span>تنبيهات اقتراب حدّ الباقة</span>
              <Switch disabled />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span>عروض ترويجية</span>
              <Switch disabled />
            </label>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
