# المرحلة 1 v5 — التنفيذ النهائي (نسخة المستشار المعتمدة)

> **نسبة الإنجاز الكلية: 70%** — Wave 1A + 1B + 2A + 2B + 2C مكتملة. المتبقي: Wave 2D (إعادة تصميم لوحة الفوترة الداخلية)، Wave 3 (المراقبة)، و(اختياري) Replicate.

## شريط التقدّم

| الموجة | الحالة | النسبة |
|---|---|---|
| **Wave 1A** — Migrations + kill-switch + health window | ✅ مكتملة | 100% |
| **Wave 1B** — error categorization + compensation 50pt | ✅ مكتملة | 100% |
| **Wave 1C** — تنفيذ Replicate provider في الكود | ⏸ مؤجلة (fal_ai مستقر) | 0% |
| **Wave 2A** — DB: monthly_usage + free monthly RPCs | ✅ مكتملة | 100% |
| **Wave 2B** — Pricing UI + Marketing copy + Trust | ✅ مكتملة | 100% |
| **Wave 2C** — Free monthly video backend + Top-up modal | ✅ مكتملة | 100% |
| **Wave 2D** — إعادة هيكلة dashboard.billing.index (إزالة Founding seats) | 🔲 لم تبدأ | 0% |
| **Wave 3** — Admin monitor + daily report + bonus | 🔲 لم تبدأ | 0% |

## مراجعة Wave 2B — تقرير الجودة (هذه الجولة)

**فحص تقني:** ✅ TypeScript نظيف، لا استيرادات مكسورة.

**التناقضات المكتشفة والمصلحة:**
1. ❌→✅ ضمان "14 يوم" في 6 ملفات (pricing meta + FAQ + trust-bar + trust-badges + about + billing.confirm + legal.refund) ⇒ موحَّد على **7 أيام استرداد كامل بدون أسئلة** (مصدر واحد: `REFUND_GUARANTEE_LABEL`).
2. ❌→✅ Free tier: `dailyTextCap=10/dailyImageCap=7` تعارض tagline "5 نصوص + 3 صور" ⇒ صُحّح إلى 5/3 + توضيح أن الـ Free يستخدم `monthlyTrialQuota` فقط.
3. ❌→✅ `subscribers-counter`: شريط "تبقى X مقعد قبل ارتفاع الأسعار" + 1000 ⇒ حُذف، استُبدل بشريط "سعر الإطلاق متاح + ضمان 7 أيام". صياغة "مشترك" → "متجر".
4. ❌→✅ `quota-exceeded-dialog`: نصوص قديمة ("7 صور"، "30 صورة يومياً"، "🔥 عرض المؤسسين") ⇒ أُعيدت صياغة كل الفروع لتميّز Free شهري vs Paid يومي + شارة "✦ سعر الإطلاق".
5. ⚠️ `legal.terms` و `legal.privacy`: "14 يوماً" تخص **مهلة إشعار التغيير** (قانوني، ليس ضماناً) — تُركت سليمة.
6. ⚠️ `dashboard.billing.index.tsx` (472 سطر): لا يزال يقرأ `founding_total_seats/founding_base_count` ويعرض شريط "X / 1000". تأجيل لـ **Wave 2D** (إعادة تصميم كاملة) — لا يؤثر على الواجهة العامة لأنه داخل `/dashboard/billing` للمستخدمين المسجلين.

**فحص التجاوب والوضعين:**
- كل التعديلات تستخدم semantic tokens (`text-success`, `bg-card`, `border-border`, `text-muted-foreground`) ⇒ Dark/Light يعملان تلقائياً.
- شبكات pricing: `grid md:grid-cols-2 xl:grid-cols-5` و bullets `sm:grid-cols-3` ⇒ Mobile/Tablet/Desktop سليم بدون كسر.
- subscribers-counter: `flex-wrap` + `text-[11px]` ⇒ يلتف على الجوال.

**كود قديم محذوف (تقرير الحذف):**
- `seatsLeft = Math.max(0, 1000 - count)` و JSX block "تبقى X مقعد" من `subscribers-counter.tsx`.
- نص شارة "🔥 عرض المؤسسين" و"30 صورة يومياً" و"7 صور" من `quota-exceeded-dialog.tsx`.



## مراجعة Wave 1B (الإنجاز الأخير)

**فحص تقني:** ✅ TypeScript بدون أخطاء، لا استيرادات مكسورة، لا كود مكرر.

**ما أُضيف في `src/server/video-functions.ts`:**
- دالة `categorizeVideoError()` تصنّف 5 فئات: `provider_error | timeout | content_error | user_error | unknown`.
- ثابت `PROVIDER_FAILURE_COMPENSATION_CREDITS = 50`.
- دالة `compensateUserForProviderFailure()` تمنح 50 نقطة فقط عند `provider_error` أو `timeout` (idempotent عبر job_id).
- `markProcessingJobRefunded()` يكتب الآن `error_category` في عمود الجدول + داخل metadata.
- `generateVideo` و `refreshVideoJob` يستدعيان التعويض تلقائياً عند الفشل التشغيلي.

**ما لم يُحذف:** كل منطق الـ fallback الحالي (`loadProviderConfigs` + `providerPriorityScore` + `markProviderFailure/Success`) محفوظ ومُكمَّل — لم نكسر أي شيء.

## ⚠️ قرار مطلوب قبل المتابعة (Wave 1C vs Wave 2)

المهاجرة فعّلت `replicate` في DB كأساسي (priority=100) لكن `PROVIDERS` map في `video-functions.ts` يحتوي فقط على `fal_ai` فعلياً. النتيجة الحالية: كل الطلبات تذهب لـ `fal_ai` بأمان (لا انقطاع إنتاج)، لكن Replicate لا يُستدعى رغم أنه أساسي في DB.

**الخيارات:**
1. **تنفيذ Replicate كامل الآن** (إنشاء/متابعة prediction + parsing + خرائط باراميترات Veo 3 Fast) قبل Wave 2.
2. **الانتقال مباشرة لـ Wave 2** (Free monthly + pricing UI) وإبقاء Replicate لموجة منفصلة لاحقة.

**توصيتي كخبير سوق سعودي:** الخيار 2. الأثر التجاري لـ Wave 2 (تحسين التحويل + Free monthly + إزالة الشطب) أعلى من تبديل المزوّد الأساسي ما دام `fal_ai` مستقر. Replicate ميزة موثوقية، Wave 2 ميزة إيراد.

---

كل البنود الـ10 معتمدة. التعديلات الـ3 الرئيسية مدمجة + الإضافات الإلزامية الـ3.

## ملخص القرارات المعتمدة

| البند | القرار النهائي |
|---|---|
| [1] الشطب الوهمي | حذف نهائي. شارة "سعر الإطلاق" بديل |
| [2] Free Trial | **شهري متجدد**: 5 نصوص + 3 صور + 1 فيديو fast/شهر (تعديل عن One-Shot) |
| [3] السقوف الداخلية | محدود/متوسط/عالي/بدون حد (مخفية رقمياً) |
| [4] Replicate | أساسي (Veo 3 Fast) + PixVerse fallback + kill-switch >20% خلال 24س |
| [5] سنوي | Toggle خصم 20% (موجود) |
| [6] الضمان | "7 أيام استرداد بدون أسئلة" |
| [7] Top-up | Modal فوري عند السقف (المدفوع فقط) |
| [8] Founding seats | حذف نهائي + شريط إثبات حي بأرقام DB حقيقية |
| [9] Bonus | 50 نقطة فيديو لأول 100 مشترك مدفوع + شارة "عضو مؤسس" |
| [10] الترتيب | الفيديو أولاً (يوم 1-2) |

## الموجة 1 — الاستقرار (يوم 1-2): الفيديو أولاً

**Migration A — `replicate_primary_health_window.sql`**
- Pre-backup: `backup_video_provider_configs_<date>` و `backup_video_jobs_<date>` (الإضافة ب).
- تحديث `video_provider_configs`:
  - `replicate`: `enabled=true`, `priority=100`, `mode='api'` — الأساسي
  - `fal_ai`: يبقى enabled لكن `priority=50` — fallback تلقائي
  - الباقي معطّل
- جدول `provider_health_window` (provider_key, window_start tz, success_count, fail_count, fail_rate computed). نافذة 24س متدحرجة.
- جدول `provider_kill_switch_events` (provider_key, triggered_at, fail_rate, fail_count, restored_at, restore_reason).
- عمود جديد `video_jobs.error_category` ENUM: `provider_error | user_error | content_error | timeout | unknown`.
- Trigger `video_jobs_after_update_health`: عند انتقال status إلى `succeeded` أو `failed` → يحدّث health window. إذا fail_rate ≥ 20% خلال 24س ولـ ≥10 محاولات → `UPDATE video_provider_configs SET enabled=false` + INSERT في kill_switch_events + `pg_net.http_post` إلى webhook الإشعار.
- RPC `restore_provider(_provider_key text)` للأدمن لإعادة التفعيل اليدوي.

**Edge Function — `provider-kill-switch-notify`**
- يستقبل event من trigger، يستدعي `api.notify-telegram-admin.ts` الموجود، يرسل تنبيه فوري للأدمن (الإضافة ج).

**كود — `src/server/video-functions.ts`**
- `selectProviderChain()`: يرجع قائمة [primary, ...fallbacks] مرتبة بـ priority، enabled، health=ok.
- `runWithFallback(input)`: يكرّر على القائمة:
  - عند `provider_error | timeout | 5xx` → ينتقل للتالي تلقائياً + يسجل fallback success.
  - عند `user_error | content_error` → يفشل فوراً بدون fallback.
- `categorizeError(err)`: يصنّف الخطأ ويكتبه في `video_jobs.error_category`.
- عند فشل كامل من فئة `provider_error` بعد استنفاد كل المزودين:
  1. `refund_credits()` تلقائي
  2. منح **+50 نقطة تعويض** عبر `consume_credits` معكوس + `credit_ledger` بـ `metadata.reason='provider_failure_compensation'`
  3. إرسال إيميل اعتذار (قالب موجود `quota-exceeded` مُكيَّف).

---

## الموجة 2 — التسعير و UI (يوم 3-4)

**Migration B — `pricing_v5_free_trial_monthly.sql`**
- Pre-backup: `backup_plan_entitlements_<date>`, `backup_profiles_<date>`, `backup_user_credits_<date>`.
- تحديث `plan_entitlements` للـ free:
  - `monthly_credits = 150` (تكفي فيديو fast واحد بـ150 نقطة)
  - `daily_text_cap = 5` (لكن سنحوّلها لشهرية، أنظر RPC)
  - `daily_image_cap = 3`
- أعمدة جديدة في `plan_entitlements`:
  - `monthly_text_cap INT` — للـ free فقط = 5
  - `monthly_image_cap INT` — للـ free فقط = 3
  - `monthly_video_count_cap INT` — للـ free فقط = 1
- جدول جديد `monthly_usage` (user_id, cycle_start, cycle_end, text_used, image_used, video_used) — مفهرس بـ user_id+cycle_start.
- تحديث `consume_text_quota()`, `consume_image_quota()`:
  - إذا plan=free → اخصم من `monthly_usage` عوضاً عن daily.
  - عند الاستنفاد → return `monthly_quota_exhausted` + `next_reset_at`.
- تحديث `consume_credits` للفيديو: للـ free يتحقق من `monthly_video_count_cap` قبل الخصم.
- Cron يومي `reset_free_monthly_cycles()`: يجدّد cycle عند انتهائه (30 يوم من التسجيل أو آخر reset).
- جدول `launch_bonus_recipients` (user_id PK, granted_at, credits=50, ledger_id) + UNIQUE constraint + counter check ≤100.
- عمود `profiles.is_founding_member BOOLEAN DEFAULT false`.
- Trigger على `subscription_requests.status='activated'`: إذا COUNT(launch_bonus_recipients)<100 → INSERT + grant 50 credits + UPDATE profiles.is_founding_member=true + enqueue email.

**كود — `src/lib/plan-catalog.ts`**
- إبقاء أسعار الباقات كما هي (149/249/399/999) — **بدون شطب**.
- إعادة هيكلة free:
  - `monthlyCredits: 150`
  - `monthlyTrialQuota: { text: 5, image: 3, video: 1 }`
  - `tagline: "تجربة مجانية تتجدد شهرياً: 5 نصوص + 3 صور + فيديو واحد"`
- إضافة `LAUNCH_BADGE = "سعر الإطلاق"` constant.

**كود — `src/routes/pricing.tsx`**
- حذف كل: `seatsLeft`, `setSeatsLeft`, `seatsTotal`, `discountPct`, `get_founding_status` call، Progress bar للمقاعد.
- استبدال بشريط بسيط: شارة خضراء "سعر الإطلاق" على كل خطة مدفوعة.
- بطاقة Free تتغير لـ: "5 نصوص + 3 صور + 1 فيديو شهرياً — مجاناً للأبد".
- تحت كل CTA مدفوع: badge "ضمان 7 أيام استرداد بدون أسئلة" مع أيقونة درع.
- إضافة Top-up section صغير في أسفل الصفحة يعرض حزم `topup_packages`.

**كود — `src/components/quota-exceeded-dialog.tsx`**
- توسيع لـ 3 حالات:
  - `monthly_trial_exhausted` (free): يعرض countdown للتجديد + CTA "ترقّ الآن للحصول على المزيد فوراً" + 4 بطاقات الباقات المدفوعة.
  - `daily_cap_reached` (paid): "بلغت حدك اليومي، يتجدد بعد X ساعة" + CTA top-up.
  - `monthly_credits_exhausted` (paid video): Modal top-up مباشر مع 3 حزم رئيسية.

**كود — `src/components/subscribers-counter.tsx`**
- إعادة كتابة كاملة. RPC جديد `get_completed_videos_count()`:
  ```sql
  SELECT COUNT(*) FROM video_jobs WHERE status='succeeded'
  ```
- يعرض: "تم توليد X مقطع فيديو حتى الآن" مع كاش 5 دقائق client-side.
- إزالة كل منطق founding seats.

---

## الموجة 3 — المراقبة + Bonus (يوم 5-7)

**صفحة جديدة — `src/routes/admin.phase1-monitor.tsx`** (الإضافة أ)
- محمية بـ `<AdminGuard>`.
- تعرض للأيام 1-7:
  - **معدل refund اليومي** (target <15%) — chart 7 أيام
  - **عدد fallbacks ناجحة** Replicate→fal_ai مع نسبة النجاح
  - **حالة kill-switch لكل مزود** (live status + history)
  - **Free trial → paid conversion**: عدد free finished trial / عدد منهم اشترك
  - **Top blockers**: قائمة تلقائية بأعلى 5 error_categories متكررة + count
  - **Daily report status**: آخر إرسال + رابط للتقرير
- Auto-refresh كل 60 ثانية.

**Edge Function — `phase1-daily-report`**
- pg_cron يومي 8 صباحاً Riyadh (`SELECT cron.schedule(...)`).
- يجمع metrics 24س الأخيرة، يولّد رسالة Markdown، يرسلها Telegram للأدمن (الإضافة أ).

**Email — `launch-bonus-welcome.tsx`**
- قالب جديد: رسالة شخصية من المؤسس + شارة "عضو مؤسس #X من 100" + إشعار 50 نقطة bonus + CTA للوحة التحكم.
- يُسجل في `email_templates_registry`.

**Documentation**
- `.lovable/migration-rollback-runbook.md`: SQL استرجاع لكل migration + خطوات (الإضافة ب).
- `mem://features/v5-phase1-execution`: ملخص القرارات لمرجع مستقبلي.

---

## التفاصيل التقنية

```text
ترتيب التنفيذ:
 يوم 1: REPLICATE_API_TOKEN refresh → Migration A → kill-switch trigger → edge function
 يوم 2: video-functions.ts fallback chain + categorization + اختبار end-to-end
 يوم 3: Migration B (free monthly trial + bonus table + RPCs)
 يوم 4: pricing.tsx + plan-catalog + quota dialog + subscribers counter
 يوم 5: launch-bonus email + bonus trigger + admin.phase1-monitor
 يوم 6: phase1-daily-report cron + Telegram integration + QA شامل
 يوم 7: rollback runbook verification + memory update + go-live
```

## أسرار مطلوبة قبل البدء

- `REPLICATE_API_TOKEN`: **سأطلب منك تحديثه** في أول رد بعد الموافقة (الحالي يعطي 401 حسب آخر فشل في DB).
- باقي الأسرار جاهزة (`TELEGRAM_ADMIN_CHAT_ID`, `NOTIFY_WEBHOOK_SECRET`, `FAL_API_KEY`, `RESEND_API_KEY`).

## ملفات سأنشئها (10)

- `supabase/migrations/<ts>_replicate_primary_health_window.sql`
- `supabase/migrations/<ts>_pricing_v5_free_trial_monthly.sql`
- `supabase/migrations/<ts>_launch_bonus_program.sql`
- `supabase/functions/provider-kill-switch-notify/index.ts`
- `supabase/functions/phase1-daily-report/index.ts`
- `src/routes/admin.phase1-monitor.tsx`
- `src/lib/email-templates/launch-bonus-welcome.tsx`
- `.lovable/migration-rollback-runbook.md`
- `mem://features/v5-phase1-execution`
- `mem://constraints/no-fake-strikethrough-pricing`

## ملفات سأعدّلها (6)

- `src/server/video-functions.ts` (fallback chain + error categorization + auto-refund + 50pt compensation)
- `src/lib/plan-catalog.ts` (free monthly trial، إزالة شطب، launch badge)
- `src/lib/email-templates/registry.ts` (تسجيل قالب bonus)
- `src/routes/pricing.tsx` (حذف founding، launch badges، ضمان، top-up)
- `src/components/quota-exceeded-dialog.tsx` (3 حالات + top-up modal)
- `src/components/subscribers-counter.tsx` (أرقام فيديو حقيقية)

## مقاييس النجاح (نهاية الأسبوع)

- معدل refund <15% (من 37%)
- معدل نجاح Replicate primary >85%
- نجاح fallback عند فشل primary >95%
- Free trial → paid conversion >5%
- صفر شكاوى قانونية متعلقة بأسعار مشطوبة

عند موافقتك سأنتقل لوضع البناء فوراً وأبدأ بطلب تحديث `REPLICATE_API_TOKEN` ثم تنفيذ الموجة 1.
