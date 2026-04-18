import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing-layout";

export const Route = createFileRoute("/legal/privacy")({
  head: () => ({ meta: [{ title: "سياسة الخصوصية — رِفد" }] }),
  component: () => (
    <MarketingLayout>
      <article className="mx-auto max-w-3xl px-4 py-12 prose-headings:font-extrabold">
        <h1 className="text-3xl font-extrabold">سياسة الخصوصية</h1>
        <p className="mt-2 text-sm text-muted-foreground">آخر تحديث: 17 أبريل 2026</p>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>تلتزم رِفد للتقنية بحماية خصوصية مستخدميها وفق نظام حماية البيانات الشخصية السعودي (PDPL).</p>
          <h2 className="text-lg font-bold text-foreground">البيانات التي نجمعها</h2>
          <ul className="list-disc pr-5 space-y-1">
            <li>معلومات الحساب: الاسم، البريد، كلمة السر المشفرة</li>
            <li>ملف المتجر: اسم المتجر، نوع المنتجات، الجمهور</li>
            <li>المحتوى المُولَّد: لتحسين الخدمة فقط، ولا نشاركه مع أي طرف</li>
          </ul>
          <h2 className="text-lg font-bold text-foreground">حقوقك</h2>
          <p>لك الحق في الوصول لبياناتك وتعديلها وحذفها في أي وقت. للتواصل: privacy@rifd.tech</p>
        </div>
      </article>
    </MarketingLayout>
  ),
});
