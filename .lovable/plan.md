# خطة الإطلاق الرسمية — رِفد v1.0

**الهدف:** الانتقال من 89/100 → 100/100 جاهزية للإطلاق خلال 5-7 أيام، بدون إضافة ميزات جديدة.

**الترتيب الإلزامي:** P1 → P2 → P3 → P4 → P5. لا يُنتقَل لمرحلة قبل اجتياز بوابة قبول السابقة.

---

## P1 — الأمان والسلامة (يوم 1-2) — حرج

**الحالة الحالية:** بدأ التنفيذ في الجلسة السابقة (تم تصليب `user_roles` و `usage_logs` و `domain-scan` auth).

### الخطوات المتبقية:

**P1.1 — استكمال حماية مسارات الأدمن**
- إضافة admin guard كامل لـ `src/routes/admin.ab-tests.tsx` (تحقَّق من `has_role(uid,'admin')` قبل أي عرض)
- مراجعة باقي مسارات `admin.*` (analytics, audit, plan-limits, subscriptions, email-monitor, domain-scan) للتأكد من وجود نفس الحماية

**P1.2 — تشغيل الفحوصات الآلية**
- `security--run_security_scan` → توثيق النتائج وإصلاح كل critical/high
- `supabase--linter` → إصلاح كل warning

**P1.3 — مراجعة RLS يدوياً**
- `subscription_requests`، `payment_settings`، `internal_config`، `profiles`، `contact_submissions`
- التأكد من أن SELECT/UPDATE/DELETE محصورة على المالك أو الأدمن

**P1.4 — صحة البريد**
- استعلام `check_email_dlq_health()` → DLQ counters = 0
- استعلام `cron.job` للتأكد من أن `process-email-queue` يعمل
- فحص `email_send_log` لآخر 7 أيام: أين الإخفاقات؟ معالجة البريدين العالقين منذ 22-24 أبريل

**P1.5 — تدوير webhook secret**
- توليد `NOTIFY_WEBHOOK_SECRET` جديد قوي
- تحديث cron `daily-domain-scan` ليستخدم header `x-webhook-secret`

### بوابة قبول P1:
- 0 critical / 0 high في security scan
- 0 errors في supabase linter
- DLQ = 0 و آخر بريد ناجح خلال 7 أيام
- كل مسارات `/admin/*` محمية

---

## P2 — نموذج /contact حقيقي (يوم 3) — مهم

**ملاحظة:** جدول `contact_submissions` تم إنشاؤه في P1 السابقة. يبقى ربط الواجهة + البريد + الإشعارات.

### الخطوات:

**P2.1 — قالب البريد**
- إنشاء `src/lib/email-templates/contact-confirmation.tsx` (تأكيد للزائر بالعربية، يستخدم `_shared/layout.tsx`)
- تسجيله في `src/lib/email-templates/registry.ts`

**P2.2 — Server route**
- إنشاء `src/routes/api.public.contact-submit.ts`:
  - validation عبر zod (الاسم، البريد، الجوال اختياري، الموضوع، الرسالة، honeypot)
  - رفض إذا honeypot ممتلئ
  - INSERT في `contact_submissions` بـ service role
  - استدعاء `sendTransactionalEmail('contact-confirmation', ...)`
  - استدعاء آلية Telegram (إعادة استخدام `notify-telegram-admin`)

**P2.3 — واجهة /contact**
- تعديل `src/routes/contact.tsx`: إضافة نموذج react-hook-form + zod resolver + honeypot مخفي
- حالات UI: idle / submitting / success / error
- الاحتفاظ بقنوات الواتساب والبريد الموجودة بالأعلى

### بوابة قبول P2:
- submission تجريبي ينجح من UI
- سجل ظهر في `contact_submissions`
- بريد التأكيد وصل للـ inbox
- إشعار Telegram وصل للأدمن

---

## P3 — التحقق اليدوي الموثق (يوم 4-5) — حرج

### الخطوات:

**P3.1 — كتابة `.lovable/qa-runbook.md`** بـ 7 سيناريوهات:
- S1: تسجيل جديد → onboarding → dashboard
- S2: توليد نص (خصم usage_logs + ظهور في library)
- S3: توليد صورة
- S4: مسار اشتراك كامل (باقة → إيصال → Telegram → تفعيل أدمن → بريد activation → تحديث plan)
- S5: استعادة كلمة السر
- S6: نموذج /contact
- S7: تجاوز الحصة (dialog + بريد warning)

**P3.2 — التنفيذ:**
- 3 مقاسات: 390 / 768 / 1280 px
- متصفحان: Chrome + Safari
- توثيق النتائج (لقطات + ملاحظات) في نفس الملف

**P3.3 — Lighthouse محلي** على: `/`, `/pricing`, `/about`, `/auth`, `/dashboard`

### بوابة قبول P3:
- كل السيناريوهات السبعة passed
- Lighthouse Performance ≥ 80 (موبايل)
- 0 console errors
- يعمل على iOS Safari

---

## P4 — التحليلات الخفيفة (يوم 6) — مهم

**القرار النهائي:** PostHog Free Tier (funnels + recordings مجاناً).

### الخطوات:

**P4.1** إنشاء حساب PostHog Cloud + الحصول على Project API Key
**P4.2** إضافة `VITE_POSTHOG_KEY` و `VITE_POSTHOG_HOST` في `.env`
**P4.3** تركيب `posthog-js` + إنشاء `src/lib/analytics/posthog.ts` (init + helper `track`)
**P4.4** initialization في `src/routes/__root.tsx` (داخل useEffect مع حماية SSR)
**P4.5** تتبع 5 أحداث:
- `$pageview` تلقائي
- `signup_completed` في `auth.tsx`
- `onboarding_completed` في `onboarding.tsx`
- `subscription_requested` في `dashboard.billing.index.tsx`
- `generation_created` في `generate-text.tsx` + `generate-image.tsx`

**P4.6** إنشاء funnel من PostHog dashboard (لا route جديد)

### بوابة قبول P4:
- pageview يظهر في PostHog خلال دقيقتين
- الأحداث الأربعة المخصصة تُسجَّل
- funnel يظهر في dashboard

---

## P5 — الإطلاق الفعلي (يوم 7) — حاسم

### الخطوات:

**P5.1** Publish + التحقق من DNS لـ `rifd.site` و `www.rifd.site`
**P5.2** اختبار بريد production: signup حقيقي → welcome وصل، contact form → confirmation وصل
**P5.3** التحقق من sender domain `notify.rifd.club` يعمل (راجع `mem://constraints/email-domain-name`)
**P5.4** تحديث `.lovable/launch-checklist.md` → 100/100
**P5.5** كتابة `.lovable/launch-day-runbook.md`:
- معايير نجاح أول أسبوع: 100 زائر / 10 تسجيلات / 1-3 طلبات اشتراك
- خطة استجابة: من يتابع Telegram، SLA الرد على /contact (4 ساعات عمل)، التعامل مع DLQ alerts، التعامل مع quota_exceeded shocks
**P5.6** بدء المتابعة اليومية: `/admin/email-monitor` + `/admin/subscriptions` + PostHog

### بوابة قبول P5 (تعريف "جاهز للإطلاق"):

```text
أمان:    □ 0 critical/high في security scan
         □ 0 errors في supabase linter
         □ كل RLS مُراجعة يدوياً

وظيفة:   □ مسار اشتراك اختُبر يدوياً 3 مرات
         □ بريد التفعيل < 60 ثانية
         □ Telegram يعمل
         □ التوليد يخصم من usage_logs
         □ /contact يعمل end-to-end

تجربة:   □ 0 console errors على 5 صفحات
         □ Lighthouse ≥ 80 موبايل
         □ يعمل على iOS Safari + Android Chrome

تشغيل:   □ DLQ فارغ
         □ cron jobs تعمل
         □ خطة استجابة موثقة
         □ تحليلات تعمل
```

---

## التفاصيل التقنية (للمرجع)

### ملفات جديدة:
- `src/lib/email-templates/contact-confirmation.tsx`
- `src/routes/api.public.contact-submit.ts`
- `src/lib/analytics/posthog.ts`
- `.lovable/qa-runbook.md`
- `.lovable/launch-day-runbook.md`

### ملفات معدَّلة:
- `src/routes/admin.ab-tests.tsx` — إكمال admin guard
- `src/routes/contact.tsx` — نموذج فعلي
- `src/lib/email-templates/registry.ts` — تسجيل القالب الجديد
- `src/routes/__root.tsx` — PostHog init
- `src/routes/auth.tsx`, `onboarding.tsx`, `dashboard.billing.index.tsx`, `dashboard.generate-text.tsx`, `dashboard.generate-image.tsx` — أحداث التتبع
- `.lovable/launch-checklist.md` — 100/100

### مستبعد عمداً:
| المستبعَد | البديل |
|---|---|
| Playwright E2E | QA يدوي موثق |
| Lighthouse CI في Actions | تشغيل محلي مرة واحدة |
| Plausible | PostHog Free Tier |
| `/admin/funnel` | PostHog dashboard |
| Rate limiting على ab_test_events | مؤجَّل (لا primitives) |
| Memory 2.0 + Video Generator | بعد 10 مشتركين مدفوعين |

### التزام التنفيذ:
بعد الموافقة سأنفّذ بالترتيب P1 → P5، أُبلغ عند نهاية كل مرحلة، وأنتظر تأكيد بوابة القبول قبل الانتقال. أي ثغرة حرجة تُوقف التنفيذ وتُرفَع للقرار فوراً.
