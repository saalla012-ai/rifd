# خطة v9 — Wave C3 ✅ مكتمل (المرحلة 2 — 100%)

## ✅ ما أُنجز هذه الجولة (Wave C3 — Referrals + Annual Upgrade Loop)

### Database
- `referral_codes` — كود فريد 8 أحرف لكل مستخدم (uses_count).
- `referrals` — referrer/referred + status (pending/qualified/rewarded) + reward_points.
- `annual_upgrade_offers` — تتبّع shown/clicked/upgraded للعرض السنوي.
- enum `referral_status` (pending · qualified · rewarded).
- RLS كامل: المستخدم يرى سجلاته فقط · الأدمن يرى الكل · service_role يكتب.
- RPC `generate_referral_code()` — توليد كود فريد بدون أحرف ملتبسة (O/0/I/1).
- RPC `claim_referral_code(_code)` — تسجيل دعوة (يمنع self-referral + already-referred).
- Trigger `qualify_referral_on_paid_plan` على profiles — يؤهّل الإحالة تلقائياً عند ترقية المُحال من free لمدفوعة (50pt للمُحيل).
- RPC `get_referral_stats(_days)` — إحصائيات الأدمن (k-factor, qualified, annual upgrade).

### Frontend
- صفحة جديدة `/dashboard/referrals`:
  - Hero بـ«50pt لكلٍ منكما» + شرح المكافأة.
  - زر «ولّد كودك» إن لم يكن موجوداً، أو عرض الكود مع نسخ + مشاركة واتساب.
  - 3 إحصائيات: مسجّلون · مؤهّلون · نقاط مكتسبة.
  - سجل تفصيلي للإحالات مع حالة كل واحدة.
- مكوّن جديد `<AnnualUpgradeBanner />` في `/dashboard/billing`:
  - يظهر فقط للمشتركين الشهريين بعد 30 يوم نشطين.
  - خصم 20% للترقية السنوية + يربط `/pricing?ref=annual-upgrade`.
  - يُسجّل shown/clicked في `annual_upgrade_offers` (مرة واحدة لكل مستخدم).
- صفحة `/auth` تقبل `?ref=CODE` (validateSearch مع regex `[A-Z0-9]{4,16}`):
  - بعد signUp ناجح يستدعي `claim_referral_code` تلقائياً.
  - تُتبَّع في PostHog: `signup_completed { referred: true/false }`.

### Admin Monitor
- بانر `<PhaseProgressBanner />` رابع لـ Wave C3 (3 محاور: k-factor · مؤهّلة · سنوية).
- 4 بطاقات: أكواد نشطة · إحالات 30 يوم · k-factor · CTR ترقية سنوية.
- توسيع `Phase1Monitor` لـ `wave_c3`.

### النصوص — لغة المنتج موحّدة
- «اكتب نصاً يبيع · صمّم صورة إعلان · ولّد فيديو ترويجي» في رسالة المشاركة.
- «ادعُ صاحب متجر — تحصلون على 50pt لكلٍ منكما».
- «ترقية سنوية بخصم 20% — وفّر شهرين كاملين».
- لا هلوسة — كل CTA مرتبط بميزة فعلية.

### تجاوب + ثيم
- جميع grids بـ `sm:` و `lg:` · بطاقات `flex-col sm:flex-row` للموبايل.
- design tokens فقط: `bg-card`, `border-border`, `text-success`, `text-primary`, `gradient-primary`, `shadow-elegant`.
- Light/Dark بدون كسر · RTL مدعوم.

### Typecheck
- ✅ نظيف · لا استيرادات مكسورة · لا تكرار.

---

## 🎯 KPIs المرحلة 2 (Wave C3)
- **k-factor ≥0.30** — مقاس عبر `referrals_total / new_users`.
- **Annual share ≥35%** — مقاس عبر تحويلات بانر الترقية السنوية.
- **LTV +25%** — أثر متوقّع من زيادة المدة + الإحالات.

---

## 📊 ملخّص المرحلة 2 — مكتملة 100% (3/3 Waves)
- ✅ Wave C1 — Pricing Optimization (CTA + شهادات + tracking).
- ✅ Wave C2 — Activation Email Sequence (5 مراحل + segmentation).
- ✅ Wave C3 — Referrals + Annual Upgrade Loop.

**النمو الذاتي مفعّل**: كل عميل جديد ➜ كود إحالة ➜ 50pt عند ترقية صديقه ➜ بعد 30 يوم بانر ترقية سنوية بـ20% خصم.

---

## 🚀 المرحلة التالية المقترحة — Phase 3: Retention & Expansion
1. **Win-back Campaign** للمستخدمين الذين ألغوا (إيميل + خصم استرداد).
2. **In-app Templates Marketplace** — قوالب جاهزة للحملات الموسمية السعودية.
3. **Affiliate Tier 2** — وكلاء عمولة 20% للوكالات التسويقية.
