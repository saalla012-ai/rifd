

# حزمة Pre-Launch — التنفيذ النهائي (96% → 99%)

## 🎯 المخرجات الستة (مرتبة حسب الأثر)

### 1️⃣ Migration واحدة موحّدة (آمنة، Additive فقط)
ملف SQL واحد يحوي:
- **Idempotency**: `UNIQUE INDEX` جزئي على `subscription_requests(user_id, plan)` حيث `status='pending'` — يمنع طلبين معلّقين لنفس الخطة من نفس المستخدم.
- **DLQ Health Function**: `check_email_dlq_health()` — `SECURITY DEFINER`، تُرجع `jsonb` يحوي عدد الرسائل في `auth_emails_dlq` + `transactional_emails_dlq` + الطوابير الحيّة.
- **DLQ Alert State**: جدول `dlq_alert_state` (سطر واحد) لتتبّع آخر تنبيه ومنع spam (تنبيه/ساعة كحد أقصى).
- **Cron Job**: `check-email-dlq` يعمل كل 10 دقائق ويستدعي endpoint عام.

### 2️⃣ لوحة مراقبة البريد `/admin/email-monitor`
صفحة Admin-only كاملة:
- **3 Stat cards**: Sent / Failed (DLQ) / Suppressed — مع dedup على `message_id` (DISTINCT ON).
- **3 فلاتر**: Time range (24h/7d/30d) + Template (متعدد) + Status.
- **جدول Live**: آخر 50 رسالة (Template, Recipient مقصور، Status badge ملوّن، Timestamp بالعربي، Error tooltip).
- **مؤشر صحة الطابور**: عرض حالة `pending` + `dlq` + آخر retry.
- محمية بـ `has_role(uid,'admin')` على مستوى الواجهة + الاستعلامات.

### 3️⃣ تنبيه Telegram للـ DLQ
- ملف جديد: `src/routes/api/public/hooks/check-email-dlq.ts`
- يتحقق من `dlq_alert_state` (تنبيه/ساعة)، يستعلم `check_email_dlq_health()`، إذا `total > 5` يرسل إلى Telegram عبر نفس مسار `notify-telegram-admin` الموجود.
- HMAC-secret مماثل للنمط الحالي.

### 4️⃣ Idempotency في الواجهة (UI Handling)
في `pricing.tsx` (وأي مكان يُنشئ subscription_request):
- معالجة خطأ `23505` (unique violation) من PostgreSQL.
- رسالة عربية واضحة: "لديك طلب معلّق بالفعل لهذه الخطة — راجعه من لوحة الفواتير."
- زر فوري ينقل المستخدم إلى `/dashboard/billing`.

### 5️⃣ Auth Guard مُحسَّن في Dashboard
استبدال `useEffect` بـ `beforeLoad` (server-side) في `dashboard.tsx`:
- تحقّق من `session` عبر Supabase قبل render.
- إعادة توجيه فورية → `/auth` بدون أي وميض للمحتوى.
- يطبَّق على layout كامل `/dashboard/*`.
- يحافظ على منطق onboarding redirect الحالي (للـ profile incomplete) كـ client-side check (لأنه يعتمد على بيانات profile).

### 6️⃣ OCR ذكي للإيصالات + توثيق ختامي
- `src/server/receipt-ocr.ts`: استدعاء Lovable AI (`gemini-2.5-flash` رخيص + سريع) لاستخراج: المبلغ، التاريخ، IBAN.
- يُستدعى تلقائياً عند رفع إيصال في `dashboard.billing.index.tsx`.
- يقارن المبلغ مع سعر الخطة ويكتب النتيجة في `subscription_requests.admin_notes` (لا يرفض، فقط ينبّه).
- إنشاء `.lovable/launch-checklist.md` يوثّق:
  - حالة كل الإصلاحات (C1-C3 + Quick Wins + Pre-Launch).
  - SOP للتعامل مع DLQ alerts.
  - متى تُحذف Resend بأمان (بعد أسبوع نجاح).
- تحديث `mem://index.md` بقاعدة: "DLQ alerts عبر Telegram + راجع `/admin/email-monitor` يومياً."

---

## 🛡 ضمانات السلامة

| الجانب | الضمان |
|---|---|
| **Migration** | Additive فقط (CREATE INDEX/TABLE/FUNCTION) — قابلة للـ rollback |
| **beforeLoad** | يحافظ على نفس سلوك التوجيه (auth → onboarding → dashboard) |
| **OCR** | لا يرفض إيصالات تلقائياً — admin_notes فقط |
| **DLQ Alerts** | محمية بـ rate-limit (تنبيه/ساعة) لمنع إغراق Telegram |
| **Email Monitor** | Read-only (لا تعديل/حذف من السجل) — admin-only |
| **Idempotency** | لا تكسر الطلبات القائمة، فقط تمنع التكرار المستقبلي |

---

## 📊 معايير القبول (سأتحقق منها قبل الانتهاء)

- ✅ `bun run build` ينجح بدون أخطاء TypeScript
- ✅ لوحة `/admin/email-monitor` تعرض stats دقيقة (deduped)
- ✅ Cron `check-email-dlq` مجدول ويعمل كل 10 دقائق
- ✅ محاولة طلب اشتراك مكرّر تُرفض على DB + UI
- ✅ زيارة `/dashboard` بدون session تعيد التوجيه فوراً (no flash)
- ✅ رفع إيصال يولّد `admin_notes` تلقائياً
- ✅ `launch-checklist.md` + memory محدَّثان

---

## ⚙️ ترتيب التنفيذ (60 دقيقة)

1. **Migration** (idempotency + DLQ health + cron schedule)
2. **OCR helper** (server-side)
3. **DLQ check endpoint** (`/api/public/hooks/check-email-dlq`)
4. **Email Monitor route** (`admin.email-monitor.tsx`)
5. **Sidebar link** للأدمن في `dashboard-shell.tsx`
6. **beforeLoad guard** في `dashboard.tsx`
7. **UI handling** لخطأ 23505 في `pricing.tsx` و `dashboard.billing.index.tsx`
8. **Hook OCR** في تدفق رفع الإيصال
9. **launch-checklist.md** + تحديث `mem://index.md`
10. **Build + verify**

سأبدأ التنفيذ فور الموافقة.

