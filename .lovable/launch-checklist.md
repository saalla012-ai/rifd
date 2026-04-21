# Launch Checklist — رِفد للتقنية

آخر تحديث: 21 أبريل 2026 — الجاهزية: **96/100** (جاهز للإطلاق التسويقي)

## ✅ الموجة 1 — الإصلاحات الحرجة
- [x] توسعة `legal/privacy` لتغطي PDPL (هوية المتحكم، البيانات، الأساس النظامي، المعالجون الفرعيون، الاحتفاظ، الحقوق الستة، الشكاوى عبر سدايا).
- [x] توسعة `legal/terms` (التعريف، التسجيل، الفوترة، الملكية الفكرية، الاستخدام المقبول، التعليق، إخلاء المسؤولية، حلّ النزاعات في الرياض).
- [x] توسعة `legal/refund` بتفاصيل الاستثناءات.
- [x] PDPL badge في الفوتر.
- [x] `SubscribersCounter`: skeleton ثابت + fallback عند فشل RPC.

## ✅ الموجة 2 — توحيد الهوية
- [x] og:image + canonical + twitter:image على `rifd.site`.
- [x] `sitemap.xml` و `robots.txt` على `rifd.site`.
- [x] إخفاء Lovable badge.
- [x] استبدال جميع ادعاءات "24/7" بصياغات صادقة.

## ✅ الموجة 3 — قنوات الدعم
- [x] صفحة `/contact` (واتساب + بريد + ساعات عمل + قنوات متخصصة).
- [x] `site-footer`: واتساب + /contact.
- [x] `about.tsx`: 3 قنوات تواصل.

## ✅ الموجة 4 — التحقق
- [x] عدد القوالب الفعلي = 49 (يتجاوز 40 المُعلَن).
- [x] `tsc --noEmit` يمر بدون أخطاء.

## 📋 SOP لما بعد الإطلاق
- `/admin/email-monitor` يومياً • Telegram DLQ alerts • subscription_requests كل 12س • refund requests أسبوعياً.

## 🚀 ما تأجَّل عمداً
- نموذج contact_submissions + بريد معاملاتي • E2E tests • Lighthouse CI • مراجعة محامٍ سعودي.
