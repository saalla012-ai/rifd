# خطة v8 — Wave C2 ✅ مكتمل (المرحلة 2)

## ✅ ما أُنجز هذه الجولة (Wave C2 — Activation Email Sequence)

### Database
- جدول `activation_email_log` (user_id · day_marker · template_name ·
  recipient_email · sent_at · skipped + skip_reason · opened_at · clicked_at).
  - Unique على (user_id, day_marker) — يمنع إرسال نفس اليوم مرتين.
  - RLS: المستخدم يرى سجلّه فقط · الأدمن يقرأ الكل · service_role يكتب.
  - فهارس على user_id و sent_at و day_marker.
- RPC `get_email_activation_funnel(_days)` (SECURITY DEFINER + has_role):
  لكل يوم (0/1/3/7/14): sent · skipped · opened · clicked · open_rate · click_rate.
- pg_cron يومي 06:00 UTC (09:00 Riyadh):
  `rifd-activation-emails-daily` → يستدعي
  `https://project--{id}.lovable.app/api/public/hooks/activation-sequence`.

### Backend (TanStack server route)
- مسار جديد: `/api/public/hooks/activation-sequence`
  - يفحص 5 مراحل بنافذة ±12 ساعة حول كل علامة (Day 0/1/3/7/14).
  - **Anchor مختلف لكل مرحلة**:
    - Day 0 → `onboarding_completed_at` (بعد إكمال wizard).
    - Day 1/3/7/14 → `created_at` (من تاريخ التسجيل).
  - **Smart Segmentation حسب الشارات**:
    - Day 0 يُتخطّى إذا مُنحت شارة `active_store`.
    - Day 1 يُتخطّى إذا مُنحت `first_text`.
    - Day 7 يُتخطّى إذا مُنحت `first_image`.
    - Day 3 يُرسَل فقط إن `onboarded=false`.
    - Day 14 يُرسَل فقط إن `plan='free'`.
  - يُسجّل كل محاولة في `activation_email_log` مع سبب التخطّي.
  - Suppression check قبل الإرسال (لا يُرسل لمن أوقف الاشتراك).

### Email Templates (React Email)
- جديد: `activation-day0.tsx` — «متجرك جاهز — أول إعلان احترافي بانتظارك ✨»
  - 3 CTAs بلغة المنتج: «اكتب نصاً يبيع» · «صمّم صورة إعلان» · «ولّد فيديو ترويجي».
- جديد: `activation-day14.tsx` — «50pt مكافأة الإطلاق تنتهي قريباً 🎁»
  - يربط مكافأة Wave A بعرض الترقية.
- إعادة استخدام: `welcome` · `onboarding-day1` · `onboarding-tip-day3` ·
  `onboarding-day7` (موجودة من Wave B لا تكرار).
- مُسجَّلة في `src/lib/email-templates/registry.ts`.

### Admin Monitor
- بانر `<PhaseProgressBanner />` ثالث للمرحلة 2 (Wave C2) مع 3 محاور:
  Sent · Open Rate (هدف 40%) · Click Rate (هدف 12%).
- 4 بطاقات Activation Funnel:
  إجمالي الإرسال · Open % · Click % · مراحل نشطة.
- جدول تفصيلي لكل مرحلة (Day Marker): sent · skipped · opened · clicked.
- توسيع `Phase1Monitor` type ليشمل `wave_c2`.

### النصوص — لغة المنتج موحّدة
- «اكتب نصاً يبيع» · «صمّم صورة إعلان» · «ولّد فيديو ترويجي»
- «50pt مكافأة الإطلاق» (متّسقة مع Wave A).
- لا هلوسة — كل CTA يربط بميزة منتج فعلية.

### تجاوب + ثيم
- بطاقات Wave C2 تستخدم `sm:grid-cols-2 lg:grid-cols-4`.
- الجدول التفصيلي `overflow-x-auto` للموبايل.
- Tokens فقط: `bg-card`, `border-border`, `text-success`, `text-muted-foreground`.
- Light/Dark Mode بدون كسر.

### Typecheck
- ✅ نظيف · لا استيرادات مكسورة · لا تكرار.

---

## 🎯 KPIs المرحلة 2 (Wave C2)
- **Open rate ≥40%** — مقاس عبر `opened_at IS NOT NULL`.
- **Click rate ≥12%** — مقاس عبر `clicked_at IS NOT NULL`.
- **Free → Paid +5pp** — مقاس عبر تحويلات Day 14.

---

## 🚀 المرحلة التالية — Wave C3: Referrals + Annual Upgrade Loop

### Migrations
- جدول `referrals` (referrer_id · referred_id · code · status · reward_granted_at).
- RPC `generate_referral_code(user_id)` و `claim_referral(code)`.
- جدول `annual_upgrade_offers` للمستخدمين الشهريين بعد 30 يوم.

### Frontend
- صفحة `/referrals` — كود مشاركة + تتبّع المُحالين.
- بانر ترقية سنوية في `/dashboard/billing` بعد 30 يوم اشتراك شهري.
- خصم 20% عند ترقية شهري→سنوي.

### KPIs
- **k ≥0.3** — متوسط إحالات لكل مستخدم.
- **Annual share ≥35%** — حصة الباقات السنوية من الإيرادات.
- **LTV +25%** — قيمة العميل مدى الحياة.
