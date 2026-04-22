import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing-layout";
import { ShieldCheck, Mail, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/legal/refund")({
  head: () => ({
    meta: [
      { title: "سياسة الاسترجاع — رِفد للتقنية" },
      {
        name: "description",
        content:
          "ضمان استرجاع 7 أيام كامل على باقات رِفد للتقنية. شروط الاسترجاع، الاستثناءات، وكيفية تقديم الطلب.",
      },
    ],
  }),
  component: () => (
    <MarketingLayout>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-3 text-3xl font-extrabold">ضمان الاسترجاع 7 أيام</h1>
          <p className="mt-2 text-muted-foreground">جرّب رِفد بدون مخاطرة</p>
        </div>

        <div className="mt-8 space-y-6 text-[15px] leading-[1.85] text-muted-foreground">
          <p className="text-foreground">
            إذا لم تعجبك تجربة رِفد خلال أول <strong>7 أيام</strong> من تاريخ تفعيل
            اشتراكك المدفوع، نُعيد لك المبلغ كاملاً بدون أسئلة وبدون تعقيد.
          </p>

          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">كيف تطلب الاسترجاع؟</h2>
            <ol className="list-decimal space-y-2 pr-5">
              <li>أرسل بريداً إلى <a className="text-primary hover:underline" href="mailto:refund@rifd.site">refund@rifd.site</a> من نفس البريد المسجَّل في حسابك.</li>
              <li>اذكر سبب الاسترجاع (اختياري — لتحسين الخدمة فقط).</li>
              <li>نُعالج الطلب خلال <strong>3 أيام عمل</strong> ويعود المبلغ لحسابك خلال <strong>5–10 أيام عمل</strong> بحسب البنك.</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">شروط الاستحقاق</h2>
            <ul className="list-disc space-y-1 pr-5">
              <li>أن يكون الطلب خلال 7 أيام من تاريخ تفعيل أول اشتراك مدفوع.</li>
              <li>أن يكون من نفس البريد المسجَّل في الحساب.</li>
              <li>أن لا يكون الحساب موقوفاً بسبب انتهاك شروط الاستخدام.</li>
            </ul>
          </section>

          <section className="rounded-xl border border-warning/30 bg-warning/5 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <div>
                <h2 className="text-lg font-bold text-foreground">الاستثناءات</h2>
                <p className="mt-1 text-sm">
                  ضماناً للعدالة بين جميع المستخدمين، لا يشمل الاسترجاع الحالات التالية:
                </p>
                <ul className="mt-2 list-disc space-y-1 pr-5 text-sm">
                  <li>الباقات الإضافية للصور (Add-ons) — لاستهلاكها الفوري للمصادر.</li>
                  <li>التجديدات التلقائية بعد المدة الأولى (يمكن إلغاؤها قبل التجديد).</li>
                  <li>الحسابات التي تجاوزت 70% من الحصة الشهرية للاستخدام.</li>
                  <li>طلبات الاسترجاع المتكررة من نفس المستخدم خلال 12 شهراً.</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">إلغاء الاشتراك بدون استرجاع</h2>
            <p>
              يمكنك إلغاء التجديد التلقائي في أي وقت من <strong>لوحة التحكم → الفوترة</strong>.
              ستستمر خدمتك حتى نهاية الفترة المدفوعة، ثم يتحوّل الحساب تلقائياً للخطة المجانية
              مع الاحتفاظ بكل المحتوى المُولَّد.
            </p>
          </section>

          <div className="rounded-2xl border border-primary/20 bg-secondary/40 p-6 text-center">
            <p className="text-sm text-muted-foreground">للاستفسار قبل تقديم طلب الاسترجاع:</p>
            <a
              href="mailto:refund@rifd.site"
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              <Mail className="h-4 w-4" />
              refund@rifd.site
            </a>
          </div>
        </div>
      </article>
    </MarketingLayout>
  ),
});
