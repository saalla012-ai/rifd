

# الخطة النهائية: هجرة كاملة لبنية Lovable Email + قوالب احترافية

## التشخيص النهائي (مبني على الفحص الفعلي)

| البند | الواقع |
|---|---|
| **حالة Lovable Emails** | ❌ **معطّلة** (سبب فشل كل الرسائل: `Emails disabled for this project`) |
| **النطاق `notify.rifd.site`** | ⏳ في التحقق `active_provisioning` |
| **سجل الإرسال** | 13 pending + 10 dlq + **0 sent** |
| **الكود الحالي** | يستخدم Resend عبر `connector-gateway.lovable.dev` (مرفوض لأن Lovable Email معطّل) |
| **المستخدمون** | 6 مجاني + 1 مدفوع (شريحة صغيرة = فرصة استرداد عالية) |
| **القوالب الحالية** | 7 قوالب (welcome, onboarding x4, subscription x2) |

**الخلاصة:** المشكلة ليست في DNS فقط — Lovable Emails معطّلة على المشروع، والكود يعتمد على مسار خاطئ تماماً.

---

## القرار الاستراتيجي

| الخيار | التقييم |
|---|---|
| إصلاح Resend مع نطاق منفصل | ❌ يتطلب نطاق آخر + إدارة DKIM يدوياً + لا queue/retry |
| **هجرة كاملة لبنية Lovable Email** | ✅ **موصى به** — queue + retry + DLQ + suppression + unsubscribe تلقائي |

---

## الخطة التنفيذية (5 مراحل متسلسلة)

### **المرحلة 0 — تفعيل بنية Lovable Email (شرط مسبق)**
1. تفعيل Lovable Emails على المشروع (`toggle_project_emails: true`)
2. التحقق من حالة النطاق `notify.rifd.site` — إذا فشل DNS، عرض حلول واضحة
3. إعادة بناء البنية التحتية (`setup_email_infra`) لضمان وجود pgmq queues + cron + vault secret

### **المرحلة 1 — هجرة الكود من Resend إلى Queue**

| الملف | التغيير |
|---|---|
| `src/routes/lovable/email/transactional/send.ts` | استبدال `sendResendEmail` بـ `enqueue_email` RPC |
| `src/server/send-welcome.ts` | نفس الشيء — يستدعي `enqueue_email` بدلاً من Resend |
| `src/routes/hooks/onboarding-emails.ts` | نفس الشيء — يضع الرسائل في الطابور |
| `src/server/resend.ts` | **حذف** — لم يعد مطلوباً |
| `src/lib/email/send.ts` | يبقى كما هو (ينادي على route الذي سيُهاجر داخلياً) |

**النتيجة:** كل إرسال يمر عبر pgmq → process-email-queue يعالجه عبر Lovable Email API → DKIM/SPF تلقائي + retry + DLQ.

### **المرحلة 2 — إنشاء البنية التحتية للقوالب الموحّدة**

```
src/lib/email-templates/_shared/
├── layout.tsx       ← Header (لوغو رِفد) + Footer + خط Tajawal
├── components.tsx   ← Button, Section, InfoCard مع ألوان rifd brand
└── theme.ts         ← الألوان من design tokens (gold, primary)
```

**الفائدة:** أي تحديث للهوية = ملف واحد فقط.

### **المرحلة 3 — قوالب Auth المخصّصة (6 قوالب)**

عبر `scaffold_auth_email_templates` — تحلّ محل قوالب Supabase الافتراضية:
- `signup-confirmation` · `password-recovery` · `magic-link`
- `email-change` · `reauthentication` · `invite`

### **المرحلة 4 — قوالب Transactional + Lifecycle (10 قوالب)**

#### **A. ترقية القوالب الموجودة (7) لاستخدام `_shared/layout`**
welcome, onboarding-day1/3/5/7, subscription-activated/expiring

#### **B. قوالب Transactional جديدة (5 — حرجة للأعمال)**
| القالب | المحفّز |
|---|---|
| `payment-receipt` | إيصال PDF بعد تفعيل الاشتراك |
| `payment-failed` | فشل/رفض إيصال الدفع |
| `quota-warning-80pct` | استهلاك 80% من الحصة |
| `quota-exceeded` | استنفاد الحصة |
| `subscription-renewal-reminder` | قبل 7 أيام من الانتهاء |

#### **C. قوالب Lifecycle جديدة (5 — احتفاظ ونمو)**
| القالب | المحفّز | الهدف |
|---|---|---|
| **`free-trial-discount-30pct`** ⭐ **(جديد بطلبك)** | لمستخدم مجاني بعد 7 أيام بدون اشتراك + لم يستلم القالب من قبل | استرداد عرض 30% الافتتاحي |
| `inactivity-reengagement` | 14 يوم بدون نشاط | إعادة تفعيل |
| `milestone-celebration` | أول 10/100 منشور | NPS + ولاء |
| `referral-invitation` | بعد 30 يوم نشاط | نمو عضوي |
| `feedback-request` | بعد 60 يوم | تحسين المنتج |

---

## ⭐ تفصيل قالب التذكير بعرض 30% (الإضافة الجديدة)

### **التصميم القانوني والاستراتيجي**

| البند | القرار المهني |
|---|---|
| **التصنيف** | Lifecycle/Transactional — مرتبط بسلوك فردي (تسجيل + عدم اشتراك)، **ليس** حملة جماعية |
| **التحفيز** | حدث محدد للمستخدم: `created_at < now()-7d AND plan='free' AND no_subscription_request` |
| **التكرار** | **مرة واحدة فقط** لكل مستخدم مدى الحياة (idempotency: `discount-30-{userId}`) |
| **الانسحاب** | احترام suppression list + unsubscribe footer تلقائي |
| **التوقيت** | بعد 7 أيام من التسجيل (نافذة ±12 ساعة لتفادي الإزعاج) |

### **محتوى القالب**
```
العنوان: عرضنا الافتتاحي — خصم 30% ينتظرك يا {fullName}
المحتوى:
  - تحية شخصية
  - ذكّر بقيمة رِفد المجربة (أنت سجّلت قبل أسبوع)
  - عرض 30% الافتتاحي مع عدّاد ينتهي يوم الجمعة
  - زر CTA واحد: "فعّل اشتراكي الآن بخصم 30%"
  - رابط ثانوي: "اعرض الخطط"
  - Social proof: عدد المشتركين (من app_settings.founding_base_count)
```

### **شرط التشغيل**
- يُضاف `bucket` جديد إلى `onboarding-emails.ts` cron:
  ```
  { day: 7, template: 'free-trial-discount-30pct', 
    prefix: 'discount-30', 
    requireFreePlan: true,
    requireNoSubscriptionRequest: true }
  ```

---

## التسلسل الزمني المقترح

| الترتيب | المرحلة | المدة | الشرط |
|---|---|---|---|
| 1️⃣ | تفعيل Lovable Emails + setup_email_infra | فوري | — |
| 2️⃣ | هجرة 3 ملفات من Resend إلى Queue + حذف resend.ts | 30 د | المرحلة 1 |
| 3️⃣ | بناء `_shared/layout` الموحّد | 15 د | — |
| 4️⃣ | scaffold قوالب Auth (6) | فوري | DNS verified |
| 5️⃣ | ترقية القوالب الـ7 الموجودة لـ `_shared/` | 30 د | المرحلة 3 |
| 6️⃣ | قوالب Transactional الـ5 الجوهرية + ربط Triggers | ساعة | المرحلة 3 |
| 7️⃣ | **قالب discount-30 + cron bucket + اختبار** ⭐ | 45 د | المرحلة 5 |
| 8️⃣ | قوالب Lifecycle المتبقية (4) | ساعة | اختياري |

---

## المخاطر والضمانات

| الخطر | الضمانة |
|---|---|
| فشل DNS verification | فحص `check_email_domain_status` قبل البدء + خطة بديلة (إبقاء Lovable Emails معطّلة مؤقتاً مع تعطيل cron) |
| تكرار إرسال discount-30 | `idempotencyKey = discount-30-{userId}` + فحص `email_send_log` قبل كل إرسال |
| إزعاج المستخدم | مرة واحدة لكل عمر مستخدم + احترام unsubscribe + suppression |
| فقدان رسائل DLQ الحالية (10) | تركها كسجل تشخيصي — لا قيمة لاسترجاعها (`Emails disabled` خطأ نهائي) |
| كسر welcome email عند التسجيل | اختبار `sendWelcomeEmail` server function قبل النشر |

---

## التفاصيل التقنية (للمراجعة)

- **Queue routing:** كل القوالب تذهب إلى `transactional_emails` queue ما عدا Auth (تذهب لـ `auth_emails` priority queue)
- **TTL:** transactional = 60 دقيقة، auth = 15 دقيقة (افتراضيات Lovable)
- **From address النهائي:** `رِفد <noreply@notify.rifd.site>` (يُضبط تلقائياً عبر scaffold)
- **مراقبة:** صفحة `/admin/email-monitor` جديدة (اختياري بعد المرحلة 7) لعرض إحصائيات `email_send_log` المفلترة
- **التنظيف بعد النجاح:** حذف `RESEND_API_KEY` من Connectors بعد التأكد من عمل Lovable Emails أسبوعاً كاملاً

---

## القرار المطلوب

أوافق على البدء بـ **المراحل 0→7** متسلسلاً (يشمل قالب discount-30 الجديد كمرحلة 7 حرجة)؟ أم تفضّل تجزئتها على دفعات؟

