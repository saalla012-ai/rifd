# خطة v6 — مكتملة (نسبة التقدم: 100%)

## ✅ Wave B — Onboarding & First-Win

### Migrations
- ✅ `profiles.onboarding_step` + `onboarding_completed_at`.
- ✅ `onboarding_events` + RLS + indexes.
- ✅ `badge_type` enum + `user_badges` + UNIQUE + Realtime.
- ✅ Triggers تلقائية: first_text/first_image/first_video + active_store.
- ✅ RPCs: `get_user_badges()` + `get_onboarding_funnel(_days)`.

### Frontend
- ✅ `/onboarding/wizard`: 3 خطوات + Auto-generate نص+صورة بالتوازي + retry ×2.
- ✅ `FirstWinToast` realtime + `BadgesList` في الإعدادات.
- ✅ `EmptyStateCTA` موحّد على `library` + `templates`.
- ✅ Redirect تلقائي `onboarded=false` → `/onboarding/wizard`.

### Admin Monitor & Telegram
- ✅ قسم Wave B في `/admin/phase1-monitor` (4 بطاقات + جدول funnel).
- ✅ Telegram daily report يحمل: Wizard started/completed، completion %،
   شارات 24س.
- ✅ **Hotfix هذه الجولة**: تكييف قراءة `get_onboarding_funnel` مع الشكل
   المسطّح الفعلي للدالة (total_started, step1/2/3_completed) لتفادي
   كسر القسم الجديد عند التحميل.

## 🚀 الجاهزية للمرحلة التالية
- typecheck نظيف · server function يستجيب · لا استيرادات مكسورة.
- KPIs مُستهدفة: Wizard ≥75% · First-Win أول جلسة ≥60% · "متجر نشط" 7 أيام ≥30%.

---

# خطة v7 — Wave C (مقترحة للموافقة)

**الهدف**: زيادة التحويل (Free→Paid) من ~5% إلى ≥12% خلال 60 يوم
عبر 3 موجات متتالية (C1→C2→C3).

## C1 — Pricing Page Optimization (الأولوية الأعلى)

**الفرضية**: صفحة أسعار محسّنة ترفع التحويل المباشر بـ 30-50%.

### Migrations
- جدول `pricing_experiments` (variant, user_id, viewed_at, converted_at).
- RPC `get_pricing_funnel(_days)` للأدمن.

### Frontend
1. إعادة تصميم `/pricing` بـ:
   - **Annual toggle** (شهري / سنوي بخصم 20%) — أعلى الصفحة.
   - **بطاقة "الأكثر شعبية"** بشريط ذهبي على Pro.
   - **مقارنة جدولية** (Free vs Pro vs Business) موبايل-أولاً.
   - **3 شهادات سعودية** بصور حقيقية (نطلب من العميل).
   - **شريط ضمان 7 أيام** ثابت (REFUND_GUARANTEE_LABEL).
   - **Launch banner** يستهلك `LAUNCH_BADGE_LABEL` (موجود).
2. CTA رئيسي: "ابدأ تجربتك بـ 1 ر.س — استرد كاملاً خلال 7 أيام".
3. Tracking كل: page_view, plan_clicked, annual_toggled, cta_clicked.

### Admin Monitor
- بطاقة "Pricing CTR" + "Annual share" + funnel جدولي.

**KPI**: CTR على CTA رئيسي ≥18% · share سنوي ≥25%.

---

## C2 — Activation Email Sequence (Day 0/1/3/7/14)

**الفرضية**: 5 إيميلات مُحفِّزة (مرتبطة بشارات Wave B) ترفع
التفعيل من 60% إلى 80%.

### Migrations
- جدول `activation_email_log` (user_id, day, sent_at, opened_at, clicked_at).
- RPC `get_email_activation_funnel(_days)` للأدمن.
- Cron يومي 09:00 Riyadh يفحص المستخدمين الجدد ويضع إيميلات في الطابور.

### Templates (transactional)
1. **Day 0** — "أهلاً بك في رِفد، أول إعلان جاهز" (يأتي بعد إكمال wizard).
2. **Day 1** — "هذي 3 قوالب يستخدمها متجر مثل متجرك" (يستهدف من لم ينشئ شيء).
3. **Day 3** — "متجرك جاهز للحملة الأولى — هذي خطوات الإطلاق".
4. **Day 7** — "كيف يحقق متجرك أول 10 طلبات؟" (شهادة عميل).
5. **Day 14** — "تجربتك تنتهي قريباً — استرجع 50pt مكافأة الإطلاق".

كل إيميل بـ:
- Smart segmentation (يُرسَل فقط إذا الشارة المطلوبة لم تُمنح بعد).
- CTA واحد واضح (نصاً يبيع / صورة إعلان / فيديو ترويجي).

**KPI**: Open rate ≥40% · Click rate ≥12% · Free→Paid +5pp.

---

## C3 — Referrals + Annual Upgrade Loop

**الفرضية**: نظام إحالة بسيط + ترقية سنوية ترفع viral coefficient
وتزيد LTV بـ 25%.

### Migrations
- جدول `referrals` (referrer_id, referred_id, status, reward_granted_at).
- جدول `referral_codes` (user_id, code UNIQUE, uses_count).
- RPC `get_referral_stats(_user_id)` للمستخدم.
- Trigger: عند أول دفع للـ referred → امنح 50 نقطة لكل من الطرفين.

### Frontend
1. صفحة `/dashboard/invite`:
   - رابط شخصي قابل للنسخ + QR code.
   - عدّاد "دعوت N · حصلت على N×50 نقطة".
   - مشاركة سريعة (WhatsApp + Telegram + X).
2. شارة جديدة "أمبسادور" (3 إحالات ناجحة).
3. صفحة `/dashboard/billing` تعرض:
   - بانر "وفّر 20% بالاشتراك السنوي" مع زر ترقية فوري.
   - عداد "ستوفّر X ر.س سنوياً".

### Email Trigger
- إيميل تلقائي للـreferrer عند نجاح إحالة (transactional).

**KPI**: Viral coefficient (k) ≥0.3 · Annual share ≥35% · LTV +25%.

---

## التسلسل والمخاطر
1. **C1 أولاً** (أسبوع 1-2): أعلى أثر مباشر على الإيراد.
2. **C2** (أسبوع 3-4): يبني فوق Wave B (يستخدم نفس الشارات).
3. **C3** (أسبوع 5-6): يحتاج C1 جاهزة (ترقية سنوية).

**مخاطر تقنية**:
- C2 يحتاج email infra (موجود — `setup_email_infra` تم).
- C3 يحتاج إعدادات unique code generation + indexing.

**Rollout**: feature flag لكل موجة + canary 10% → 50% → 100% خلال 48س.

---

## القرار المطلوب
- ✅ موافقة على v7 بالترتيب C1→C2→C3؟
- أم تعديل الترتيب / إضافة موجة / حذف؟
