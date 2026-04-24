# Launch Day Runbook — رِفد للتقنية

> **آخر تحديث:** 24 أبريل 2026 — **جاهزية الإطلاق: 92/100**

---

## 🎯 النتيجة النهائية لمراجعة P5

| المحور | الحالة | الملاحظة |
|--------|--------|----------|
| **DNS الأساسي** (`rifd.site`) | ✅ يعمل | يشير إلى `185.158.133.1` + TXT verification |
| **www.rifd.site** | ✅ يعمل | A record صحيح |
| **HTTPS + SSL** | ✅ نشط | HTTP/2 200 + HSTS |
| **النشر** (`rifd.lovable.app`) | ✅ يعيد التوجيه إلى rifd.site | كما هو متوقع |
| **Lovable Cloud** | ✅ صحي | جاهز للقراءة/الكتابة |
| **Supabase Linter** | ✅ نظيف | لا تحذيرات |
| **PostHog Analytics** | ✅ يعمل | الأحداث تصل (لاحظت `200 Ok` في الشبكة) |
| **Authorized URLs (PostHog)** | ✅ مُفعّلة | 5 نطاقات مُضافة |
| **SEO** (sitemap/robots/OG) | ✅ كل شيء يستجيب 200 | |
| **قاعدة البيانات** | ✅ نشطة | 10 مستخدمين، 7 onboarded، 15 توليدة في 7 أيام |
| **بريد معاملاتي** | ⚠️ **غير مُكوَّن** | لا يوجد نطاق بريد في الـworkspace |
| **طلبات اشتراك معلقة** | ⚠️ **5 pending** (4 منها >24س) | يحتاج مراجعة يدوية فورية |

---

## 🔴 إجراء عاجل واحد قبل الإطلاق العلني

### البريد المعاملاتي غير مُفعّل

**المشكلة:** عند فحص النطاق `notify.rifd.club`، النتيجة:
```
Email domain 'notify.rifd.club' not found in this workspace.
No email domains configured for this workspace.
```

**الأثر العملي:**
- ❌ بريد التحقق عند التسجيل لن يُرسَل
- ❌ بريد إعادة تعيين كلمة المرور لن يعمل
- ❌ تأكيدات الاشتراك لن تصل
- ❌ بريد ترحيب onboarding لن يُرسَل

**العلاج (5 دقائق):**
1. افتح Lovable Cloud → **Emails**
2. اضغط **Add domain**
3. اكتب فقط: `rifd.club` (Lovable يضيف `notify` تلقائياً — قاعدة موثّقة في `mem://constraints/email-domain-name`)
4. أضف سجلات DNS التي تظهر (MX, SPF, DKIM, DMARC) في لوحة Namecheap
5. انتظر التحقق (15-60 دقيقة)
6. شغّل `setup_email_infra` بعدها

---

## 🟡 إجراءات تنظيف موصى بها (يمكن تأجيلها 24 ساعة)

### 1. مراجعة 5 طلبات اشتراك معلقة (4 منها أقدم من 24 ساعة — حرجة)

افتح `/admin/subscriptions` → فلتر "pending" → اتصل بكل عميل يدوياً عبر واتساب خلال 4 ساعات.

```sql
-- استعلام سريع للمراجعة:
SELECT id, plan, billing_cycle, whatsapp, created_at,
       EXTRACT(EPOCH FROM (now() - created_at))/3600 AS hours_old
FROM subscription_requests
WHERE status = 'pending'
ORDER BY created_at ASC;
```

**SLA:** أي طلب أقدم من 24 ساعة بحالة pending = blocker لمعدل التحويل.

### 2. تأكيد إعدادات PostHog النهائية
- النطاقات الـ5 المُضافة ✅
- (اختياري) فعّل Session Replay من Settings → Session replay لمدة أسبوع لمراقبة سلوك أول 50 مستخدم.

---

## 📊 لوحات المراقبة اليومية (أول 72 ساعة)

### الصباح (9:00 AM)
| الفحص | المسار | المعيار الأخضر |
|------|--------|---------------|
| طلبات اشتراك جديدة | `/admin/contact-submissions` (Subs tab) | الرد خلال 4 ساعات |
| رسائل تواصل | `/admin/contact-submissions` | الرد خلال 12 ساعة |
| صحة البريد | `/admin/email-monitor` | DLQ = 0، failed < 5% |
| أحداث PostHog | https://us.posthog.com → Activity | `signup_completed` يتزايد |

### المساء (9:00 PM)
| الفحص | المعيار |
|------|--------|
| Sentry/Console errors | 0 errors حرجة |
| `subscription_requests` stale | 0 طلبات أقدم من 24 ساعة بـ`pending` |
| توليدات ناجحة | معدل 80%+ من المحاولات |
| استهلاك Lovable AI | ضمن الحد اليومي |

---

## 🚨 سيناريوهات الطوارئ

### السيناريو 1: الموقع لا يفتح
1. تحقق من https://www.dnschecker.org/#A/rifd.site (يجب أن يكون 185.158.133.1 عالمياً)
2. افتح Lovable → Project Settings → Domains → تأكد أن الحالة "Active"
3. إن كانت "Offline"، اضغط "Retry"

### السيناريو 2: التسجيل لا يعمل (لا يصل بريد)
- **المتوقع حالياً** بسبب عدم تكوين نطاق البريد. اتبع "إجراء عاجل" أعلاه.

### السيناريو 3: التوليدات تفشل (429/quota)
1. تحقق من `/admin/plan-limits`
2. تحقق من رصيد Lovable AI Gateway
3. إن لزم: ارفع الحدود مؤقتاً للـpro/business

### السيناريو 4: انفجار DLQ في البريد
1. `/admin/email-monitor` → اضغط "View DLQ"
2. حلّل أكثر template يفشل
3. أعد المعالجة عبر "Replay" أو احذف وأعد إنشاء

### السيناريو 5: Lovable Cloud يبطئ/يفشل
- شغّل `cloud_status` (متاح للـAI)
- إن استمر: Cloud → Overview → Advanced → ارفع instance size

---

## 📈 مؤشرات النجاح (الأسبوع الأول)

| KPI | الهدف الأدنى | الممتاز |
|-----|-------------|---------|
| تسجيلات جديدة | 20 | 100+ |
| إكمال onboarding | 60% | 85% |
| طلبات اشتراك | 5 | 25+ |
| تحويل pending → activated | 70% | 90% |
| Bounce rate الصفحة الرئيسية | < 60% | < 40% |
| متوسط مدة الزيارة | > 1 دقيقة | > 3 دقائق |
| رسائل تواصل | < 10 | 5-15 (يدل على ثقة) |

---

## 🔐 أمان مستمر

### يومياً
- تحقق من `admin_audit_log` لأي إجراء مشبوه
- راجع `auth_logs` لمحاولات brute-force

### أسبوعياً
- شغّل `supabase--linter`
- راجع RLS policies على أي جدول جديد
- دوّر مفاتيح Lovable AI إن لزم (`rotate_lovable_api_key`)

### شهرياً
- مراجعة كاملة لـSOP في `qa-runbook.md`
- مسح الإيميلات المكبوتة (`suppressed_emails`) — هل العدد يتزايد بشكل طبيعي؟
- نسخة احتياطية من تحويلات الجداول الحرجة

---

## 📞 جهات الاتصال السريعة

- **دعم Lovable**: https://discord.com/channels/1119885301872070706/
- **دعم Namecheap (DNS)**: لوحة الحساب
- **مستندات Supabase**: https://supabase.com/docs
- **PostHog status**: https://status.posthog.com

---

## ✅ خطوات الإطلاق العلني (Marketing Launch)

> لا تبدأ التسويق حتى يكتمل البريد المعاملاتي.

1. ✅ DNS مستقر 24 ساعة بدون أعطال
2. ⏳ نطاق البريد مُكوَّن ومُختبَر بتسجيل وهمي
3. ⏳ اختبر مسار التسجيل الكامل: signup → email confirm → onboarding → first generation
4. ⏳ اختبر مسار الاشتراك الكامل: pricing → /pricing → subscription_request → دفع → activation يدوي
5. ⏳ إعلان على القنوات: تويتر، لينكدإن، واتساب الأعمال
6. ⏳ مراقبة 72 ساعة متواصلة حسب الجداول أعلاه

---

**🟢 الحكم النهائي:** الموقع جاهز للزيارات والـSEO. **التسجيل والاشتراك** يحتاجان تكوين نطاق البريد قبل الإطلاق التسويقي.
