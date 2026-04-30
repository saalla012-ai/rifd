
# بناء UI نظام تتبّع الموافقات (PDPL) — المرحلة الثانية

## نطاق العمل
بناء واجهة الموافقات الكاملة فوق Migration المعتمد سابقاً، بحيث يستطيع المستخدم منح/سحب موافقاته في **Onboarding** و**Settings**، وتُسجَّل كل عملية كسجل غير قابل للتعديل في `consent_records`.

## الملفات

### 1. إنشاء `src/server/consent-functions.ts`
ثلاث Server Functions تستدعي PostgreSQL functions الموجودة عبر `requireSupabaseAuth`:

- `recordConsent({ consent_type, consent_given, source, metadata? })` → يبني نص الموافقة من ثوابت `CONSENT_TEXTS` على السيرفر (المستخدم لا يتحكم بالنص) → `supabase.rpc('record_consent', …)`.
- `withdrawConsent({ consent_type, reason? })` → `supabase.rpc('withdraw_consent', …)`.
- `getUserConsentStatus()` → `supabase.rpc('get_user_consent_status', { _consent_type: null })` → يعيد `Record<ConsentType, { given, last_updated, source, version }>`.

كلها بـ Zod validation صارم على الـ ENUMs (`marketing_email | marketing_whatsapp | marketing_telegram | product_updates`) والـ source. الأخطاء بالعربية: "تعذّر حفظ موافقتك، حاول لاحقاً".

ثوابت مشتركة في نفس الملف:
- `CONSENT_TEXTS` (4 نصوص بالحرف من المتطلبات)
- `CONSENT_VERSION = "v1"`
- `export type ConsentType` و `ConsentStatus`

### 2. إنشاء `src/components/consent-dialog.tsx`
Component "controlled" خفيف للاستخدام داخل Onboarding (Checkboxes فقط، لا يحفظ بنفسه):

```
Props: {
  values: { email: boolean; whatsapp: boolean; productUpdates: boolean };
  onChange: (key: "email"|"whatsapp"|"productUpdates", value: boolean) => void;
  disabled?: boolean;
}
```

التصميم:
- شارة في الأعلى: "متوافق مع نظام حماية البيانات السعودي (PDPL)" بأيقونة `ShieldCheck`.
- 3 بطاقات Checkbox (shadcn `Checkbox` + `Label` بـ `htmlFor`)، لكل بطاقة: عنوان قصير + سطر شرح + النص الكامل من `CONSENT_TEXTS` كـ `<p className="text-xs text-muted-foreground">`.
- ملاحظة أسفل: "اختياري — تقدر تغيّرها أي وقت من الإعدادات".
- Mobile-first: padding مريح، touch targets ≥ 44px، يعمل على 375px.
- Tokens فقط (`bg-card`, `border-border`, `text-foreground`, إلخ) — يدعم Dark/Light تلقائياً.

### 3. إنشاء `src/components/consent-settings.tsx`
Component مستقل يُحمّل الحالة ويحفظ بنفسه (Switch لكل نوع — 4 إجمالاً):

- عند mount: `useQuery` يستدعي `getUserConsentStatus()` → Skeleton أثناء التحميل.
- 4 Switches (email, whatsapp, telegram, product_updates) داخل بطاقة واحدة، كل صف: عنوان + نص قصير + Switch مع `aria-label`.
- onChange: optimistic update + استدعاء `recordConsent` (إذا on) أو `withdrawConsent` (إذا off) مع `source: 'settings'`.
- في حال الفشل: rollback + `toast.error("حدث خطأ، حاول مرة أخرى")`.
- في حال النجاح: `toast.success("تم حفظ تفضيلاتك")`.
- زر/Switch disabled أثناء حفظ ذلك الصف فقط (لا يقفل بقية الصفوف).
- يعرض `consent_last_updated_at` بصيغة "آخر تحديث: قبل X" أسفل البطاقة.

### 4. تحديث `src/routes/onboarding.tsx`
- إضافة state: `consents = { email: true, whatsapp: false, productUpdates: true }` (الافتراضات حسب أفضل ممارسات PDPL: opt-in واضح، WhatsApp **افتراضياً off** لأنه أكثر تطفلاً).
- إضافة `<ConsentDialog>` داخل البطاقة الموجودة، أسفل قسم النبرة وفوق زر "أنشئ أول حزمة بيع".
- في `finish()` (وأيضاً `skipToDashboard()`): بعد نجاح `upsert` للـ profile، استدعاء **3 Server Functions بالتوازي** (`Promise.allSettled`) لتسجيل الموافقات الثلاث بـ `source: 'onboarding'` و `metadata: { onboarding_step: 'final' }`.
- إذا فشل أيٌّ منها: `console.warn` + `toast.error` خفيف لكن **بدون إيقاف** التدفق (نواصل لـ success/dashboard).

### 5. تحديث `src/routes/dashboard.settings.tsx`
- حذف بطاقة "الإشعارات (قريباً)" المعطّلة الموجودة حالياً (أصبحت ميتة بعد إضافة الجديد).
- إضافة قسم جديد بعنوان **"إعدادات التواصل والتسويق"** يحتوي `<ConsentSettings />`، يأتي بعد بطاقة "معلومات الحساب" مباشرة.
- بما أنه لا يوجد قسم "حذف الحساب" حالياً، نضع الجديد في النهاية.

## ما سأحذفه (مع الإبلاغ)
- بطاقة "الإشعارات (قريباً)" في `dashboard.settings.tsx` (السطور 152-173): 3 Switches معطّلة بدون منطق، استُبدلت بنظام Consent الحقيقي.

## المنطق التقني الدقيق

### تدفق Onboarding
```text
Form → finish/skip clicked
  ↓
upsert(profiles)            ← كما هو
  ↓
Promise.allSettled([
  recordConsent(email, ✓/✗, 'onboarding'),
  recordConsent(whatsapp, ✓/✗, 'onboarding'),
  recordConsent(productUpdates, ✓/✗, 'onboarding'),
])
  ↓ (لا يوقف الفشل)
generateText() → success stage   (في finish فقط)
```

### تدفق Settings toggle
```text
Switch onChange(true)
  ↓ optimistic: setLocal(true), setSavingRow(type)
recordConsent(type, true, 'settings')
  ✓ → toast.success + refetch
  ✗ → setLocal(false) + toast.error
finally: setSavingRow(null)
```

### الأمان
- نصوص الموافقات لا تُمرَّر من العميل إطلاقاً — السيرفر يبنيها من ثابت داخلي حسب `consent_type`. هذا يضمن الإصدار `v1` ويمنع تلاعب العميل بالنص القانوني.
- `user_agent` يُلتقط من السيرفر عبر `getRequestHeader('user-agent')` لا من `navigator.userAgent` (أكثر دقة وأمان).
- IP يُسجَّل تلقائياً عبر `inet_client_addr()` على مستوى DB (أو نتركه null إذا لم يكن متاحاً عبر RPC — السلوك الحالي للـ migration).

### التوافق مع التصميم الحالي
- Tokens فقط، لا ألوان hardcoded.
- نفس بنية البطاقات: `rounded-xl border border-border bg-card p-5 shadow-soft`.
- نفس نبرة النصوص: مختصرة، فعل + فائدة، عربي فصيح بسيط.
- Loading: `<Loader2 className="h-4 w-4 animate-spin" />` كما في باقي المشروع.
- Skeleton: من `@/components/ui/skeleton`.

## معايير القبول
1. مستخدم جديد يكمل Onboarding باختيار (✓ email, ✗ whatsapp, ✓ productUpdates) → 3 صفوف في `consent_records` بـ `source='onboarding'`.
2. `profiles` تعكس: `marketing_email_opt_in=true, marketing_whatsapp_opt_in=false, product_updates_opt_in=true, consent_last_updated_at=now()` (عبر الـ trigger).
3. صفحة Settings تعرض الـ 4 Switches بالحالة الصحيحة (telegram=false لأنه لم يُسجَّل بعد).
4. تعطيل email من Settings → سجل جديد بـ `consent_given=false, withdrawn_at=now(), source='settings'` + `profiles.marketing_email_opt_in=false`.
5. لا أخطاء console، يعمل على 375px، Dark/Light سليم، keyboard-navigable.

## ما لن أفعله
- لن ألمس `types.ts` (يتجدّد تلقائياً، الأنواع الجديدة `consent_type` و `consent_source` ستظهر فيه).
- لن أُضيف cookie banner جديد (`cookie-banner.tsx` موجود وله نطاق مختلف).
- لن أبني صفحة "تصدير بياناتي" أو "حذف حسابي" — خارج نطاق هذه الجولة.
- لن أُضيف checks في Edge Functions للإرسال التسويقي — `has_marketing_consent()` جاهزة للاستخدام لاحقاً عند بناء أي مُرسِل تسويقي فعلي.

**عند الموافقة، أبدأ التنفيذ بالترتيب: (1) consent-functions.ts → (2) consent-dialog.tsx → (3) consent-settings.tsx → (4) دمج onboarding → (5) دمج settings، ثم تقرير نهائي.**
