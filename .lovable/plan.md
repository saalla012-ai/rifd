
# خطة: تطبيق Migration نظام تتبّع الموافقات (PDPL Compliance)

## نطاق العمل
- تنفيذ Migration واحد فقط على قاعدة بيانات Lovable Cloud (448 سطر).
- لا تعديل على أي ملف في الكود (`types.ts` يتولّد تلقائياً بعد Migration).
- لا بناء UI — هذه الرسالة لاحقاً.

## ما سيُضاف على قاعدة البيانات

### 1. ENUMs جديدة (2)
- `consent_type`: marketing_email, marketing_whatsapp, marketing_telegram, marketing_sms, product_updates, newsletter
- `consent_source`: onboarding, settings, subscription_form, telegram_bot, whatsapp_form, admin_action, api

### 2. جدول جديد: `consent_records`
- سجل **غير قابل للتعديل** (immutable audit log) — لا UPDATE ولا DELETE policies.
- يحفظ نص الموافقة + الإصدار + IP/User-Agent + المصدر + سحب الموافقة.
- 5 CHECK constraints (طول النص، صيغة الإصدار، حجم metadata، …).
- 3 indexes للأداء (user+type, active-only partial, created_at).
- RLS مُفعّل: المستخدم يقرأ موافقاته، الأدمن يقرأ الكل، service_role فقط يكتب.

### 3. أعمدة جديدة في `profiles` (5)
كلها `boolean NOT NULL DEFAULT false` ما عدا الأخير `timestamptz NULL`:
- `marketing_email_opt_in`, `marketing_whatsapp_opt_in`, `marketing_telegram_opt_in`, `product_updates_opt_in`, `consent_last_updated_at`

### 4. Functions جديدة (5)
- `record_consent(...)` → SECURITY DEFINER، تُستدعى من المستخدم (authenticated).
- `withdraw_consent(...)` → تُدرج سجل سحب جديد (بدون تعديل القديم).
- `get_user_consent_status(...)` → STABLE، تُرجع آخر حالة لكل نوع.
- `has_marketing_consent(uid, type)` → للاستخدام من service_role قبل أي إرسال تسويقي.
- `sync_profile_consent_status()` → trigger function.

### 5. Trigger جديد (1)
- `trg_sync_profile_consent_status` AFTER INSERT على `consent_records` → يُحدّث الأعمدة المختصرة في `profiles` تلقائياً.

### 6. View جديد (1)
- `admin_consent_stats` — إحصائيات تجميعية لكل نوع موافقة (للأدمن).

## فحوصات أمان قبل التنفيذ (تم)

| فحص | الحالة |
|---|---|
| لا CHECK constraints على `now()` (immutability) | ✅ كل CHECKs ثابتة |
| لا تعديل على `auth.*` أو `storage.*` | ✅ |
| RLS مُفعّل على الجدول الجديد | ✅ |
| لا سياسات UPDATE/DELETE (audit log) | ✅ مقصود |
| Functions كلها `SET search_path = public` | ✅ |
| `has_role` المستخدمة موجودة في القاعدة | ✅ موجودة |
| الأعمدة الجديدة كلها NOT NULL DEFAULT false | ✅ آمنة على البيانات الموجودة |
| لا تعارض مع جداول/دوال موجودة (consent_*) | ✅ غير موجودة حالياً |

## آلية التنفيذ
1. تشغيل Migration كاملاً عبر `supabase--migration` (يعرض diff للموافقة قبل التطبيق على القاعدة).
2. بعد النجاح، تشغيل **6 استعلامات تحقّق** عبر `supabase--read_query`:
   - عدد الصفوف في `consent_records` (متوقع 0)
   - عدد الأعمدة الجديدة في `profiles` (متوقع 5)
   - عدد ENUMs الجديدة (متوقع 2)
   - عدد Functions الجديدة (متوقع 5)
   - عدد Triggers بالاسم المحدد (متوقع 1)
   - SELECT من `admin_consent_stats` (متوقع 0 صفوف، بلا أخطاء)
3. تشغيل `supabase--linter` للتحقق من عدم وجود تحذيرات أمان جديدة.
4. تسليم التقرير بالتنسيق العربي المطلوب (✅ لكل اختبار + ملاحظات).

## في حالة فشل أي خطوة
- المعاملات في Supabase migrations تعمل ضمن transaction → فشل أي جزء = rollback كامل.
- سأرفع تقرير الخطأ بالتنسيق `❌` المحدد (الخطوة + رسالة الخطأ + رقم السطر إن أمكن + حالة القاعدة).

## ما لن أفعله في هذه الجولة
- لن أُنشئ أي مكوّن React أو Hook أو صفحة.
- لن أُعدّل `src/integrations/supabase/types.ts` (يتجدد تلقائياً).
- لن أُضيف استدعاءات `record_consent` من الكود — هذا للجولة التالية حسب طلبك.

**عند الموافقة على هذه الخطة، سأشغّل Migration فوراً وأرفع التقرير الكامل.**
