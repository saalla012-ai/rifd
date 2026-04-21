# قائمة الإطلاق الرسمية — رِفد
**آخر تحديث:** 2026-04-21
**الجاهزية:** 99% — جاهز للإطلاق التسويقي

---

## ✅ الإصلاحات الحرجة (C1–C3)

| # | البند | الحالة | الدليل |
|---|---|---|---|
| C1 | Auth Guard في Dashboard (no flash) | ✅ | `src/routes/dashboard.tsx` يستخدم `beforeLoad` |
| C2 | Idempotency على طلبات الاشتراك | ✅ | `idx_subscription_requests_unique_pending` + UI handling لخطأ 23505 |
| C3 | OCR للإيصالات | ✅ | `/api/public/hooks/ocr-receipt` يكتب في `admin_notes` |

## ✅ Quick Wins

| # | البند | الحالة |
|---|---|---|
| Q1 | Email Monitor `/admin/email-monitor` | ✅ deduped، admin-only |
| Q2 | DLQ Telegram alerts كل 10 دقائق | ✅ `check_email_dlq_health()` + cron |
| Q3 | Rate-limit للتنبيهات (تنبيه/ساعة) | ✅ `dlq_alert_state` |
| Q4 | تنظيف الطلبات المعلّقة المكرّرة | ✅ تم تحويلها إلى `expired` |
| Q5 | رابط Email Monitor في sidebar الأدمن | ✅ `dashboard-shell.tsx` |

---

## 🛡 معمارية الأمان

- ✅ RLS مفعّل على كل الجداول الحسّاسة
- ✅ `has_role(uid, 'admin')` يحرس كل المسارات الإدارية + الاستعلامات
- ✅ Webhooks تستخدم `timingSafeEqual` للتحقق من HMAC
- ✅ `service_role` محصور في server routes فقط (`client.server.ts`)
- ✅ Storage `payment-receipts` خاص — يُوقَّع رابط قصير العمر فقط لـ OCR (5 دقائق)
- ✅ Storage `generated-images` خاص — لا يمكن لمستخدم آخر الوصول لصور غيره

## 📊 المراقبة بعد الإطلاق

### يومياً (دقيقتان)
1. زيارة **`/admin/email-monitor`** — تأكد أن DLQ = 0
2. زيارة **`/admin/subscriptions`** — راجع طلبات `pending` + ملاحظات OCR
3. مراجعة Telegram للتنبيهات

### أسبوعياً (10 دقائق)
1. تشغيل `reconcile_usage_logs()` للتأكد من تطابق usage مع generations
2. مراجعة `/admin/audit` — أي عمليات admin غير عادية
3. مراجعة `/admin/analytics` — معدّل التحويل، الإيرادات

---

## 🚨 SOP — التعامل مع تنبيه DLQ

عند وصول تنبيه Telegram يفيد بأن `total_dlq > 5`:

1. **افتح `/admin/email-monitor`** — راجع الجدول السفلي لمعرفة:
   - ما القالب المتأثر؟ (`auth_emails` أم قالب معاملاتي؟)
   - ما رسالة الخطأ المتكررة؟
2. **شخّص السبب الجذري** (أكثر الأسباب شيوعاً):
   - **Rate limit (429)**: الحلّ ذاتي — انتظر 10 دقائق ولاحظ هل ينخفض
   - **Bad domain DNS**: راجع **Cloud → Emails** — قد تكون السجلات تغيّرت
   - **Suppressed emails**: طبيعي إن كانت من bounce سابق — لا حاجة لإجراء
   - **Template render error**: راجع آخر تغيير على قوالب `src/lib/email-templates/*`
3. **معالجة DLQ يدوياً** (إن لزم):
   - استعلم: `SELECT * FROM pgmq.q_transactional_emails_dlq LIMIT 10;`
   - إن كانت الأخطاء عابرة، أعد إدراجها بإرسال نفس payload للطابور الأصلي
   - إن كانت بنيوية (قالب مكسور)، احذفها بعد إصلاح الكود

---

## 📅 Rollback / تنظيف بعد الإطلاق

### بعد أسبوع من نجاح Lovable Emails (DLQ ≤ 5 أسبوعياً)
- [ ] حذف `RESEND_API_KEY` من Connectors (لم يعد مستخدماً)
- [ ] حذف نطاق `notify.rifd.club` من DNS (تم استبداله بـ `notify.rifd.site`)

### إن احتجنا rollback لأي migration
- كل migrations تمت في 2026-04-21 **additive فقط**:
  - `idx_subscription_requests_unique_pending` → `DROP INDEX`
  - `dlq_alert_state` → `DROP TABLE`
  - `check_email_dlq_health()` → `DROP FUNCTION`
  - `cron.unschedule('check-email-dlq')`

---

## 🎯 KPIs المستهدفة (أول 30 يوماً)

| المؤشّر | الهدف | مكان المتابعة |
|---|---|---|
| معدّل التحويل من `/pricing` إلى `request` | ≥ 8% | `/admin/analytics` |
| معدّل التفعيل (request → activated) | ≥ 70% | `/admin/subscriptions` |
| Email delivery rate | ≥ 98% | `/admin/email-monitor` |
| متوسّط زمن التفعيل | ≤ 6 ساعات | `activated_at - created_at` |
| Quota exceeded events | < 5% من المستخدمين | `quota_exceeded` toast logs |

---

## ✍️ ملاحظات أخيرة

- **النطاق الرسمي:** `rifd.site` — أي رابط جديد يجب أن يكون تحته فقط
- **نطاق البريد:** `notify.rifd.site` — مُدار من Lovable Cloud
- **المالك:** `saalla012@gmail.com` (له دور `admin` تلقائياً عبر `handle_new_user()`)

🚀 **بالتوفيق في الإطلاق!**
