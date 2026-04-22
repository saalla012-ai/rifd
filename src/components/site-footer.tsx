import { Link } from "@tanstack/react-router";
import { Sparkles, Mail, MessageCircle, ShieldCheck } from "lucide-react";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 font-bold">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary text-primary-foreground">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="text-lg">رِفد للتقنية</span>
            </Link>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              رِفد للأعمال: حلول التحول التجاري بالذكاء الاصطناعي للمتاجر السعودية — محتوى، صور، حملات، ومسارات تشغيل تتطور شهرياً.
            </p>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/5 px-3 py-1.5 text-[11px] font-bold text-success">
              <ShieldCheck className="h-3.5 w-3.5" />
              متوافق مع نظام حماية البيانات الشخصية السعودي (PDPL)
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold text-foreground">المنتج</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/library" className="text-muted-foreground hover:text-foreground">المكتبة</Link></li>
              <li><Link to="/proof-center" className="text-muted-foreground hover:text-foreground">مركز الإثبات</Link></li>
              <li><Link to="/pricing" className="text-muted-foreground hover:text-foreground">الأسعار</Link></li>
              <li><Link to="/business-solutions" className="text-muted-foreground hover:text-foreground">رِفد للأعمال</Link></li>
              <li><Link to="/vs-chatgpt" className="text-muted-foreground hover:text-foreground">رِفد vs ChatGPT</Link></li>
              <li><Link to="/onboarding" className="text-muted-foreground hover:text-foreground">جرّب مجاناً</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold text-foreground">الشركة والتواصل</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="text-muted-foreground hover:text-foreground">من نحن</Link></li>
              <li><Link to="/contact" className="text-muted-foreground hover:text-foreground">تواصل معنا</Link></li>
              <li><Link to="/legal/privacy" className="text-muted-foreground hover:text-foreground">سياسة الخصوصية</Link></li>
              <li><Link to="/legal/terms" className="text-muted-foreground hover:text-foreground">الشروط والأحكام</Link></li>
              <li><Link to="/legal/refund" className="text-muted-foreground hover:text-foreground">سياسة الاسترجاع</Link></li>
              <li>
                <a href="mailto:hello@rifd.site" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <span>hello@rifd.site</span>
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/966582286215"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>واتساب الدعم</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <span>© {year} رِفد للأعمال — مسجَّلة في المملكة العربية السعودية. جميع الحقوق محفوظة.</span>
          <span className="flex items-center gap-2">
            صُنع بحب 🇸🇦 في الرياض
          </span>
        </div>
      </div>
    </footer>
  );
}
