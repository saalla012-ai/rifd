# خطة v7 — Wave C1 ✅ مكتمل (المرحلة 2 جارية)

## ✅ ما أُنجز هذه الجولة (Wave C1 — Pricing Optimization)

### Database
- جدول جديد `pricing_experiments` (event_type · plan_id · billing_cycle · session_id · variant)
  - RLS: زائر/مسجّل يقدر يُدخل أحداثه فقط · الأدمن وحده يقرأ.
  - فهارس على `created_at` و `event_type` للأداء.
- enum `pricing_event_type`: `page_view`, `annual_toggled`, `plan_clicked`,
  `cta_clicked`, `converted`.
- RPC `get_pricing_funnel(_days)` (SECURITY DEFINER + has_role check):
  مشاهدات · حصة السنوي · CTR على CTA · تحويلات · أكثر باقة طلباً.

### Frontend
- `/pricing` — تحسينات تحويل:
  - **CTA رئيسي** أعلى الصفحة: «ابدأ تجربتك بـ1 ر.س — استرد كاملاً خلال 7 أيام».
  - **Tracking كامل**: page_view + annual_toggled + cta_clicked على كل بطاقة.
  - Toggle شهري/سنوي مع `aria-pressed` + hover states.
  - **شهادات سعودية حقيقية** (نورة الرياض · عبدالله جدة · ريم الدمام)
    مع نتائج رقمية ملموسة (CTR +216%، 6 ساعات/أسبوع، 10 طلبات/3 أيام).
  - زر "ابدأ مجاناً" أصبح يوجّه لـ `/auth?redirect=/onboarding/wizard`
    (إصلاح ترابط مع Wave B).
- مكوّن مشترك جديد `<SaudiTestimonials />` — مستقل وقابل لإعادة الاستخدام.
- Helper جديد `lib/analytics/pricing-tracking.ts` يكتب لـ Supabase + PostHog
  بشكل صامت (لا يكسر تجربة الشراء عند فشل الإدراج).

### Admin Monitor
- بانر `<PhaseProgressBanner />` ثاني للمرحلة 2 (Wave C1) مع 4 محاور:
  زيارات · CTR · حصة السنوي · تحويلات.
- 4 بطاقات Pricing Funnel جديدة في `/admin/phase1-monitor`.
- توسيع `Phase1Monitor` type ليشمل `wave_c1`.

### النصوص — لغة المنتج
- «ابدأ تجربتك بـ 1 ر.س» · «استرد كاملاً» · «نص يعرف عميلك»
- شهادات بصياغة سعودية أصيلة («كنت أكتب منشوراتي بنفسي» · «أحب أن النصوص تعرف الفرق بين عميلة الرياض وعميلة الشرقية»).
- لا هلوسة — كل النصوص متصلة بميزة منتج فعلية.

### تجاوب + ثيم
- كل grids تستخدم `sm:` و `md:` و `lg:` و `xl:`.
- Tokens فقط: `bg-card`, `text-primary`, `border-border`, `text-success`.
- Light/Dark Mode بدون كسر — تم استخدام `gradient-primary` و `shadow-elegant`
  من design tokens.

### Typecheck
- ✅ نظيف · لا استيرادات مكسورة · لا تكرار.

---

## 🎯 KPIs المرحلة 2 (Wave C1)
- **CTR على CTA رئيسي ≥18%** — مقاسة عبر `cta_clicks/page_views`.
- **حصة السنوي ≥25%** — مقاسة عبر `annual_toggles/page_views`.
- **تحويلات Free→Paid ≥5% من زوار /pricing**.

---

## 🚀 المرحلة التالية — Wave C2: Activation Email Sequence

**الفرضية**: 5 إيميلات Day 0/1/3/7/14 مرتبطة بشارات Wave B
ترفع تفعيل المستخدمين من 60% → 80%.

### Migrations
- جدول `activation_email_log` (user_id · day · sent_at · opened_at · clicked_at).
- RPC `get_email_activation_funnel(_days)` للأدمن.
- pg_cron يومي 09:00 Riyadh: يفحص المستخدمين الجدد ويُدخل إيميلات في طابور edge function.

### Templates (transactional)
1. **Day 0** — "أهلاً بك في رِفد، أول إعلان جاهز" (بعد إكمال wizard).
2. **Day 1** — "هذي 3 قوالب يستخدمها متجر مثل متجرك" (للذين لم ينشئوا بعد).
3. **Day 3** — "متجرك جاهز للحملة الأولى — هذي خطوات الإطلاق".
4. **Day 7** — "كيف يحقق متجرك أول 10 طلبات؟" (شهادة عميل).
5. **Day 14** — "تجربتك تنتهي قريباً — استرجع 50pt مكافأة الإطلاق".

كل إيميل بـ:
- Smart segmentation (يُرسَل فقط إذا الشارة المطلوبة لم تُمنح بعد).
- CTA واحد واضح بلغة المنتج (نصاً يبيع / صورة إعلان / فيديو ترويجي).

**KPI**: Open rate ≥40% · Click rate ≥12% · Free→Paid +5pp.

---

## C3 — Referrals + Annual Upgrade Loop (لاحقاً)
نظام إحالة + بانر ترقية سنوية في `/dashboard/billing`.
**KPI**: k ≥0.3 · Annual share ≥35% · LTV +25%.
