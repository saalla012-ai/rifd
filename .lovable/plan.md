# خطة v7 — مراجعة + تجهيز Wave C

## ✅ مراجعة المرحلة 1 (هذه الجولة)

### إصلاحات حرجة على الترابط (Wave B)
كان `auth.tsx` و `index.tsx` يوجّهان إلى `/onboarding` القديم (صفحة واحدة)
بينما `dashboard.tsx` يوجّه إلى `/onboarding/wizard` الجديد. النتيجة:
معظم المستخدمين الجدد لم يكونوا يدخلون الـ wizard إطلاقاً، ما يُفرّغ
Wave B من معناه ويكسر KPIs.

**الحل المُنفّذ**:
- `/onboarding` (القديم 486 سطر) → استُبدل بمكوّن خفيف يعيد التوجيه
  تلقائياً إلى `/onboarding/wizard` (مع حماية `profile.onboarded → /dashboard`).
- `auth.tsx` يوجّه كل المستخدمين الجدد (signup عبر Email/Apple/Google)
  مباشرة إلى `/onboarding/wizard`.
- `index.tsx` CTA "ابدأ مجاناً" يفتح المسار الموحد.
- لا حذف لأي ميزة قانونية — منطق consent يبقى متاحاً وسيُدمج لاحقاً
  داخل خطوة من الـ wizard ضمن Wave C.

### بنود المراجعة
- ✅ typecheck نظيف.
- ✅ مكونات Wave B (`BadgesList`, `FirstWinToast`, `EmptyStateCTA`)
   مستخدمة فعلياً في settings/library/templates و dashboard-shell.
- ✅ لا تكرار في المكونات.
- ✅ كل النصوص بلغة المنتج (يبيع/جاهز للنشر/زاوية بيع سعودية) — لا هلوسة.
- ✅ Light/Dark Mode عبر tokens فقط (`bg-card`, `text-primary`, `border-border`).
- ✅ تجاوب: `sm:` و `lg:` على كل grids؛ wizard مبني `max-w-2xl` متمركز.

### نسبة التقدم
أُضيف مكوّن `<PhaseProgressBanner />` أعلى `/admin/phase1-monitor`:
يحسب جاهزية المرحلة 1 من 6 محاور (Refund · Fallback · Wizard ·
First-Win · Conversion · Launch Bonus) ويعرض نسبة تجميعية + شريط
تقدم لكل محور مع علامة "تحقّق الهدف".

---

## 🚀 المرحلة التالية — Wave C1: Pricing Page Optimization

**الفرضية**: تحسين `/pricing` يرفع التحويل المباشر بـ30-50% — أعلى ROI
لجولة واحدة (ساعات تطوير قليلة، أثر فوري على الإيراد).

### Migrations
- جدول `pricing_experiments(variant, user_id, viewed_at, converted_at)`
  لقياس A/B بين تصاميم.
- RPC `get_pricing_funnel(_days)` للأدمن.

### Frontend
1. إعادة تصميم `/pricing`:
   - **Annual toggle** (شهري ↔ سنوي بخصم 20%) أعلى الصفحة.
   - **بطاقة "الأكثر شعبية"** بشريط ذهبي على Pro.
   - **مقارنة جدولية** (Free vs Pro vs Business) موبايل-أولاً.
   - **3 شهادات سعودية** (نطلب من العميل) + **شريط ضمان 7 أيام**.
   - **Launch banner** يستهلك `LAUNCH_BADGE_LABEL` الموجود.
2. CTA رئيسي: "ابدأ تجربتك بـ 1 ر.س — استرد كاملاً خلال 7 أيام".
3. Tracking: page_view, plan_clicked, annual_toggled, cta_clicked.

### Admin Monitor
- بطاقات "Pricing CTR" + "Annual share" + funnel جدولي.
- تكامل مع `PhaseProgressBanner` (المرحلة 2 ستحلّ محل المرحلة 1).

**KPI**: CTR على CTA رئيسي ≥18% · share سنوي ≥25%.

---

## التتابع المعتمد
1. **C1 — Pricing** (هذه الجولة القادمة): أعلى أثر مباشر.
2. **C2 — Activation Emails**: يبني فوق شارات Wave B.
3. **C3 — Referrals + Annual Upgrade**: يحتاج C1 جاهزة.
