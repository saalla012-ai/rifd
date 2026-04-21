# Memory: index.md
Updated: now

# Project Memory

## Core
- نطاق البريد الصحيح: `notify.rifd.club` (الجذر `rifd.club`). عند أي إعادة إضافة لنطاق البريد، اكتب الجذر `rifd.club` فقط — لا تكتب `notify` يدوياً (Lovable يضيفها تلقائياً، تكرارها يكسر DNS).
- الإنتاج على `https://rifd.lovable.app` — لا تستخدم نطاق `id-preview` في cron jobs أو روابط مطلقة.
- صلاحيات الأدمن في `user_roles` مقسّمة إلى 4 سياسات (SELECT/INSERT/UPDATE/DELETE) مع `WITH CHECK` مزدوج. لا تُعد دمجها في سياسة `ALL` واحدة.
- `app_settings.whatsapp_number` و عدّاد المؤسسين يُقرَآن عبر RPC `get_founding_status()` / `get_public_app_settings()` فقط — لا تكشف الجدول مباشرة لـ `anon`.
- ترقية خطة المشترك تتم تلقائياً عبر تريغر `sync_profile_plan_on_activation` عند تغيير `subscription_requests.status` إلى `activated`. لا تكتب كود ترقية يدوي في Frontend.
- `ab_test_events.event_type` محصور في قائمة مغلقة (`view, cta_click, demo_try, click, convert, impression, exposure, signup, submit`) — أي حدث جديد يجب توسيع السياسة أولاً.
- OG image في `public/og-image.jpg` (1200×630) و Favicon في `public/favicon.png` — كلاهما مرتبط في `__root.tsx`.

## Memories
- [Email domain naming](mem://constraints/email-domain-name) — قاعدة كتابة اسم النطاق عند الإعداد + سجلات NS الصحيحة
