

## الخطة: إرسال إشعار تيليجرام تلقائياً عند تقديم طلب اشتراك

### المشكلة
- الكود الحالي يُنشئ الطلب في DB ثم ينتقل للتأكيد فوراً، **دون** استدعاء `/api/notify-telegram-admin`.
- الإشعار يصل فقط حين يضغط الأدمن "إرسال إشعار" يدوياً من `admin.subscriptions.tsx`.
- بالتالي طلب `elbhery878@gmail.com` (06:23) لم يولّد أي إشعار.

### الحل (خطوتان)

**1. استدعاء تلقائي من واجهة المستخدم** — في `src/routes/dashboard.billing.index.tsx` بعد `insert` الناجح وقبل التنقل، أضف `fetch("/api/notify-telegram-admin")` يحمل بيانات الطلب (نفس الشكل المستخدم في `admin.subscriptions.tsx`). يستخدم `notify_webhook_secret` و `telegram_admin_chat_id` من جدول `internal_config` (نقرأهما عبر `supabase.from("internal_config")`).

**ملاحظة**: لا نمرر `webhook secret` من المتصفح (تسريب أمني). الحل: نستدعي `/api/notify-telegram-admin` بدون secret من العميل، ونعدّل الـ endpoint ليقبل **مساراً ثانياً**: عند استدعائه من نفس الموقع بطلب POST يحمل `request_id` فقط، يقرأ بيانات الطلب من DB بنفسه عبر `supabaseAdmin` ويتحقق أن `created_at` خلال آخر دقيقتين (حماية بسيطة من الإساءة).

**2. تحديث `notify_webhook_url`** في `internal_config` من preview إلى `https://rifd.lovable.app/api/notify-telegram-admin` (ميجريشن صغير).

### تفاصيل تقنية
- الملف الجديد للتعديل: `src/routes/api.notify-telegram-admin.ts` — إضافة فرع جديد `if (body.request_id && !body.test)` يجلب الطلب عبر `supabaseAdmin` ويُرسل بنفس قالب HTML الموجود.
- `src/routes/dashboard.billing.index.tsx` — بعد السطر 232، استدعاء `fetch("/api/notify-telegram-admin", { method:"POST", body: JSON.stringify({ request_id: data.id }) })` داخل `try/catch` صامت (فشل الإشعار لا يكسر تجربة المستخدم).
- ميجريشن SQL لتحديث الـ URL إلى الدومين المنشور.
- إرسال إشعار يدوي **فوراً** للطلب الحالي (`elbhery878@gmail.com`) عبر `curl` بعد التنفيذ للتعويض.

### النتيجة المتوقعة
- كل طلب اشتراك جديد يُولّد إشعار تيليجرام للأدمن خلال ثوانٍ.
- زر الإرسال اليدوي في لوحة الأدمن يبقى كما هو (للحالات الاستثنائية).

