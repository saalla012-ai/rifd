
## التشخيص
المحادثة تم اكتشافها وتخزينها بنجاح، لكن زر الاختبار يفشل لأن ` /api/notify-telegram-admin ` يعتمد على `supabaseAdmin` من `client.server.ts`، وهذا يحتاج `SUPABASE_SERVICE_ROLE_KEY`. في بيئة المعاينة هذا المفتاح غير متاح حالياً، لذلك يفشل الاختبار قبل الوصول إلى تيليجرام.

## ما سأبنيه
### 1) إزالة اعتماد Route الإشعارات على `supabaseAdmin`
أعدّل `src/routes/api.notify-telegram-admin.ts` ليعمل بدون قراءة من قاعدة البيانات عبر service role.

بدلاً من ذلك:
- في وضع الاختبار يستقبل:
  - `test: true`
  - `chat_id`
- وفي وضع الإشعار الفعلي يستقبل من الـ webhook:
  - `request_id`
  - `admin_chat_id`
  - بيانات الطلب اللازمة لبناء الرسالة

بهذا route يرسل إلى تيليجرام مباشرة بدون أي حاجة لـ `SUPABASE_SERVICE_ROLE_KEY`.

### 2) تعديل زر "اختبار تيليجرام"
أعدّل `src/routes/admin.subscriptions.tsx` بحيث:
- يقرأ من `internal_config`:
  - `notify_webhook_secret`
  - `telegram_admin_chat_id`
- ثم يرسل إلى `/api/notify-telegram-admin`:
```json
{ "test": true, "chat_id": "..." }
```

### 3) تعديل webhook القادم من قاعدة البيانات
أنشئ migration لتحديث دالة `notify_admin_on_subscription_request()` بحيث ترسل في body:
- `request_id`
- `admin_chat_id`
- بيانات الطلب نفسها: الخطة، الدورة، المتجر، الإيميل، الواتساب، الحالة، الملاحظات، طريقة الدفع

وبذلك route لا يحتاج أن يعيد جلب `subscription_requests` أو `internal_config`.

### 4) إبقاء الاكتشاف الحالي كما هو
`api.telegram-discover-chats` و `api.telegram-set-chat-id` سيبقيان كما هما، لأنهما يعملان فعلاً وتم حفظ `chat_id` بنجاح.

## الملفات التي سأعدلها
- `src/routes/api.notify-telegram-admin.ts`
- `src/routes/admin.subscriptions.tsx`
- `supabase/migrations/...` لتحديث دالة التريغر `notify_admin_on_subscription_request()`

## النتيجة المتوقعة
بعد التنفيذ:
- زر **اختبار تيليجرام** سيعمل
- الإشعار التلقائي عند إنشاء طلب اشتراك سيعمل أيضاً
- لن يبقى النظام معتمداً على service role داخل هذا المسار

## تفاصيل تقنية
- السبب ليس في `chat_id` الآن؛ تم حفظه بنجاح.
- السبب في الاعتماد على Server Admin Client داخل route.
- الحل الأفضل هو جعل route يستقبل كل ما يحتاجه في الطلب نفسه بدلاً من جلبه من قاعدة البيانات وقت التنفيذ.

## التحقق بعد التنفيذ
1. الضغط على **اختبار تيليجرام** والتأكد من وصول رسالة الاختبار.
2. إنشاء طلب اشتراك جديد.
3. التأكد من وصول إشعار تيليجرام التلقائي للطلب الجديد.
