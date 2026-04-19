

## الخطوة المنطقية التالية: إصلاح خللين يمنعان كل البريد من الوصول

عند فحص حالة المنظومة بعد آخر اختبار، اكتشفت أن المشروع فيه **مشكلتان حقيقيتان** يجب إصلاحهما قبل اعتبار البريد جاهزاً — وليس فقط انتظار الـDNS.

### المشكلة 1: hook التذكيرات يُدرج payload ناقص → فشل دائم 400

سجل `email_send_log` يُظهر أن `subscription-expiring` يفشل بشكل متكرر بهذه الرسالة:
```
Email API error: 400 missing_parameter — Missing run_id or idempotency_key
```

السبب: الـpayload المُدرج في الطابور من `/hooks/expiring-subscriptions` يحوي فقط `{message_id, label, to, subject, html, text, queued_at}`، بينما الـdispatcher (`process.ts`) يتطلب أيضاً `idempotency_key` و `purpose` و `from` و `sender_domain` و `unsubscribe_token`. قارن مع `send-transactional-email` الذي يبني payload كاملاً (سطور 276-292) — هذا هو القالب الصحيح.

### المشكلة 2: `SENDER_DOMAIN` مكرر `notify.notify.rifd.club`

في `src/routes/lovable/email/transactional/send.ts` السطر 11:
```ts
const SENDER_DOMAIN = "notify.notify.rifd.club"  // ❌ خطأ
```
الصحيح حسب قاعدة الذاكرة `mem://constraints/email-domain-name`:
```ts
const SENDER_DOMAIN = "notify.rifd.club"
```
هذا يعني أن كل بريد معاملاتي (تفعيل + انتهاء) سيفشل بـ "No email domain record found" حتى بعد أن يصبح النطاق Active. هذه قنبلة موقوتة.

### الإصلاح

**ملف 1: `src/routes/hooks/expiring-subscriptions.ts`**
- استيراد ثوابت `SITE_NAME` / `SENDER_DOMAIN` / `FROM_DOMAIN` (أو إعلانها محلياً بنفس القيم الصحيحة).
- تعديل بناء الـpayload ليطابق `send-transactional-email`: إضافة `from`, `sender_domain`, `purpose: 'transactional'`, `idempotency_key: idempotencyKey`.
- (اختياري لكنه أفضل) جلب أو إنشاء `unsubscribe_token` للمستلم — أو حذف الحقل تماماً (الـSDK يقبل غيابه).

**ملف 2: `src/routes/lovable/email/transactional/send.ts`**
- تصحيح السطر 11: `SENDER_DOMAIN = "notify.rifd.club"`.

**تنظيف بعد الإصلاح**:
- حذف صفوف `failed` المتراكمة لـ`sub-expiring-1d-c52ad8c3-...` من `email_send_log` (اختياري — لتفادي تجاوز عداد الـ MAX_RETRIES = 5 الذي قد ينقل الرسالة إلى DLQ بدلاً من إعادة المحاولة).

### اختبار التحقق

1. بعد التعديل والنشر، استدعاء `/hooks/expiring-subscriptions` ثانية.
2. انتظار دورة dispatcher واحدة (~5 ثوانٍ).
3. قراءة `email_send_log` للتأكد أن الصف الجديد لـ`subscription-expiring` صار `sent` (أو لا يزال `pending` بانتظار النطاق — لكن **ليس** `failed`).
4. إذا كان النطاق لا يزال Pending: السلوك المتوقع هو رسالة فشل مختلفة من نوع "domain not verified" — وهذا مقبول حتى تكتمل الـDNS.

### ما لن يحدث الآن
- لن يصل بريد فعلي للمستلمين قبل أن يصبح النطاق Active.
- لكن بعد هذا الإصلاح + Active النطاق → كل شيء سيعمل تلقائياً دون أي تدخل آخر.

