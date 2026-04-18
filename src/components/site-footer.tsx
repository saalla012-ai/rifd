import { Link } from "@tanstack/react-router";
import { Sparkles, Mail } from "lucide-react";

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
              منصة سعودية ذكية تحوّل متجرك إلى آلة محتوى — نصوص وصور بالعامية السعودية،
              مدعومة بـChatGPT و Gemini، بدون هندسة برومبتات.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              سجل تجاري: 1010XXXXXX • الرقم الضريبي: 3XXXXXXXXXXXX003
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold text-foreground">المنتج</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/library" className="text-muted-foreground hover:text-foreground">المكتبة</Link></li>
              <li><Link to="/pricing" className="text-muted-foreground hover:text-foreground">الأسعار</Link></li>
              <li><Link to="/vs-chatgpt" className="text-muted-foreground hover:text-foreground">رِفد vs ChatGPT</Link></li>
              <li><Link to="/onboarding" className="text-muted-foreground hover:text-foreground">جرّب مجاناً</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold text-foreground">الشركة</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="text-muted-foreground hover:text-foreground">من نحن</Link></li>
              <li><Link to="/legal/privacy" className="text-muted-foreground hover:text-foreground">سياسة الخصوصية</Link></li>
              <li><Link to="/legal/terms" className="text-muted-foreground hover:text-foreground">الشروط والأحكام</Link></li>
              <li><Link to="/legal/refund" className="text-muted-foreground hover:text-foreground">سياسة الاسترجاع</Link></li>
              <li>
                <a href="mailto:hello@rifd.tech" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                  <Mail className="h-3.5 w-3.5" /> hello@rifd.tech
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <span>© {year} رِفد للتقنية. جميع الحقوق محفوظة.</span>
          <span className="flex items-center gap-2">
            صُنع بحب 🇸🇦 في الرياض
          </span>
        </div>
      </div>
    </footer>
  );
}
