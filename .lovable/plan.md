

## المشكلة
السرّ المخزّن في `TELEGRAM_ADMIN_CHAT_ID` غير صحيح — Telegram يرد بـ "chat not found". إدخال chat_id يدوياً معقّد ومعرّض للخطأ.

## الحل: اكتشاف chat_id تلقائياً

أضيف زر جديد في لوحة الأدمن **"اكتشاف Chat ID"** يستدعي endpoint جديد يقرأ آخر الرسائل من البوت عبر `getUpdates`، يعرض قائمة المحادثات الخاصة المتاحة (الاسم + chat_id)، والمستخدم يضغط على المحادثة الصحيحة لتخزينها تلقائياً.

### التدفّق

```text
[الأدمن يفتح Telegram → يبحث عن البوت → يرسل /start]
   │
   ▼
[في لوحة الأدمن: يضغط "اكتشاف Chat ID"]
   │
   ▼
[POST /api/telegram-discover-chats مع Bearer admin token]
   │
   ▼
[السيرفر: يتحقق أن المستخدم admin]
[يستدعي gateway/getUpdates]
[يستخرج المحادثات الخاصة الفريدة]
   │
   ▼
[يعرض قائمة: "الاسم - @username - chat_id"]
   │
   ▼
[الأدمن يضغط على محادثته]
   │
   ▼
[POST /api/telegram-set-chat-id { chat_id }]
[السيرفر: يخزّن في internal_config.telegram_admin_chat_id]
   │
   ▼
[يحدّث notify-telegram-admin ليقرأ chat_id من DB أولاً، ثم env كـfallback]
   │
   ▼
[✅ زر "اختبار تيليجرام" يعمل]
```

## التغييرات على الملفات

### 1. `src/routes/api.telegram-discover-chats.ts` (جديد)
- POST endpoint محمي بـ Bearer token + تحقق من `user_roles.role = admin`.
- يستدعي `https://connector-gateway.lovable.dev/telegram/getUpdates` بـ `LOVABLE_API_KEY` + `TELEGRAM_API_KEY`.
- يستخرج المحادثات الخاصة (`chat.type === "private"`) ويعيد قائمة فريدة: `{ chat_id, first_name, last_name, username }[]`.

### 2. `src/routes/api.telegram-set-chat-id.ts` (جديد)
- POST endpoint محمي بنفس الطريقة.
- يستقبل `{ chat_id: string }`، يتحقق من صحته (رقم)، ويخزّنه في `internal_config` تحت المفتاح `telegram_admin_chat_id` عبر userClient (RLS).

### 3. `src/routes/api.notify-telegram-admin.ts` (تعديل)
- قبل القراءة من `process.env.TELEGRAM_ADMIN_CHAT_ID`، نقرأ من `internal_config` عبر `supabaseAdmin` (مفتاح `telegram_admin_chat_id`).
- إن وُجد → نستخدمه. وإلا → fallback لـ env.

### 4. `src/routes/admin.subscriptions.tsx` (تعديل في `NotificationsTools`)
- زر جديد **"اكتشاف Chat ID"** بأيقونة `Search`.
- عند الضغط: نداء `/api/telegram-discover-chats` → فتح Dialog يعرض قائمة المحادثات.
- كل صف فيه زر "استخدم هذا" → ينادي `/api/telegram-set-chat-id` ثم يغلق الـDialog ويعرض toast نجاح.
- إن كانت القائمة فارغة: رسالة واضحة "افتح البوت في Telegram وأرسل `/start` ثم أعد المحاولة".

## ملاحظات تقنية
- لا حاجة لتعديل DB schema — `internal_config` (key/value text) جاهز.
- `TELEGRAM_API_KEY` يأتي من connector ولا يحتاج إعداد إضافي.
- لا يحتاج المستخدم يبحث في URLs أو ينسخ chat_id يدوياً.

