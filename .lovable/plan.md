

## مراجعة الخطة من كل الزوايا

### الزاوية 1: التحويل (Conversion) ✅ سليمة
- صفحة `/auth` تبقى 3 حقول → أعلى معدل تحويل ممكن.
- مستخدم Google لا يتأثر إطلاقاً (ما نقدر نطلب منه شي قبل OAuth أصلاً).

### الزاوية 2: الحماية التقنية ⚠️ تحتاج تدعيم
بعد فحص الكود:
- `src/routes/dashboard.tsx` (الـ layout) → **لا يتحقق** من `profile.onboarded` حالياً. فقط `auth.tsx` يحوّل بعد تسجيل الدخول مباشرة. يعني لو مستخدم قديم (سجّل قبل فرض الحقل) يدخل `/dashboard` مباشرة → يتجاوز onboarding.
- **الحل:** إضافة `beforeLoad` أو `useEffect` في `dashboard.tsx` يحوّل أي مستخدم بـ`onboarded=false` إلى `/onboarding`.

### الزاوية 3: المستخدمون الحاليون 🔍 نقطة مهمة
- المستخدمون الذين أكملوا onboarding **قبل** هذا التغيير ليس عندهم رقم (`whatsapp = null`) لكن `onboarded = true`.
- **خياران:**
  - **A) تساهل:** نتركهم، ونطلب الرقم فقط من الجدد + من يدخل الإعدادات.
  - **B) إجبار رجعي:** نضيف فحص في `dashboard.tsx`: لو `onboarded=true` لكن `whatsapp=null` → نحوّل لصفحة استكمال (`/dashboard/settings` أو modal).
- **التوصية:** **B** — استمارة استكمال خفيفة (modal أو بانر) لا تكسر تجربتهم لكن تجمع الرقم.

### الزاوية 4: الإعدادات 🔒
- `dashboard.settings.tsx` حالياً يقبل مسح الرقم (`whatsapp.trim() === ""` يحفظ `null`).
- **الحل:** جعل الحقل required في الـ validation، رفض الحفظ إذا فاضي.

### الزاوية 5: subscription_requests 💳
- جدول `subscription_requests.whatsapp` already `NOT NULL` — جيد، يضمن أن أي طلب اشتراك فيه رقم. لكن نموذج إنشاء الطلب يجب أن يستخدم `profile.whatsapp` كقيمة افتراضية.

### الزاوية 6: تجربة المستخدم في /onboarding 🎨
- الخطوات الحالية: 1=اسم متجر، 2=نوع، 3=جمهور، 4=نبرة+لون، 5=نتيجة.
- **أين نضع الرقم؟** أفضل مكان: **الخطوة 1** (مع اسم المتجر) → سياق "بيانات الاتصال + الهوية".
- بدلاً من إضافة خطوة سادسة (يضيف احتكاك)، ندمجه مع الخطوة 1.

---

## الخطة النهائية المعتمدة

### 1. `/onboarding` (الخطوة 1) — `src/routes/onboarding.tsx`
- إضافة حقل **رقم واتساب إجباري** بجانب اسم المتجر.
- استخدام `validateSaudiPhone` + `SAUDI_PHONE_PLACEHOLDER` + `SAUDI_PHONE_ERROR` (موجودة في `src/lib/phone.ts`).
- زر "التالي" معطّل حتى يصحّ الاسم **و** الرقم.
- نص توضيحي مُحفِّز: *"للتنبيهات المهمة وتفعيل اشتراكك — لن نتصل بك مطلقاً، واتساب فقط"*.
- في `finish()`: حفظ `whatsapp = normalizeSaudiPhone(...)` ضمن `UPDATE profiles`.

### 2. حماية لوحة التحكم — `src/routes/dashboard.tsx`
- إضافة فحص داخل الـ layout: لو `profile && !profile.onboarded` → `navigate({ to: "/onboarding" })`.
- لو `onboarded=true` لكن `whatsapp=null` (مستخدم قديم) → `navigate({ to: "/onboarding" })` أيضاً (نعيد استخدام نفس الصفحة، تعرض الخطوة 1 فقط ويكمل).

### 3. الإعدادات — `src/routes/dashboard.settings.tsx`
- حذف شرط `if (whatsapp.trim())` — الرقم **مطلوب دائماً**.
- إذا فاضي → `toast.error(SAUDI_PHONE_ERROR)` ورفض الحفظ.
- إضافة علامة `*` بجانب Label.
- تحديث النص التوضيحي ليعكس الإلزام.

### 4. نموذج طلب الاشتراك — `src/routes/dashboard.billing.index.tsx`
- التأكد من تعبئة `whatsapp` من `profile.whatsapp` كقيمة افتراضية (نتحقق ونعدّل إن لزم).

### 5. لا تغيير في:
- `src/routes/auth.tsx` (يبقى 3 حقول).
- قاعدة البيانات (الحقل موجود).
- `handle_new_user()` trigger.
- نظام الصلاحيات/RLS.

---

## الملفات المتأثرة

| ملف | التغيير |
|---|---|
| `src/routes/onboarding.tsx` | حقل واتساب إجباري في الخطوة 1 |
| `src/routes/dashboard.tsx` | فحص `onboarded` + `whatsapp` وإعادة توجيه |
| `src/routes/dashboard.settings.tsx` | جعل الرقم مطلوب (لا يمكن مسحه) |
| `src/routes/dashboard.billing.index.tsx` | تأكيد القيمة الافتراضية من profile |

## ما لن نفعله
- ❌ تغيير صفحة التسجيل (`/auth`).
- ❌ OTP (مؤجّل بقرارك).
- ❌ migration لقاعدة البيانات (الحقل موجود).
- ❌ لمس مستخدمي Google قبل onboarding.

## النتيجة
- 100% من المستخدمين الجدد سيدخلون رقمهم.
- المستخدمون القدامى يكملون عند أول دخول.
- صفر تأثير على معدل التسجيل.

