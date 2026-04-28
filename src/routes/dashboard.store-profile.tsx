import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  Loader2,
  Sparkles,
  Store,
  Truck,
  ShieldCheck,
  Megaphone,
} from "lucide-react";
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
    brand_personality: "",
    unique_selling_point: "",
    banned_phrases: "",
    shipping_policy: "",
    exchange_policy: "",
    faq_notes: "",
    high_margin_products: "",
    cta_style: "",
    seasonal_priorities: "",
    compliance_notes: "",
  });
  const [saving, setSaving] = useState(false);

  const sections = useMemo(
    () => [
      {
        title: "هوية المتجر",
        icon: Store,
        keys: [
          "store_name",
          "product_type",
          "audience",
          "tone",
          "brand_color",
          "brand_personality",
          "unique_selling_point",
        ],
      },
      {
        title: "تشغيل البيع",
        icon: Megaphone,
        keys: ["cta_style", "high_margin_products", "seasonal_priorities", "faq_notes"],
      },
      { title: "السياسات والثقة", icon: Truck, keys: ["shipping_policy", "exchange_policy"] },
      {
        title: "الامتثال والحماية",
        icon: ShieldCheck,
        keys: ["banned_phrases", "compliance_notes"],
      },
    ],
    [],
  );

  useEffect(() => {
    if (profile) {
      setForm({
        store_name: profile.store_name ?? "",
        audience: profile.audience ?? "",
        tone: profile.tone ?? "",
        brand_color: profile.brand_color ?? "#1a5d3e",
        product_type: profile.product_type ?? "",
        brand_personality: profile.brand_personality ?? "",
        unique_selling_point: profile.unique_selling_point ?? "",
        banned_phrases: (profile.banned_phrases ?? []).join("، "),
        shipping_policy: profile.shipping_policy ?? "",
        exchange_policy: profile.exchange_policy ?? "",
        faq_notes: profile.faq_notes ?? "",
        high_margin_products: (profile.high_margin_products ?? []).join("، "),
        cta_style: profile.cta_style ?? "",
        seasonal_priorities: (profile.seasonal_priorities ?? []).join("، "),
        compliance_notes: profile.compliance_notes ?? "",
      });
    }
  }, [profile]);

  const completionKeys = [
    "store_name",
    "product_type",
    "audience",
    "tone",
    "brand_color",
    "brand_personality",
    "unique_selling_point",
    "cta_style",
    "shipping_policy",
    "exchange_policy",
  ] as const;

  const completionPct = Math.round(
    (completionKeys.filter((key) => String(form[key]).trim()).length / completionKeys.length) * 100,
  );

  const splitList = (value: string) =>
    value
      .split(/[\n،,]/)
      .map((item) => item.trim())
      .filter(Boolean);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        ...form,
        banned_phrases: splitList(form.banned_phrases),
        high_margin_products: splitList(form.high_margin_products),
        seasonal_priorities: splitList(form.seasonal_priorities),
        updated_at: new Date().toISOString(),
      })
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
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="max-w-5xl">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold">
                بناء المتجر — ذاكرة بيع لا مجرد ملف تعريفي
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                هنا نثبت ما يجعل العميل يشتري منك: الوعد، الجمهور، الاعتراضات، السياسات، المنتجات
                الأعلى قيمة والمواسم. كل حقل جيد هنا يجعل النص والصورة والفيديو أقرب للبيع وأقل
                عمومية.
              </p>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
              <div className="flex items-center gap-2 font-bold text-primary">
                <Sparkles className="h-4 w-4" />
                جاهزية البيع: {completionPct}%
              </div>
              <p className="mt-1 text-muted-foreground">
                كل حقل مكتمل يقلل التردد في المخرجات ويزيد وضوح زاوية الشراء.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              "رسائل مبنية على سبب الشراء لا على وصف المنتج فقط",
              "CTA يناسب قناتك: متجر، واتساب، إعلان أو ستوري",
              "ثقة أعلى عبر الشحن والاستبدال والأسئلة المتكررة",
            ].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm font-bold leading-6 text-foreground/85"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {sections.map((section) => {
              const filledCount = section.keys.filter((key) =>
                String(form[key as keyof typeof form]).trim(),
              ).length;
              return (
                <div
                  key={section.title}
                  className="rounded-xl border border-border bg-background p-4"
                >
                  <div className="flex items-center gap-2 font-bold">
                    <section.icon className="h-4 w-4 text-primary" />
                    {section.title}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {filledCount} / {section.keys.length} حقول مكتملة
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid gap-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-lg font-extrabold">هوية المتجر</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <Label>اسم المتجر</Label>
                <Input
                  className="mt-1"
                  value={form.store_name}
                  onChange={(e) => setForm({ ...form, store_name: e.target.value })}
                />
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
              <div className="md:col-span-2">
                <Label>الجمهور المستهدف</Label>
                <Textarea
                  className="mt-1"
                  value={form.audience}
                  onChange={(e) => setForm({ ...form, audience: e.target.value })}
                  placeholder="مثلاً: نساء 23-40 يبحثن عن هدايا أنيقة أو عطور راقية للاستخدام اليومي"
                />
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
                  <Input
                    className="font-mono"
                    value={form.brand_color}
                    onChange={(e) => setForm({ ...form, brand_color: e.target.value })}
                  />
                  <input
                    type="color"
                    value={form.brand_color}
                    onChange={(e) => setForm({ ...form, brand_color: e.target.value })}
                    className="h-9 w-12 cursor-pointer rounded border border-input"
                  />
                </div>
              </div>
              <div>
                <Label>شخصية العلامة</Label>
                <Input
                  className="mt-1"
                  value={form.brand_personality}
                  onChange={(e) => setForm({ ...form, brand_personality: e.target.value })}
                  placeholder="مثلاً: راقية، قريبة، موثوقة، أنثوية"
                />
              </div>
              <div>
                <Label>الوعد البيعي / سبب الشراء منك</Label>
                <Input
                  className="mt-1"
                  value={form.unique_selling_point}
                  onChange={(e) => setForm({ ...form, unique_selling_point: e.target.value })}
                  placeholder="ما الذي يميز متجرك فعلاً عن المنافسين؟"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-lg font-extrabold">تشغيل البيع والمحتوى</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <Label>دعوة الشراء المفضلة</Label>
                <Input
                  className="mt-1"
                  value={form.cta_style}
                  onChange={(e) => setForm({ ...form, cta_style: e.target.value })}
                  placeholder="مثلاً: اطلب الآن / شاهد المجموعة / احجز عبر واتساب"
                />
              </div>
              <div>
                <Label>المنتجات التي تستحق دفع البيع لها</Label>
                <Textarea
                  className="mt-1"
                  value={form.high_margin_products}
                  onChange={(e) => setForm({ ...form, high_margin_products: e.target.value })}
                  placeholder="افصل بينها بفاصلة: عطر 100مل، بوكس هدايا فاخر، اشتراك شهري"
                />
              </div>
              <div>
                <Label>الأولويات الموسمية</Label>
                <Textarea
                  className="mt-1"
                  value={form.seasonal_priorities}
                  onChange={(e) => setForm({ ...form, seasonal_priorities: e.target.value })}
                  placeholder="رمضان، العيد، الجمعة البيضاء، العودة للمدارس..."
                />
              </div>
              <div>
                <Label>اعتراضات وأسئلة ما قبل الشراء</Label>
                <Textarea
                  className="mt-1"
                  value={form.faq_notes}
                  onChange={(e) => setForm({ ...form, faq_notes: e.target.value })}
                  placeholder="ما أكثر ما يجعل العميل يتردد؟ السعر، المقاس، الثبات، الشحن، الضمان، الخامة..."
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-lg font-extrabold">السياسات والثقة</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <Label>سياسة الشحن</Label>
                <Textarea
                  className="mt-1"
                  value={form.shipping_policy}
                  onChange={(e) => setForm({ ...form, shipping_policy: e.target.value })}
                  placeholder="مثلاً: شحن خلال 24-48 ساعة داخل المدن الرئيسية"
                />
              </div>
              <div>
                <Label>سياسة الاستبدال / الاسترجاع</Label>
                <Textarea
                  className="mt-1"
                  value={form.exchange_policy}
                  onChange={(e) => setForm({ ...form, exchange_policy: e.target.value })}
                  placeholder="مثلاً: الاستبدال خلال 7 أيام بشرط سلامة المنتج"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-lg font-extrabold">الامتثال والحماية</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <Label>كلمات أو وعود ممنوعة</Label>
                <Textarea
                  className="mt-1"
                  value={form.banned_phrases}
                  onChange={(e) => setForm({ ...form, banned_phrases: e.target.value })}
                  placeholder="مثلاً: الأفضل مطلقاً، علاج مضمون، نتيجة مضمونة 100%"
                />
              </div>
              <div>
                <Label>ملاحظات الامتثال</Label>
                <Textarea
                  className="mt-1"
                  value={form.compliance_notes}
                  onChange={(e) => setForm({ ...form, compliance_notes: e.target.value })}
                  placeholder="أي حدود تنظيمية أو لغوية يجب مراعاتها في محتوى متجرك"
                />
              </div>
            </div>
          </section>

          <div className="rounded-2xl border border-success/20 bg-success/5 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
              <div>
                <h3 className="font-bold">ما النتيجة المتوقعة بعد تعبئة هذه الصفحة؟</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  سيصبح رِفد أقدر على إنتاج إعلان مدروس، وصف منتج يزيل التردد، صورة تناسب السوق
                  السعودي، سكربت فيديو قصير، منشور عرض مباشر، ودعوة شراء واضحة مرتبطة بمتجرك لا
                  بنموذج عام.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={save}
            disabled={saving}
            className="gradient-primary text-primary-foreground"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> جاري الحفظ...
              </>
            ) : (
              "حفظ ذاكرة البيع"
            )}
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}
