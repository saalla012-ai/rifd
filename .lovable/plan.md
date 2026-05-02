# خطة v6 — Hotfix + Wave B (Onboarding & First-Win)

موافقة كلود مستلمة. التنفيذ على مرحلتين: **Hotfix الحرج فوراً**، ثم **Wave B** على 5 أيام.

---

## المرحلة 0 — Hotfix حرج (قبل أي شيء آخر)

**المشكلة المؤكدة:** في migration `20260502070453_*.sql` السطر 138، الـ trigger `video_jobs_after_update_health` يفحص `NEW.status::text = 'succeeded'` لكن enum `video_job_status` لا يحتوي إلا على: `pending, processing, completed, failed, cancelled, refunded`. النتيجة: `success_count` لا يزداد أبداً → `fail_rate` يصل 100% بسرعة → kill-switch يوقف المزود زوراً.

### Migration واحد:
1. `CREATE OR REPLACE FUNCTION public.fn_video_jobs_after_update_health()` بنفس المنطق لكن السطر:
   `_is_success := (NEW.status::text = 'completed');`
2. **Backfill** لآخر 24 ساعة:
   ```sql
   INSERT INTO provider_health_window (provider_key, window_start, success_count, fail_count)
   SELECT provider, date_trunc('hour', completed_at),
          count(*) FILTER (WHERE status='completed'),
          count(*) FILTER (WHERE status='failed' AND error_category IN ('provider_error','timeout','unknown'))
   FROM video_jobs
   WHERE completed_at >= now() - interval '24 hours' AND provider IS NOT NULL
   GROUP BY provider, date_trunc('hour', completed_at)
   ON CONFLICT (provider_key, window_start) DO UPDATE SET ...
   ```
3. **استعادة المزودين المعطّلين زوراً**: إغلاق أي `provider_kill_switch_event` مفتوح لـ fal.ai مع `restored_at = now()` و `restore_reason = 'hotfix_succeeded_to_completed'`، وإعادة تفعيلهم في `video_provider_configs`.
4. التحقق يدوياً من `/admin/phase1-monitor` بعد التطبيق.

---

## Wave B — Onboarding & First-Win

### اليوم 2-3: Onboarding Wizard (3 خطوات / 60 ثانية)

**Migration:**
- إضافة عمود `profiles.onboarding_step int default 0` و `onboarding_completed_at timestamptz`.
- جدول `onboarding_events(user_id, step, event_type, metadata, created_at)` للـ funnel analytics.

**Route جديد:** `src/routes/onboarding.wizard.tsx` (يستبدل/يحدّث `onboarding.tsx` الحالي):
- **خطوة 1 — متجرك:** اسم المتجر + اللون + المنتج الأساسي (3 حقول، 20 ثانية).
- **خطوة 2 — جمهورك:** نوع العميل (chips) + المدينة (20 ثانية).
- **خطوة 3 — أول إعلان جاهز:** يستدعي `generateText` + `generateImage` بالتوازي تلقائياً، يعرض loader "نحضّر أول إعلان لمتجرك...". الناتج: نص + صورة قابلان للتحميل/النشر فوراً.

**Fallback (شرط كلود):**
- إذا فشل التوليد → رسالة "نحضّر محتواك..." + retry تلقائي صامت (محاولتان، exponential backoff).
- إذا فشل نهائياً → ينقل لـ `/dashboard` مع toast: "محتواك سيكون جاهز خلال دقائق، سنُعلمك."

**الترقية:** Redirect تلقائي إلى `/onboarding/wizard` لأي مستخدم `onboarded=false` بعد signup.

### اليوم 4-5: First-Win Badges

**Migration:**
- `CREATE TYPE badge_type AS ENUM ('first_text','first_image','first_video','active_store')`.
- جدول `user_badges(user_id, badge_type, awarded_at, metadata, UNIQUE(user_id, badge_type))`.
- Trigger على `generations` (للنص/الصورة) و `video_jobs` (status='completed') يمنح الشارة المناسبة + يفحص شرط `active_store` (الثلاثة خلال 24 ساعة).
- RPC `get_user_badges()` للقراءة.

**UI:**
- `src/components/first-win-toast.tsx`: realtime subscription على `user_badges` + toast بصري لحظة الحصول (مع confetti خفيف).
- شارات في `dashboard.settings.tsx` (قسم البروفايل) تعرض كل الشارات المحصّلة.
- Email tracking: hook في trigger يضيف صف `email_send_log` بـ `template_name='badge_earned'` (بدون إرسال فعلي الآن، فقط لقياس الـ funnel).

### اليوم 6: Empty-State CTAs

تحديث 3 صفحات داشبورد:
- `dashboard.library.tsx`: عند فراغ الـ generations → CTA كبير "أنشئ أول محتوى لمنتجك" → ينقل لـ `/dashboard/generate-text`.
- `dashboard.campaign-studio.tsx`: عند عدم وجود حملات → "أطلق أول حملة في 5 دقائق".
- `dashboard.templates.tsx`: "ابدأ بقالب يبيع منتجاتك" + 3 قوالب مقترحة بصرياً.

كل CTA يستخدم نفس مكوّن جديد `src/components/empty-state-cta.tsx` (موحّد بصرياً، يدعم Dark/Light + Mobile).

### اليوم 7: Analytics + اختبار + نشر

**Analytics tracking (إلزامي حسب كلود):**
- كل خطوة Wizard → `posthog.capture('onboarding_step_completed', { step })`.
- كل badge → `posthog.capture('badge_earned', { type })`.
- Funnel: signup → wizard_start → wizard_step_1 → step_2 → step_3 → first_generation → first_paid.

**Server function:** `src/server/onboarding-funnel.ts` يجمع KPIs:
- معدل إكمال Wizard (هدف ≥75%)
- معدل First-Win أول جلسة (≥60%)
- معدل "متجر نشط" خلال 7 أيام (≥30%)
- عرض في `/admin/phase1-monitor` (قسم جديد).

**اختبار:** end-to-end يدوي + تحديث `/admin/phase1-monitor` ليعرض metrics Wave B + تحديث Telegram daily report.

---

## ملخص الملفات المتأثرة

**Migrations (4 جديدة):**
1. Hotfix trigger + backfill + restore providers.
2. `profiles.onboarding_step` + `onboarding_events`.
3. `badge_type` enum + `user_badges` + triggers + RPC.
4. تحديث RLS لجداول الجديدة.

**Frontend جديد/معدّل:**
- `src/routes/onboarding.wizard.tsx` (جديد — يستبدل الحالي إن لزم)
- `src/components/first-win-toast.tsx` (جديد)
- `src/components/empty-state-cta.tsx` (جديد)
- `src/components/badges-list.tsx` (جديد)
- `src/routes/dashboard.library.tsx` / `dashboard.campaign-studio.tsx` / `dashboard.templates.tsx` (Empty States)
- `src/routes/dashboard.settings.tsx` (عرض Badges)
- `src/routes/admin.phase1-monitor.tsx` (قسم Wave B KPIs)

**Server:**
- `src/server/onboarding-funnel.ts` (جديد)
- `src/server/onboarding-wizard.ts` (جديد — يجمع generateText + generateImage)
- تحديث `api.public.hooks.phase1-daily-report.ts` بـ Wave B metrics.

**جودة:**
- TypeScript: `tsc --noEmit` نظيف.
- Responsive: Mobile (567px) / Tablet / Desktop.
- Dark/Light mode كامل لكل المكوّنات الجديدة.
- نسبة تقدم المرحلة 2 في `.lovable/plan.md` بعد كل يوم.

هل أبدأ بالـ Hotfix فوراً؟
