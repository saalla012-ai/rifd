# خطة v6 — حالة التنفيذ (نسبة التقدم: 95%)

## ✅ مُنفَّذ

### المرحلة 0 — Hotfix الحرج (100%)
- ✅ إصلاح `fn_video_jobs_after_update_health` (`succeeded` → `completed`).
- ✅ Backfill `provider_health_window` لآخر 24 ساعة.
- ✅ إغلاق kill-switch events المفتوحة + إعادة تفعيل المزودين الموقوفين زوراً.

### Wave B — Migrations (100%)
- ✅ `profiles.onboarding_step` + `onboarding_completed_at`.
- ✅ جدول `onboarding_events` + RLS + indexes.
- ✅ enum `badge_type` + جدول `user_badges` + UNIQUE(user_id, badge_type).
- ✅ Triggers: first_text/first_image/first_video + active_store.
- ✅ RPC `get_user_badges()` + `get_onboarding_funnel(_days)`.
- ✅ Realtime publication لـ `user_badges`.

### Wave B — Onboarding Wizard (100%)
- ✅ `/onboarding/wizard`: 3 خطوات (متجرك / جمهورك / أول إعلان).
- ✅ Auto-generate نص + صورة بالتوازي + retry ×2 + fallback لطيف.
- ✅ Logging + posthog tracking لكل خطوة.

### Wave B — First-Win Badges (100%)
- ✅ `FirstWinToast` realtime داخل `DashboardShell`.
- ✅ `BadgesList` في `dashboard.settings`.

### Wave B — Empty-States & Redirect (100%)
- ✅ `EmptyStateCTA` موحّد (Dark/Light + RTL + responsive).
- ✅ تطبيق على `dashboard.library` (حالة فارغة + حالة campaign فارغة).
- ✅ تطبيق على `dashboard.templates` (حالة عدم تطابق الفلتر).
- ✅ Redirect تلقائي للمستخدمين الجدد (`onboarded=false`) إلى `/onboarding/wizard`
   (من `dashboard.tsx`).

### Wave B — Admin Monitor & Daily Report (100%)
- ✅ قسم Wave B داخل `/admin/phase1-monitor` (4 بطاقات + جدول funnel).
- ✅ `phase1-daily-report` Telegram يحمل: Wizard started/completed،
   completion %، شارات 24س (نص/صورة/فيديو/متجر نشط).
- ✅ يُعرض كذلك في حقل `metrics` للـResponse (للمراقبة الخارجية).

## ⏳ متبقٍّ (5%)

1. اختبار end-to-end يدوي (تسجيل مستخدم جديد → wizard → أول إعلان → شارة).
2. نشر متدرج + مراقبة 48س ثم انتقال لـ Wave C.

## KPIs المُستهدفة
- إكمال Wizard ≥75% · First-Win أول جلسة ≥60% · "متجر نشط" 7 أيام ≥30% · Free→Paid ≥5%.

## مراجعة المرحلة (تقنياً + تسويقياً + بصرياً)
- ✅ لا استيرادات مكسورة (تم إضافة `EmptyStateCTA` و`LayoutTemplate`).
- ✅ لا كود قديم مكرر (الـempty states القديمة استُبدلت بالكامل).
- ✅ النصوص تتبع لغة المنتج: "اكتب نصاً يبيع"، "صمّم صورة إعلان"،
   "ابدأ من مركز قيادة الحملة" — موحّدة عبر الصفحات.
- ✅ Mobile/Tablet/Desktop: `flex-col sm:flex-row`، `grid-cols-2 sm:grid-cols-4`.
- ✅ Dark/Light: تستخدم semantic tokens فقط (`bg-card`, `border-border`,
   `text-muted-foreground`, `bg-primary/5`) — لا ألوان مباشرة.
