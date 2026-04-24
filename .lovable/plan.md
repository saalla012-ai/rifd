# خطة الإطلاق النهائية — رِفد v1.0

**الهدف:** نقل المشروع من 89/100 → 100/100 جاهزية للإطلاق الفعلي خلال 5-7 أيام، بدون إضافة ميزات جديدة (لا فيديو، لا Memory 2.0).

**فلسفة التنفيذ:** الأمان أولاً، رحلة العميل ثانياً، التحليلات ثالثاً. كل مرحلة لها بوابة قبول صريحة قبل الانتقال للتالية.

---

## ترميز المراحل

```text
P1 → الأمان والسلامة         (يوم 1-2)   حرج
P2 → نموذج /contact حقيقي    (يوم 3)     مهم
P3 → التحقق اليدوي الموثق    (يوم 4-5)   حرج
P4 → التحليلات الخفيفة       (يوم 6)     مهم
P5 → الإطلاق الفعلي          (يوم 7)     حاسم
```

---

## P1 — الأمان والسلامة (يوم 1-2)

**الهدف:** صفر ثغرات حرجة قبل أي خطوة أخرى.

### مهام P1:
1. **P1.1** تشغيل `security--run_security_scan` + توثيق النتائج
2. **P1.2** تشغيل `supabase--linter` + إصلاح كل warning
3. **P1.3** مراجعة يدوية لـ RLS على الجداول الحساسة:
   - `subscription_requests` (يحتوي whatsapp + email + receipt)
   - `payment_settings` (يحتوي IBAN)
   - `internal_config` (يحتوي notify_webhook_secret)
   - `profiles` (PII كاملة)
4. **P1.4** التحقق من cron `process-email-queue` يعمل عبر `check_email_dlq_health()` + استعلام `cron.job`
5. **P1.5** التحقق من DLQ نظيف (auth + transactional)
6. **P1.6** فحص `email_send_log` لآخر 7 أيام — هل توجد إخفاقات؟

**ملاحظة:** Rate limiting على `ab_test_events` و `subscription_requests` **مؤجَّل** — البنية التحتية لا تدعمه حالياً (سيُعالَج لاحقاً عند توفر الـ primitives).

### بوابة قبول P1:
- ✅ 0 critical / 0 high في security scan
- ✅ 0 errors في supabase linter
- ✅ DLQ counters = 0
- ✅ آخر بريد مُرسَل بنجاح خلال آخر 7 أيام

---

## P2 — نموذج /contact حقيقي (يوم 3)

**الهدف:** تحويل `/contact` من صفحة معلوماتية إلى قناة استقبال leads حقيقية.

### مهام P2:
1. **P2.1** إنشاء جدول `contact_submissions`:
   ```sql
   id uuid PK, name text, email text, phone text NULL,
   subject text, message text, status text DEFAULT 'new',
   user_agent text NULL, created_at timestamptz DEFAULT now()
   ```
2. **P2.2** RLS policies:
   - INSERT: مفتوح لـ anon + authenticated (مع validation في app layer عبر zod)
   - SELECT/UPDATE/DELETE: admin only عبر `has_role()`
3. **P2.3** إضافة نموذج فعلي في `/contact` بـ:
   - حقول: الاسم، البريد، الجوال (اختياري)، الموضوع، الرسالة
   - validation عبر **zod** + react-hook-form
   - honeypot field مخفي لمكافحة البوتات
4. **P2.4** إنشاء قالب بريد معاملاتي `contact-confirmation.tsx` (تأكيد للزائر)
5. **P2.5** إنشاء server route `/api/public/contact-submit` يقوم بـ:
   - validation (zod)
   - INSERT في `contact_submissions` بـ service role
   - إرسال بريد التأكيد عبر `sendTransactionalEmail`
   - إشعار Telegram للأدمن (إعادة استخدام نفس آلية `notify-telegram-admin`)
6. **P2.6** تسجيل القالب في `email-templates/registry.ts`

### بوابة قبول P2:
- ✅ submission اختباري ينجح من الـ UI
- ✅ سجل في `contact_submissions` ظهر
- ✅ بريد التأكيد وصل للـ inbox
- ✅ إشعار Telegram وصل للأدمن

---

## P3 — التحقق اليدوي الموثق (يوم 4-5)

**الهدف:** اختبار كل مسار إيراد فعلي يدوياً قبل الإطلاق.

### مهام P3:
1. **P3.1** إنشاء ملف `.lovable/qa-runbook.md` يحتوي 7 سيناريوهات:
   - S1: تسجيل جديد → onboarding → dashboard
   - S2: توليد نص (خصم من usage_logs + ظهور في library)
   - S3: توليد صورة (نفس الشيء)
   - S4: طلب اشتراك كامل (اختيار باقة → رفع إيصال → Telegram → تفعيل أدمن → بريد activation → تحديث plan)
   - S5: استعادة كلمة السر (بريد recovery)
   - S6: نموذج /contact (من P2)
   - S7: تجاوز الحصة (quota_exceeded dialog + بريد warning)
2. **P3.2** تنفيذ الـ7 سيناريوهات على 3 مقاسات: 390px / 768px / 1280px
3. **P3.3** تنفيذ على Chrome + Safari (مهم لسوق iOS السعودي)
4. **P3.4** تشغيل Lighthouse محلياً على 5 صفحات: `/`, `/pricing`, `/about`, `/auth`, `/dashboard`
5. **P3.5** توثيق النتائج في `qa-runbook.md` (لقطات + نتائج Lighthouse)

### بوابة قبول P3:
- ✅ كل السيناريوهات السبعة passed
- ✅ Lighthouse Performance ≥ 80 (موبايل) على الصفحات الخمس
- ✅ 0 console errors على الصفحات الخمس
- ✅ يعمل على iOS Safari

---

## P4 — التحليلات الخفيفة (يوم 6)

**الهدف:** معرفة من أين يأتي الزوار وأين يسقطون في الـ funnel.

### القرار: PostHog وليس Plausible
- مجاني حتى 1M events/شهر (Plausible مدفوع $9/شهر)
- يدعم funnels + session recordings مدمجة
- لا حاجة لـ self-hosting

### مهام P4:
1. **P4.1** إنشاء حساب PostHog Cloud + الحصول على API key
2. **P4.2** إضافة secret `VITE_POSTHOG_KEY` (publishable — يمكن وضعه في .env)
3. **P4.3** تركيب `posthog-js` + initialization في `__root.tsx`
4. **P4.4** تتبع 5 أحداث فقط:
   - `$pageview` (تلقائي)
   - `signup_completed` (في auth.tsx بعد نجاح التسجيل)
   - `onboarding_completed` (في onboarding.tsx)
   - `subscription_requested` (في dashboard.billing بعد insert)
   - `generation_created` (في generate-text + generate-image)
5. **P4.5** إنشاء funnel في PostHog dashboard: pageview → signup → onboarding → subscription
6. **P4.6** **عدم** إنشاء `/admin/funnel` route (نستخدم PostHog dashboard مباشرة)

### بوابة قبول P4:
- ✅ pageview يظهر في PostHog خلال دقيقتين
- ✅ الأحداث الـ4 المخصصة تُسجَّل عند تنفيذها
- ✅ Funnel يظهر في PostHog dashboard

---

## P5 — الإطلاق الفعلي (يوم 7)

**الهدف:** النشر + خطة استجابة موثقة.

### مهام P5:
1. **P5.1** Publish من Lovable + التحقق من DNS لـ `rifd.site`
2. **P5.2** اختبار بريد حقيقي من production:
   - signup test → بريد welcome وصل
   - contact form test → بريد confirmation وصل
3. **P5.3** التحقق من `notify.rifd.club` يعمل (sender domain)
4. **P5.4** تحديث `launch-checklist.md` → 100/100
5. **P5.5** إنشاء `.lovable/launch-day-runbook.md` يحتوي:
   - معايير نجاح أول أسبوع: 100 زائر فريد / 10 تسجيلات / 1-3 طلبات اشتراك
   - **خطة استجابة:**
     - من يتابع Telegram؟ (المؤسس)
     - من يرد على /contact؟ خلال كم ساعة؟ (4 ساعات في ساعات العمل)
     - كيف نتعامل مع DLQ alerts؟
     - كيف نتعامل مع quota_exceeded shocks؟
6. **P5.6** إعلان داخلي + بدء المتابعة اليومية لـ:
   - `/admin/email-monitor`
   - `/admin/subscriptions`
   - PostHog dashboard

### بوابة قبول P5 (تعريف "جاهز للإطلاق"):
```text
أمان:    □ security_scan: 0 critical, 0 high
         □ supabase_linter: 0 errors
         □ كل RLS مُراجعة يدوياً ✓ (P1)

وظيفة:   □ مسار الاشتراك اختُبر يدوياً 3 مرات بنجاح ✓ (P3)
         □ بريد التفعيل وصل خلال < 60 ثانية ✓ (P3)
         □ Telegram notifications تعمل ✓ (P3)
         □ التوليد يعمل ويخصم من usage_logs ✓ (P3)
         □ نموذج /contact يعمل end-to-end ✓ (P2)

تجربة:   □ 0 console errors على 5 صفحات ✓ (P3)
         □ Lighthouse Performance ≥ 80 (موبايل) ✓ (P3)
         □ يعمل على iOS Safari + Android Chrome ✓ (P3)

تشغيل:   □ DLQ فارغ ✓ (P1)
         □ cron jobs تعمل ✓ (P1)
         □ خطة استجابة موثقة ✓ (P5.5)
         □ تحليلات تعمل ✓ (P4)
```

---

## التغييرات التقنية الملموسة (للمراجعة)

### ملفات جديدة:
- `supabase/migrations/<timestamp>_contact_submissions.sql` (P2)
- `src/lib/email-templates/contact-confirmation.tsx` (P2)
- `src/routes/api.public.contact-submit.ts` (P2)
- `src/lib/analytics/posthog.ts` (P4)
- `.lovable/qa-runbook.md` (P3)
- `.lovable/launch-day-runbook.md` (P5)

### ملفات معدّلة:
- `src/routes/contact.tsx` — إضافة نموذج فعلي
- `src/lib/email-templates/registry.ts` — تسجيل contact-confirmation
- `src/routes/__root.tsx` — initialization PostHog
- `src/routes/auth.tsx` — حدث signup_completed
- `src/routes/onboarding.tsx` — حدث onboarding_completed
- `src/routes/dashboard.billing.index.tsx` — حدث subscription_requested
- `src/routes/dashboard.generate-text.tsx` + `dashboard.generate-image.tsx` — حدث generation_created
- `.lovable/launch-checklist.md` — تحديث إلى 100/100

### ما تم استبعاده عمداً (مع التبرير):
| المُستبعَد | السبب |
|---|---|
| Playwright E2E | بديله: QA يدوي موثق (أسرع + أكثر موثوقية لمشروع بهذا الحجم) |
| Lighthouse CI في GitHub Actions | بديله: تشغيل محلي مرة واحدة قبل الإطلاق |
| Plausible | PostHog Free Tier أفضل (funnels + recordings مجاناً) |
| `/admin/funnel` route | PostHog dashboard يكفي |
| Rate limiting على ab_test_events | البنية التحتية لا تدعمه حالياً |
| Memory 2.0 + Video Generator | مؤجَّل حتى تحقيق 10 مشتركين مدفوعين بعد الإطلاق |

---

## التزام التنفيذ بعد الموافقة

عند الموافقة، سأنفّذ بالترتيب الصارم: P1 → P2 → P3 → P4 → P5، مع الإبلاغ عند نهاية كل مرحلة وانتظار تأكيد بوابة القبول قبل الانتقال للتالية. أي اكتشاف غير متوقع (مثل ثغرة أمنية حرجة) يوقف التنفيذ ويُرفع لك للقرار فوراً.
