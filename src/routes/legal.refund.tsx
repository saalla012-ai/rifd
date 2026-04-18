import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing-layout";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/legal/refund")({
  head: () => ({ meta: [{ title: "سياسة الاسترجاع — رِفد" }] }),
  component: () => (
    <MarketingLayout>
      <article className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-3 text-3xl font-extrabold">ضمان الاسترجاع 7 أيام</h1>
          <p className="mt-2 text-muted-foreground">جرّب رِفد بدون مخاطرة</p>
        </div>
        <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>إذا ما عجبتك تجربة رِفد خلال أول 7 أيام من اشتراكك، نرجع لك المبلغ كامل بدون أسئلة.</p>
          <h2 className="text-lg font-bold text-foreground">كيف تطلب استرجاع؟</h2>
          <ol className="list-decimal pr-5 space-y-1">
            <li>أرسل بريد إلى refund@rifd.tech من نفس البريد المسجّل</li>
            <li>اذكر سبب الاسترجاع (لتحسين الخدمة فقط)</li>
            <li>نعالج الطلب خلال 3 أيام عمل ويعود المبلغ خلال 5-10 أيام عمل</li>
          </ol>
          <p className="mt-4 text-xs">ملاحظة: الاسترجاع متاح لأول اشتراك فقط، ولا يشمل الباقات الإضافية للصور.</p>
        </div>
      </article>
    </MarketingLayout>
  ),
});
