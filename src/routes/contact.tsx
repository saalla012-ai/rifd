import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing-layout";
import { Mail, MessageCircle, MapPin, Clock } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تواصل معنا — رِفد للأعمال" },
      {
        name: "description",
        content:
          "تواصل مع فريق رِفد للأعمال عبر البريد أو واتساب. نرد على جميع الاستفسارات خلال ساعات العمل (9 ص – 12 ص بتوقيت الرياض).",
      },
      { property: "og:title", content: "تواصل معنا — رِفد للأعمال" },
      { property: "og:description", content: "اختر القناة الأنسب لك: واتساب أو بريد، ونرد عليك خلال ساعات العمل." },
      { name: "twitter:title", content: "تواصل معنا — رِفد للأعمال" },
      { name: "twitter:description", content: "اختر القناة الأنسب لك: واتساب أو بريد، ونرد عليك خلال ساعات العمل." },
    ],
    links: [{ rel: "canonical", href: "https://rifd.site/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <MarketingLayout>
      <section className="gradient-hero py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1 className="text-4xl font-extrabold sm:text-5xl">
            تواصل معنا <span className="text-gradient-primary">مباشرة</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            نحن هنا لمساعدتك. اختر القناة الأنسب لك ونرد عليك في أقرب وقت.
          </p>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="mx-auto max-w-3xl px-4">
          <div className="grid gap-5 sm:grid-cols-2">
            <a
              href="https://wa.me/966582286215"
              target="_blank"
              rel="noreferrer noopener"
              className="group rounded-2xl border border-success/30 bg-success/5 p-6 transition-all hover:border-success hover:shadow-elegant"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/15 text-success">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-lg font-bold">واتساب — الأسرع</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                رد مباشر من المؤسس خلال دقائق ضمن ساعات العمل
              </p>
              <div className="mt-3 text-sm font-bold text-success" dir="ltr">
                +966 58 228 6215
              </div>
            </a>

            <a
              href="mailto:hello@rifd.site"
              className="group rounded-2xl border border-primary/30 bg-primary/5 p-6 transition-all hover:border-primary hover:shadow-elegant"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Mail className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-lg font-bold">البريد الإلكتروني</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                للاستفسارات التفصيلية والشراكات والاقتراحات
              </p>
              <div className="mt-3 text-sm font-bold text-primary">hello@rifd.site</div>
            </a>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Clock className="h-4 w-4 text-primary" />
                ساعات العمل
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                السبت – الخميس: 9:00 ص – 12:00 ص
                <br />
                الجمعة: 4:00 م – 12:00 ص (بتوقيت الرياض GMT+3)
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                المقر
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                رِفد للأعمال — مدينة الرياض
                <br />
                المملكة العربية السعودية 🇸🇦
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-border bg-secondary/30 p-5">
            <h3 className="text-sm font-bold text-foreground">قنوات متخصصة</h3>
            <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <li>
                <span className="text-muted-foreground">الدعم الفني: </span>
                <a className="text-primary hover:underline" href="mailto:support@rifd.site">support@rifd.site</a>
              </li>
              <li>
                <span className="text-muted-foreground">الخصوصية: </span>
                <a className="text-primary hover:underline" href="mailto:privacy@rifd.site">privacy@rifd.site</a>
              </li>
              <li>
                <span className="text-muted-foreground">الاسترجاع: </span>
                <a className="text-primary hover:underline" href="mailto:refund@rifd.site">refund@rifd.site</a>
              </li>
              <li>
                <span className="text-muted-foreground">الشراكات: </span>
                <a className="text-primary hover:underline" href="mailto:hello@rifd.site">hello@rifd.site</a>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
