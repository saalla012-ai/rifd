

# الأسبوع 2 — الموثوقية والقياس

## الهدف
رفع نضج المنصة من **48/70 → 56/70** عبر إضافة قياس فعلي للتكلفة، رسائل onboarding آلية، وحماية الـdashboard من الانهيار الصامت.

## المهام (4 محاور)

### 1. تتبّع التوكنز والكلفة الفعلية
**المشكلة:** `generations` لا تحفظ `prompt_tokens / completion_tokens / total_tokens / estimated_cost_usd`. لا نعرف كم يكلّفنا كل مستخدم فعلياً.

**التنفيذ:**
- migration: إضافة 4 أعمدة على `generations`:
  - `prompt_tokens int`, `completion_tokens int`, `total_tokens int`, `estimated_cost_usd numeric(10,6)`
  - فهرس على `(created_at)` لـreports.
- تعديل `src/server/lovable-ai.ts` → استخراج `usage` من `json` (OpenAI compatible response يحوي `usage.prompt_tokens` و `completion_tokens`) وإرجاعها.
- تعديل `src/server/ai-functions.ts` (3 functions: generateText, generateImage, editImage) لتمرير الـusage في `metadata` + الأعمدة الجديدة، مع حساب تقديري للكلفة:
  - text models: ~$0.075/1M input + $0.30/1M output (Gemini Flash)
  - image models: تقدير ثابت لكل صورة ($0.04 flash, $0.10 pro)

### 2. سلسلة Onboarding Email
**المشكلة:** المستخدم يسجّل ولا يستلم welcome ولا توجيه. فقدان صامت.

**التنفيذ:**
- إضافة قالبين جديدين في `src/lib/email-templates/`:
  - `welcome.tsx` — يُرسل فور تسجيل المستخدم (signup trigger).
  - `onboarding-tip-day3.tsx` — تذكير بإكمال الـonboarding واستخدام أول قالب.
- تسجيلهما في `registry.ts`.
- مسار cron جديد: `src/routes/hooks/onboarding-emails.ts` — يفحص يومياً:
  - مستخدمون سجّلوا قبل 0-12h ولم يستلموا welcome → enqueue welcome.
  - مستخدمون سجّلوا قبل 3 أيام (±12h) ولم يكملوا onboarding → enqueue tip.
- إضافة pg_cron job يومياً 09:00 الرياض (06:00 UTC).

### 3. Dashboard Error Boundary + Empty States
**المشكلة:** `src/routes/dashboard.tsx` فارغ تماماً (`<Outlet />` فقط). أي خطأ في صفحة فرعية يكسر التطبيق بدون رسالة.

**التنفيذ:**
- إضافة `errorComponent` و `notFoundComponent` على `dashboard.tsx`.
- إضافة `pendingComponent` (skeleton لطيف) لتجارب الـloading.
- لا تغيير في الـlayout البصري (الـ`dashboard-shell` موجود في الصفحات الفرعية).

### 4. تحديث `usage-month` للاستخدام في تقارير الكلفة
**المشكلة:** لا يوجد server function يجمّع كلفة المستخدم الشهرية.

**التنفيذ:**
- إضافة server function `getUserMonthlyCost` في `src/server/ai-functions.ts` ترجع:
  - `total_tokens`, `total_cost_usd`, breakdown by type.
- (لا UI الآن — البيانات تتراكم للأسبوع 5 حين نبني الـdashboard analytics).

## ملفات ستُعدّل/تُنشأ
**Create:**
- `supabase/migrations/<ts>_generations_cost_tracking.sql`
- `src/lib/email-templates/welcome.tsx`
- `src/lib/email-templates/onboarding-tip-day3.tsx`
- `src/routes/hooks/onboarding-emails.ts`

**Modify:**
- `src/server/lovable-ai.ts` (استخراج usage)
- `src/server/ai-functions.ts` (حفظ tokens + cost + إضافة getUserMonthlyCost)
- `src/lib/email-templates/registry.ts` (تسجيل القالبين)
- `src/routes/dashboard.tsx` (error/notFound/pending)

## ما لن يُنجز هذا الأسبوع (مؤجَّل عن قصد)
- **Moyasar** → الأسبوع 3.
- **dashboard analytics UI** → الأسبوع 5 (نحتاج بيانات تتراكم أولاً).
- **referral system** → الأسبوع 6.
- **حذف UrgencyBar/SubscribersCounter** — قرار تجاري ينتظر موقفك (لم تطلبه صراحة).

## معايير القبول
1. أي توليد جديد يخزّن `prompt_tokens`, `completion_tokens`, `estimated_cost_usd` في `generations`.
2. مستخدم جديد يستلم welcome email خلال 12 ساعة من التسجيل (بعد تشغيل cron).
3. خطأ مفتعل في `/dashboard/library` يُعرض كرسالة واضحة بزر "حاول مجدداً" بدل شاشة بيضاء.
4. استعلام `SELECT sum(estimated_cost_usd) FROM generations WHERE user_id=…` يعمل.

