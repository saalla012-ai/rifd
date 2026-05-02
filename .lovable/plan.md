# خطة v6 — حالة التنفيذ (نسبة التقدم: 60%)

## ✅ مُنفَّذ

### المرحلة 0 — Hotfix الحرج (100%)
- ✅ إصلاح `fn_video_jobs_after_update_health` (`succeeded` → `completed`).
- ✅ Backfill `provider_health_window` لآخر 24 ساعة من بيانات حقيقية.
- ✅ إغلاق kill-switch events المفتوحة + إعادة تفعيل المزودين الموقوفين زوراً
  (مع استثناء `retired_legacy_provider`).
- ✅ القيمة الصحيحة لـ check constraint: `health_status='active'`.

### Wave B — Migrations (100%)
- ✅ `profiles.onboarding_step` + `onboarding_completed_at`.
- ✅ جدول `onboarding_events` + RLS + indexes.
- ✅ enum `badge_type` + جدول `user_badges` + UNIQUE(user_id, badge_type).
- ✅ Triggers: `generations` → first_text/first_image، `video_jobs` → first_video،
  والتحقق التلقائي من `active_store` (الثلاث خلال 24 ساعة).
- ✅ RPC `get_user_badges()` + `get_onboarding_funnel(_days)`.
- ✅ Realtime publication لـ `user_badges` (لـ toast فوري).

### Wave B — Onboarding Wizard (100%)
- ✅ `src/routes/onboarding.wizard.tsx`: 3 خطوات (متجرك / جمهورك / أول إعلان).
- ✅ Auto-generate نص + صورة بالتوازي (Promise.all).
- ✅ Fallback: retry ×2 (exponential backoff) ثم رسالة "نحضّر محتواك"
  ونقل تلقائي للوحة التحكم.
- ✅ Logging كامل للأحداث + posthog tracking لكل خطوة.

### Wave B — First-Win Badges (100%)
- ✅ `FirstWinToast` realtime مُركَّب في `DashboardShell`.
- ✅ `BadgesList` معروض في `dashboard.settings`.
- ✅ Toasts مع أيقونات + تتبّع `badge_earned`.

### Wave B — Empty-State CTA (40%)
- ✅ مكوّن موحّد `EmptyStateCTA` (Dark/Light + RTL + responsive).
- ⏳ تطبيقه على library/campaign-studio/templates — مؤجّل للجولة التالية.

## ⏳ متبقٍّ للجولات القادمة

1. تطبيق `EmptyStateCTA` على الصفحات الثلاث (library/campaign-studio/templates).
2. Redirect تلقائي للمستخدمين الجدد (`onboarded=false`) إلى `/onboarding/wizard`.
3. قسم Wave B داخل `/admin/phase1-monitor` يستهلك `get_onboarding_funnel`.
4. تحديث `phase1-daily-report` بـ Wave B KPIs.
5. اختبار end-to-end + نشر متدرج.

## KPIs المُستهدفة (تُقاس قريباً)
- إكمال Wizard ≥75% · First-Win أول جلسة ≥60% · "متجر نشط" 7 أيام ≥30% · Free→Paid ≥5%.
