import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing-layout";

export const Route = createFileRoute("/legal/terms")({
  head: () => ({ meta: [{ title: "الشروط والأحكام — رِفد" }] }),
  component: () => (
    <MarketingLayout>
      <article className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-extrabold">الشروط والأحكام</h1>
        <p className="mt-2 text-sm text-muted-foreground">آخر تحديث: 17 أبريل 2026</p>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>باستخدامك لمنصة رِفد، فإنك توافق على هذه الشروط.</p>
          <h2 className="text-lg font-bold text-foreground">الاستخدام المقبول</h2>
          <p>يُمنع استخدام المنصة لتوليد محتوى مخالف للقوانين السعودية أو الآداب العامة.</p>
          <h2 className="text-lg font-bold text-foreground">الملكية الفكرية</h2>
          <p>المحتوى الذي تولّده ملكك الكامل. يحق لك استخدامه تجارياً بدون أي قيود.</p>
          <h2 className="text-lg font-bold text-foreground">الإلغاء</h2>
          <p>يحق لك إلغاء اشتراكك في أي وقت بدون رسوم. يحق لرِفد إيقاف أي حساب يخالف الشروط.</p>
        </div>
      </article>
    </MarketingLayout>
  ),
});
