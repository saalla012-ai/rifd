
المستخدم نسي قيمة `NOTIFY_WEBHOOK_SECRET`. الحل: توليد قيمة جديدة عشوائية، تحديث السرّ، ثم تخزينها في `internal_config` تلقائياً بدون ما يحتاج المستخدم يحفظها.

## الخطة

### 1) توليد قيمة جديدة للسرّ
أولّد قيمة عشوائية قوية (مثلاً hex 32 byte) وأحدّث السرّ `NOTIFY_WEBHOOK_SECRET` عبر `add_secret`.

### 2) تبسيط تجربة الإعداد
بدل ما يطلب من المستخدم إدخال السرّ يدوياً (وينساه)، أعدّل زر **"إعداد الإشعارات"** بحيث:
- يستدعي endpoint جديد `/api/setup-notify-config` بدون مطالبة بإدخال السرّ.
- الـendpoint يقرأ `NOTIFY_WEBHOOK_SECRET` من `process.env` على السيرفر مباشرة، ويتأكد أن المستدعي **أدمن مسجّل دخول** عبر التحقق من جلسة Supabase وجدول `user_roles`.
- يخزّن `notify_webhook_url` + `notify_webhook_secret` في جدول `internal_config`.

نفس الشيء لزر **"اختبار تيليجرام"**: نتحقق من جلسة الأدمن بدلاً من الـheader secret.

### 3) النتيجة
- المستخدم يضغط الزر → ينجح فوراً بدون إدخال أي شيء.
- السرّ ما يظهر أبداً للواجهة.
- الـtrigger في DB يستخدم نفس السرّ المخزّن في `internal_config` تلقائياً.

## الملفات المتأثرة
- `src/routes/api.setup-notify-config.ts` — استبدال التحقق بـheader بتحقق من جلسة الأدمن.
- `src/routes/api.notify-telegram-admin.ts` — يبقى كما هو (يتحقق من header secret لأن الـDB trigger هو من يستدعيه).
- `src/routes/admin.subscriptions.tsx` — حذف `window.prompt` من زر الإعداد، واستخدام جلسة Supabase لزر الاختبار.
- توليد سرّ جديد عبر `add_secret`.

## التدفّق بعد التعديل

```text
[الأدمن يضغط "إعداد الإشعارات"]
    │
    ▼
[POST /api/setup-notify-config مع Bearer token من جلسة Supabase]
    │
    ▼
[السيرفر يتحقق: user_roles.role = admin؟]
    │ نعم
    ▼
[يقرأ NOTIFY_WEBHOOK_SECRET من env]
    │
    ▼
[يخزّن في internal_config]
    │
    ▼
[✅ تم — جاهز للاستخدام]
```

ما يحتاج المستخدم يدخل أي قيمة. تجربة بضغطة زر واحدة.
