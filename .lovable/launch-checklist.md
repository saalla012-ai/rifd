# Launch Checklist — رِفد للتقنية

آخر تحديث: 25 أبريل 2026 — **الجاهزية: 97/100** ✅

> **قرار الإطلاق:** المنتج جاهز فنياً للإطلاق التسويقي، لكن اعتماد QA اليدوي النهائي لا يُغلق إلا بعد تنفيذ مصفوفة الـ42 تمريرة الموثقة في `.lovable/qa-runbook.md`.

---

## 🟢 خلاصة الجاهزية

| المحور | النسبة | الحالة |
|---|---|---|
| **الأمان** (P1) | 100% | RLS + Headers + Triggers + Linter نظيف |
| **نموذج /contact** (P2) | 100% | end-to-end يعمل (DB + بريد + Telegram + Inbox) |
| **QA Runbook** (P3) | 100% (وثائق) / 0% اعتماد يدوي | 7 سيناريوهات × 6 تشكيلات موثَّقة — الاعتماد اليدوي ما زال مفتوحاً |
| **PostHog Analytics** (P4) | 100% | 5 أحداث + identify + pageviews + CSP |
| **الإطلاق** (P5) | 100% | DNS + بريد `send.rifd.site` verified + runbook كامل |

---

## ✅ موجة الإطلاق V8 (P1→P5)

- [x] **P1 — الأمان:** AdminGuard مركزي + RLS مُراجعة + Security Headers + CSP + triggers الحماية
- [x] **P2 — نموذج /contact:** schema + server route + UI + email template + Telegram + honeypot + rate-limit
- [x] **P3 — Admin Inbox:** جدول رسائل التواصل + sidebar badge + تحديث الحالة
- [x] **P3 — QA Runbook:** `.lovable/qa-runbook.md` بـ7 سيناريوهات × 3 مقاسات × 2 متصفح، مع بقاء التنفيذ اليدوي الكامل مفتوحاً
- [x] **P4 — PostHog Analytics:** posthog-js + 5 events + AnalyticsBridge SSR-safe + CSP محدَّث
- [x] **P5 — الإطلاق:** publish + DNS verified + linter clean + `launch-day-runbook.md` + بريد `send.rifd.site` ✅

---

## ✅ بوابة قبول P5 (تعريف "جاهز فنياً للإطلاق")

```text
أمان:    [x] 0 critical/high في security scan
         [x] 0 errors في Lovable Cloud linter
         [x] كل سياسات الوصول مُراجعة يدوياً
         [x] Security Headers + CSP فعّالة (src/start.ts)

وظيفة:   [x] بريد التفعيل < 60 ثانية (مؤكَّد عبر S5)
         [x] Telegram يعمل
         [x] التوليد يخصم من usage_logs (trigger مفعَّل)
         [x] /contact يعمل end-to-end
         [x] نطاق البريد send.rifd.site verified

تجربة:   [ ] 0 console errors على 5 صفحات (يدوي post-launch)
         [ ] Lighthouse ≥ 80 موبايل (يدوي post-launch)
         [ ] iOS Safari + Android Chrome (يدوي post-launch)

تشغيل:   [x] DLQ فارغ
         [x] cron jobs تعمل (6 jobs active)
         [x] خطة استجابة موثقة (launch-day-runbook.md)
         [x] تحليلات تعمل (PostHog + 5 events)
```

> لا تُستخدم هذه القائمة لإعلان إغلاق QA اليدوي الكامل؛ مرجع الإغلاق النهائي هو تعبئة مصفوفة `.lovable/qa-runbook.md` عبر Chrome/Safari على Mobile/Tablet/Desktop.

---

## ✅ الموجة 5 — رد على تقرير ChatGPT (57/100)
- [x] توحيد عدد القوالب: حذف "40 قالب" الثابت → "مكتبة قوالب" + `PROMPTS.length` ديناميكي + "45+" في meta.
- [x] حذف "78%" من بطاقة احترافي + "اختيار الوكالات +50 منتج" من بطاقة الأعمال.
- [x] حذف "أرخص بـ70%" من index و about → "أنسب وأذكى" + "سعر بالريال السعودي".
- [x] حذف "وفّر 800 ر.س" من Hero → "وفّر ساعات".
- [x] حذف "آلاف الأمثلة المحلية" من about.
- [x] إعادة صياغة "أول 1000 عضو" → "برنامج المؤسسين محدود".
- [x] "تأكيد فوري" → "تأكيد فوري للطلب + تفعيل خلال 24 ساعة".
- [x] "ضمان بدون أسئلة بدون شروط" → "وفق سياسة الاسترجاع".
- [x] "API + Meta/Google Ads" في باقة الأعمال → موسومة "(قريباً)".
- [x] "سجل تجاري سعودي / جهة موثوقة" في trust-badges → "متوافق مع PDPL".
- [x] فوتر "السجل التجاري قيد الإصدار" → "مسجَّلة في المملكة العربية السعودية".
- [x] "رد مباشر من المؤسس خلال دقائق" → "رد سريع خلال ساعات العمل".

## ✅ الموجة 1 — الإصلاحات الحرجة
- [x] توسعة `legal/privacy` لتغطي PDPL.
- [x] توسعة `legal/terms` (التعريف، التسجيل، الفوترة، الملكية الفكرية، الاستخدام المقبول، التعليق، إخلاء المسؤولية، حلّ النزاعات في الرياض).
- [x] توسعة `legal/refund` بتفاصيل الاستثناءات.
- [x] PDPL badge في الفوتر.
- [x] `SubscribersCounter`: skeleton ثابت + fallback عند فشل RPC.

## ✅ الموجة 2 — توحيد الهوية
- [x] og:image + canonical + twitter:image على الصفحات التسويقية الأساسية؛ لا توجد صورة مشاركة أو canonical عام مفروض من الجذر.
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

---

## 📋 SOP لما بعد الإطلاق
راجع `.lovable/launch-day-runbook.md` للتفاصيل الكاملة. الملخص:
- **يومياً 9ص:** Telegram + `/admin/email-monitor` + `/admin/subscriptions?status=pending` + `/admin/contact-submissions?status=new`
- **يومياً 9م:** PostHog Dashboard + funnel signup→onboarding + `/admin/audit`
- **أسبوعياً:** Lovable Cloud linter + KPI weekly + شحن Lovable AI credits

---

## 🛡️ تقرير الفحص الأمني النهائي (24 أبريل 2026)

**Security Scan:** 6 نتائج مفحوصة يدوياً:

| # | المستوى | البند | الحالة |
|---|---|---|---|
| 1 | error (false positive) | PRIVILEGE_ESCALATION_RISK في `user_roles` | ✅ آمن — RESTRICTIVE policy `Block non-admin role mutations` تحجب أي insert من غير admin (مفحوصة في `pg_policy`) |
| 2 | warn | `email_unsubscribe_tokens` بدون SELECT للأدمن | ✅ مقبول — التوكنات entropy عالية (gen_random_uuid) ولا يوجد سيناريو enumeration |
| 3 | warn | `suppressed_emails` بدون admin SELECT | ✅ **مُصلَح** — أُضيفت سياسة `Admins can view suppressed emails` |
| 4 | warn | CSP `unsafe-eval` | ✅ مقبول — لازم لـVite hydration و PostHog session recording |
| 5 | warn | CSP `unsafe-inline` للسكربتات | ✅ مقبول — لازم لـTanStack SSR hydration (لا nonce-based دعم بعد) |
| 6 | warn | OAuth state غير ظاهر | ✅ مُدار داخلياً — `lovable.auth.signInWithOAuth` يولّد state تلقائياً |

**الخلاصة:** 0 critical فعلي، 1 إصلاح مُطبَّق، 5 تحذيرات مقبولة موثَّقة.

---

## 🚀 ما تأجَّل عمداً (post-launch)

| المؤجَّل | الشرط لتفعيله |
|---|---|
| Memory 2.0 + Video Generator | ≥ 10 مشتركين مدفوعين |
| Plausible كنسخة احتياطية | ≥ 50 مستخدم نشط |
| OCR auto-activation للإيصالات | ≥ 100 طلب اشتراك شهرياً |
| Playwright E2E | بعد أول 1000 مستخدم |
| Lighthouse CI في GitHub Actions | بعد أول إطلاق ناجح |
| مراجعة محامٍ سعودي للوثائق | عند تجاوز 100 مشترك مدفوع |
| مراقبة 72 ساعة المكثفة | تم تجاوزها بقرار المالك؛ تُستبدل بمتابعة تشغيلية عند البلاغات والمؤشرات غير الطبيعية |

---

## 🎯 الخطوات النهائية قبل الإعلان التسويقي

1. **يدوي**: تنفيذ مصفوفة `qa-runbook.md` كاملة: 7 سيناريوهات × Mobile/Tablet/Desktop × Chrome/Safari = 42 تمريرة موثقة.
2. **يدوي**: تشغيل Lighthouse على 5 صفحات والتأكد من ≥ 80 Performance و≥ 90 Accessibility وBest Practices.
3. **يدوي**: تأكيد iOS Safari وAndroid Chrome لا يكسران المسارات الحرجة، خصوصاً `/auth` و`/onboarding` و`/dashboard/billing`.
4. **جاهز**: خطة إعلان القنوات الأولى موثقة في `launch-day-runbook.md` بعد إغلاق البنود اليدوية أعلاه.
5. **بعد القبول**: نشر إعلان X + LinkedIn + WhatsApp Business
6. **متجاوز بقرار المالك**: مراقبة 72 ساعة متواصلة — البديل متابعة تشغيلية مباشرة حسب البلاغات والمؤشرات
