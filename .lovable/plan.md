

## الهدف
إرسال إشعار تيليجرام تلقائي للأدمن (saalla012@gmail.com) فور إنشاء أي طلب اشتراك جديد، باستخدام موصّل **Telegram** عبر Lovable Connector Gateway (مجاني، بدون Twilio).

## المعمارية

```text
[المستخدم يضغط "تقديم الطلب"]
        │
        ▼
[INSERT في subscription_requests]
        │
        ▼ (Database Trigger AFTER INSERT)
[pg_net → POST إلى TanStack server route]
        │
        ▼
[/api/notify-telegram-admin]
   - يتحقق من secret header (HMAC)
   - يقرأ تفاصيل الطلب من DB (admin client)
   - يُنسّق رسالة عربية مع الخطة، الإيميل، واتساب، الاسم
        │
        ▼
[Connector Gateway → Telegram sendMessage]
        │
        ▼
[إشعار يصل تيليجرام الأدمن فوراً]
```

## الخطوات

### 1) ربط موصّل Telegram
استدعاء `standard_connectors--connect` بـ `connector_id: telegram` لربط البوت. بعد الربط يتوفر `TELEGRAM_API_KEY` + `LOVABLE_API_KEY` كأسرار سيرفر.

### 2) إضافة سرّين إضافيين
- `TELEGRAM_ADMIN_CHAT_ID`: رقم Chat ID الخاص بك (سنطلبه عبر `add_secret`)
- `NOTIFY_WEBHOOK_SECRET`: قيمة عشوائية للتحقق من أن الطلب يأتي فعلاً من DB trigger

### 3) إنشاء Server Route
ملف `src/routes/api.notify-telegram-admin.ts`:
- يستقبل POST مع `{ request_id }` + header `x-webhook-secret`
- يتحقق من `NOTIFY_WEBHOOK_SECRET`
- يجلب الطلب عبر `supabaseAdmin` من `subscription_requests` + بيانات `profiles`
- يُنسّق رسالة عربية مع emoji 🆕 وروابط سريعة (واتساب + لوحة الأدمن)
- يستدعي `https://connector-gateway.lovable.dev/telegram/sendMessage` بـ `parse_mode: HTML`

### 4) تفعيل extension `pg_net`
عبر migration: `CREATE EXTENSION IF NOT EXISTS pg_net;`

### 5) Database Trigger
دالة `notify_admin_on_subscription_request()` + trigger `AFTER INSERT ON subscription_requests`:
- تستخدم `net.http_post` لاستدعاء `/api/notify-telegram-admin` مع `request_id` + `x-webhook-secret`
- لا تُفشل INSERT لو فشل الإشعار (try/catch)

### 6) صفحة اختبار سريع (اختيارية)
زر صغير في `/admin/subscriptions` لإرسال إشعار تجريبي يدوياً للتأكد من عمل القناة.

## شكل الرسالة المتوقعة

```text
🆕 طلب اشتراك جديد

الخطة: Pro (شهري)
المتجر: متجر الأمل
الإيميل: user@example.com
واتساب: +966501234567
طريقة الدفع: تحويل بنكي
الحالة: pending

🔗 فتح لوحة الأدمن
💬 محادثة العميل واتساب
```

## التفاصيل التقنية

- **عدم تخزين Token في الكود**: كل القيم تُقرأ من `process.env` على السيرفر فقط
- **حماية Endpoint**: header secret + RLS bypass فقط بعد التحقق
- **Idempotency**: لا حاجة (INSERT مرة واحدة per request)
- **عدم كسر INSERT عند فشل تيليجرام**: trigger يستخدم BEGIN/EXCEPTION/END
- **Logs**: نطبع نتيجة استدعاء `sendMessage` للتشخيص عبر `stack_modern--server-function-logs`

## ما أحتاجه منك قبل التنفيذ
1. **Bot Token** من BotFather
2. **Chat ID** الخاص بك (يفضّل التأكد عبر `getUpdates`)
3. الموافقة على ربط موصّل Telegram

