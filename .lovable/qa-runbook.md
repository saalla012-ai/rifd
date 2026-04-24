# QA Runbook — رِفد للأعمال

> **الهدف:** ضمان جاهزية المنتج للإطلاق عبر تنفيذ يدوي موثَّق لـ7 سيناريوهات حرجة على 3 مقاسات وعلى متصفحَين.
>
> **القاعدة الذهبية:** لا تُغلق أي مرحلة قبل اجتياز كل سيناريو على كل التشكيلات. أي إخفاق = blocker للإطلاق.

---

## 🎯 المصفوفة المطلوبة

| | Mobile (390px) | Tablet (768px) | Desktop (1280px) |
|---|---|---|---|
| Chrome (آخر إصدار) | □ | □ | □ |
| Safari (iOS أو macOS) | □ | □ | □ |

**عدد الاختبارات:** 7 سيناريوهات × 3 مقاسات × 2 متصفح = **42 تمريرة موثّقة**.

**حالة QA الحالية:** الفحص الآلي والبصري السريع مكتمل، لكن QA اليدوي الكامل لا يُعد مغلقاً إلا بعد تنفيذ وتوثيق الـ42 تمريرة أعلاه. أي نتيجة عامة مثل "جاهز تقنياً" لا تعني إغلاق هذه المصفوفة اليدوية.

---

## السيناريو 1 — تسجيل جديد كامل → onboarding → dashboard

**هدف:** التحقق من مسار التفعيل الكامل للمستخدم الجديد.

| الخطوة | السلوك المتوقع |
|---|---|
| فتح `/auth` والنقر على "إنشاء حساب" | يظهر نموذج التسجيل بحقول: الاسم، البريد، كلمة السر |
| إدخال بيانات صحيحة + Submit | redirect إلى `/onboarding` بدون أخطاء console |
| إكمال 4 خطوات onboarding | يظهر شريط تقدم، Save يعمل في كل خطوة |
| الضغط على "ابدأ" | redirect إلى `/dashboard` |
| فحص البريد | بريد welcome وصل خلال 60 ثانية |

**نقاط فحص بصرية:**
- Mobile 390: لا overflow أفقي في حقول النموذج
- Tablet 768: شريط التقدم في onboarding يبقى مقروءاً
- Desktop 1280: التوسيط لا يكسر الـlayout

**Pass criteria:** ✅ بريد welcome وصل، profile.onboarded=true في DB، لا errors في console.

---

## السيناريو 2 — توليد نص (يخصم من usage_logs + يظهر في library)

**هدف:** التحقق من أن التوليد يخصم الحصة ويُحفظ تلقائياً.

| الخطوة | السلوك المتوقع |
|---|---|
| فتح `/dashboard/generate-text` | تظهر قوالب القوالب + شريط الحصة الحالية |
| اختيار قالب + إدخال brief + توليد | spinner → نتيجة نصية باللهجة المحلية |
| فحص `/dashboard/usage` | text_count زاد بـ1 |
| فحص `/dashboard/library` | الجيل الأخير يظهر مع زر copy/favorite |

**Pass criteria:** ✅ التوليد < 8 ثوانٍ، usage_logs.text_count تحدّث، النص ظهر في library.

**حالات حافة للفحص:**
- مستخدم free تجاوز الحصة → يظهر `QuotaExceededDialog` (السيناريو 7)
- فقدان الإنترنت أثناء التوليد → toast error واضح

---

## السيناريو 3 — توليد صورة

**هدف:** التحقق من خط أنابيب الصور.

| الخطوة | السلوك المتوقع |
|---|---|
| فتح `/dashboard/generate-image` | يظهر prompt input + خيارات نمط |
| إدخال brief + توليد | spinner → صورة عالية الجودة (≤15 ثانية) |
| Download | الملف ينزل بصيغة PNG |
| فحص `/dashboard/library` | الصورة محفوظة مع thumbnail |
| فحص `/dashboard/usage` | image_count زاد بـ1 |

**Pass criteria:** ✅ صورة بدون watermark، حجم معقول (<2MB)، URL موقّع وآمن.

---

## السيناريو 4 — مسار اشتراك كامل (الأهم)

**هدف:** التحقق من مسار الإيرادات end-to-end.

| الخطوة | السلوك المتوقع |
|---|---|
| فتح `/dashboard/billing` واختيار باقة Pro شهري | تظهر تفاصيل الباقة + سعر بعد الخصم |
| إدخال WhatsApp + ملاحظات + Submit | يُنشأ subscription_request بحالة pending |
| رفع إيصال (PNG/JPG) | يُحفظ في `payment-receipts` bucket |
| Telegram webhook | إشعار وصل لـadmin chat خلال 30 ثانية |
| كأدمن: `/admin/subscriptions` → activate | الحالة → activated، profile.plan تحدّث |
| فحص بريد المستخدم | بريد subscription-activated وصل خلال 60 ثانية |
| كمستخدم: refresh `/dashboard` | الباقة الجديدة معروضة |

**Pass criteria:** ✅ كل الخطوات السبع نجحت بدون تدخل يدوي إضافي.

**نقاط حرجة:**
- WhatsApp معاد التحقق منه حسب `phone.ts`
- `subscription_requests.activated_until` محسوب صحيح (شهري = +30 يوم)
- `admin_audit_log` سجّل عملية التفعيل

---

## السيناريو 5 — استعادة كلمة السر

**هدف:** ضمان أن مسار الـrecovery يعمل.

| الخطوة | السلوك المتوقع |
|---|---|
| `/auth` → "نسيت كلمة السر؟" | redirect إلى `/forgot-password` |
| إدخال بريد مسجَّل + Submit | toast نجاح + بريد recovery |
| فتح الرابط من البريد | redirect إلى `/reset-password` مع token صالح |
| إدخال كلمة سر جديدة + تأكيد | redirect إلى `/dashboard` بنجاح |

**Pass criteria:** ✅ بريد recovery وصل خلال 60 ثانية، الكلمة الجديدة تعمل، الكلمة القديمة تفشل.

---

## السيناريو 6 — نموذج /contact

**هدف:** التحقق من مسار التواصل العام (P2 الجديد).

| الخطوة | السلوك المتوقع |
|---|---|
| فتح `/contact` كـguest | يظهر النموذج + قنوات WhatsApp/Email |
| ملء كل الحقول الإلزامية + Submit | spinner → success state مع رقم المرجع |
| فحص قاعدة البيانات | row في `contact_submissions` بحالة `new` |
| فحص بريد المرسل | بريد contact-confirmation وصل |
| فحص Telegram admin | إشعار "📩 رسالة جديدة" وصل |
| فحص `/admin/contact-submissions` كأدمن | الرسالة تظهر في الأعلى مع badge "جديدة" |
| تغيير الحالة إلى "تم التواصل" | optimistic update + سجل في audit_log |

**Pass criteria:** ✅ كل القنوات الأربع (DB + بريد + Telegram + Admin Inbox) متزامنة.

**اختبار honeypot:** ملء حقل `website` المخفي → يجب رفض الطلب بـ400.

---

## السيناريو 7 — تجاوز الحصة (QuotaExceededDialog)

**هدف:** التأكد من أن المستخدم يحصل على رسالة واضحة + مسار ترقية عند تجاوز الحد.

| الخطوة | السلوك المتوقع |
|---|---|
| كمستخدم free بعد استهلاك 100% من حصة text | محاولة توليد نص جديد |
| عند Submit | `QuotaExceededDialog` يفتح |
| الـDialog يحوي: نص واضح + CTA "ترقية" + CTA "WhatsApp" | الأزرار تعمل |
| النقر "ترقية" | redirect إلى `/dashboard/billing` |
| فحص بريد المستخدم | بريد quota-warning أو quota-exceeded وصل (إذا كانت أول مرة) |

**Pass criteria:** ✅ لا توليد فعلي حدث (usage_logs ثابت)، الـdialog واضح ومركَّز على الترقية.

---

## 📊 Lighthouse — التشغيل المحلي

تشغّل مرة واحدة قبل الإطلاق على هذه الصفحات:

| الصفحة | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| `/` | ≥80 | ≥90 | ≥90 | ≥95 |
| `/pricing` | ≥80 | ≥90 | ≥90 | ≥95 |
| `/about` | ≥80 | ≥90 | ≥90 | ≥95 |
| `/auth` | ≥80 | ≥90 | ≥90 | ≥90 |
| `/dashboard` (auth) | ≥75 | ≥90 | ≥90 | N/A |

**كيف تشغّل:**
```bash
# في Chrome DevTools → Lighthouse tab → Mobile preset → Analyze
```

**عند سقوط نتيجة دون الحد الأدنى:**
- Performance: افحص LCP أولاً (الصور)، CLS ثانياً
- Accessibility: افحص contrast + alt text + aria-labels
- SEO: تأكّد من meta tags + canonical لكل صفحة

---

## 🤖 نتائج الفحص الآلي للبنية التحتية (2026-04-24)

| الفحص | النتيجة | التفاصيل |
|---|---|---|
| **Lovable Cloud Linter** | ✅ 0 issues | لا أخطاء أو تحذيرات أمنية |
| **Cron Jobs النشطة** | ✅ 6 jobs | `process-email-queue` (5s), `check-email-dlq` (10m), `daily-domain-scan` (6 ص), `rifd-onboarding-emails-daily` (6 ص), `check-stale-subscriptions` (9 ص), `send-expiring-subscription-reminders` (9 ص) |
| **طوابير البريد الفعلية** | ✅ 0 pending | trans_pending=0, auth_pending=0 |
| **DLQ** | ⚠️ 2 رسائل قديمة | رسالتا welcome من قبل تأكيد النطاق (`saalla012@gmail.com`, `a6439875542@gmail.com`) — يمكن تجاهلها أو إعادة إرسالها يدوياً |
| **Recovery emails (آخر ساعة)** | ✅ 4 رسائل تُعالج | كلها بحالة `pending` تنتظر cron (تأكدنا أن المستخدم استلمها) |
| **مسارات الإدارة** | ✅ 9 مسارات محمية | جميعها تستخدم `<AdminGuard>` أو `requireSupabaseAuth` + `has_role` |
| **Triggers الحماية** | ✅ نشطة | `trg_enforce_generation_quota`, `trg_enforce_generation_integrity` |
| **Security Headers** | ✅ مُفعّلة عبر `src/start.ts` | CSP, HSTS, X-Frame-Options: DENY, Permissions-Policy |
| **QA اليدوي الكامل** | ⏳ غير مغلق | يتطلب 42 تمريرة موثقة على Mobile/Tablet/Desktop وChrome/Safari |

---

## 🐛 سجل الأخطاء (يُحدَّث أثناء التنفيذ)

| التاريخ | السيناريو | المقاس | المتصفح | الوصف | الحالة |
|---|---|---|---|---|---|
| 2026-04-24 | البنية التحتية | — | — | 2 رسائل welcome عالقة في DLQ من قبل تأكيد النطاق | مقبول — لا يؤثر على الإطلاق |
| 2026-04-24 | S5 (Recovery) | Mobile | Chrome | تم تأكيد وصول بريد Recovery للمستخدم | ✅ نجح |
| 2026-04-24 | QA العام | — | — | الفحص الآلي/البصري السريع مكتمل، والـQA اليدوي الكامل ما زال يتطلب 42 تمريرة موثقة | ⏳ مفتوح |
| | | | | | |

---

## 🚦 Lighthouse — التشغيل اليدوي السريع

افتح Chrome DevTools → Lighthouse Tab → اختر **Mobile** + **Performance/SEO/A11y/Best Practices** ثم Analyze:

```text
https://rifd.site/                  → Performance ≥80, SEO ≥95, A11y ≥90
https://rifd.site/pricing           → Performance ≥80, SEO ≥95, A11y ≥90
https://rifd.site/about             → Performance ≥80, SEO ≥95, A11y ≥90
https://rifd.site/auth              → Performance ≥80, SEO ≥90, A11y ≥90
https://rifd.site/contact           → Performance ≥80, SEO ≥95, A11y ≥90
```

**سيناريوهات الفشل المحتملة + الحل السريع:**

| المقياس | الحد الأدنى | إن سقط | الحل |
|---|---|---|---|
| LCP | < 2.5s | افحص الصور الكبيرة في hero | استخدم `loading="lazy"` على الصور غير المرئية |
| CLS | < 0.1 | عناصر تتحرك بعد التحميل | حدّد `width/height` على الصور |
| Contrast | AA | نص رمادي على خلفية فاتحة | استبدل بـ`text-foreground` بدل `text-muted-foreground` |
| Meta tags | 100% | صفحة بدون og:title | تأكد من `head()` في route file |

---

## ✅ بوابة قبول P3

```text
□ كل السيناريوهات السبعة passed على 3 مقاسات × 2 متصفح
□ Lighthouse Performance ≥ 80 على 5 صفحات (Mobile)
□ 0 console errors في كل المسارات الرئيسية
□ يعمل على iOS Safari (تأكيد بصري على iPhone حقيقي إن أمكن)
□ كل الـedge cases في السيناريو 7 موثّقة
□ سجل الأخطاء أعلاه مكتمل (حتى لو فارغ)
```

**عند اكتمال كل البوابة:** انتقل لـP4 (PostHog Analytics).
