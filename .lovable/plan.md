

# خطة المراجعة والاختبار الشاملة لمنصة رِفد — A→Z

## 🎯 الهدف
تقييم نقدي معمّق لكل سطح من أسطح المنصة (Marketing + SaaS + Backend + Email + Admin) لاكتشاف الأخطاء، الفجوات، والمخاطر الأمنية والتجارية قبل الإطلاق التسويقي الكبير.

---

## 🧭 منهجية المراجعة (5 طبقات)

| الطبقة | الأداة | المخرج |
|---|---|---|
| **1. Static Audit** | قراءة الكود + lint + TypeScript build | تقرير أخطاء بنيوية |
| **2. Database & Security** | `supabase--linter` + RLS audit + security scan | تقرير ثغرات + RLS gaps |
| **3. Functional E2E** | browser automation + curl للروتس | تقرير سلوك فعلي |
| **4. Performance & UX** | network logs + console + viewport tests | تقرير أداء وتجربة |
| **5. Business Logic** | تحليل تدفقات حرجة (دفع/حصص/onboarding) | تقرير منطق أعمال |

---

## 📋 نطاق المراجعة الكامل (12 محور)

### **المحور 1 — الواجهة التسويقية (Marketing Site)**
| الصفحة | الفحوصات |
|---|---|
| `/` (Home) | LCP، CTA hierarchy، A/B test integrity، sticky mobile CTA، responsive 320→1920 |
| `/about`, `/pricing`, `/vs-chatgpt` | SEO meta كاملة، og:image لكل route، schema.org |
| `/legal/{privacy,terms,refund}` | اكتمال البنود، تطابق مع PDPL السعودي |

**عين الناقد:** هل CTA واضح خلال 3 ثواني؟ هل الـ social proof موثوق؟ هل هناك friction غير ضروري قبل التسجيل؟

---

### **المحور 2 — تدفق المصادقة (Auth Flow)**
| الاختبار | المتوقع |
|---|---|
| التسجيل بإيميل جديد | trigger `handle_new_user` → profile + role + welcome email |
| تأكيد البريد | redirect صحيح + session فعّال |
| Google OAuth | يعمل بدون شاشة بيضاء |
| نسيان كلمة المرور | إيميل recovery → `/reset-password` يعمل |
| Magic link | OTP صالح 15 دقيقة |
| تغيير البريد | تأكيد مزدوج (قديم + جديد) |
| محاولات فاشلة متكررة | rate limit يعمل |

**عين الناقد:** هل رسائل الخطأ بالعربية؟ هل هناك flash of unauthenticated content؟

---

### **المحور 3 — Onboarding (5 خطوات)**
- اكتمال profile (whatsapp + store info)
- redirect logic في `dashboard.tsx` (السطور 22-28)
- حفظ بيانات المتجر
- إرسال welcome email + جدولة onboarding emails
- معالجة الرجوع للـ onboarding بعد إكماله (يجب ألا يحدث)

---

### **المحور 4 — التوليد بالذكاء الاصطناعي**
| الميزة | الفحص |
|---|---|
| `/dashboard/generate-text` | كل القوالب، حدود الحصص، error handling |
| `/dashboard/generate-image` | جودة الصور، رفعها لـ storage، token cost |
| `/dashboard/edit-image` | نتائج الصور المحرّرة |
| `enforce_generation_quota` trigger | يرفض فعلاً عند تجاوز الحد |
| `bump_usage` RPC | عداد دقيق، idempotency |

**عين الناقد:** ماذا يحدث لو فشل LLM في منتصف الإنشاء؟ هل تُخصم الحصة؟ (تسرّب مالي محتمل)

---

### **المحور 5 — الفوترة والاشتراكات**
- `/pricing` → اختيار خطة → upload receipt → Telegram notification
- `/dashboard/billing/confirm/{id}` admin approval flow
- توليد الفاتورة `/api/invoice/{id}`
- `subscription-activated` email
- `subscription-expiring` cron (7 أيام قبل)
- إعادة المحاولة عند فشل الدفع

**عين الناقد:** هل يمكن تزوير `payment-receipt`? هل RLS يحمي طلبات الاشتراك من المنافسين؟

---

### **المحور 6 — نظام البريد الجديد (المُهاجَر)**
| الفحص | الأداة |
|---|---|
| Lovable Emails enabled | `email_domain--check_email_domain_status` |
| pg_cron `process-email-queue` نشط | query `cron.job` |
| كل القوالب الـ16 تُرندَر بنجاح | curl على preview endpoints |
| Idempotency لـ `discount-30-{userId}` | محاولة إرسال مزدوج |
| Suppression list يعمل | إضافة بريد ومحاولة الإرسال |
| Unsubscribe link يعمل | E2E test |
| TTL expiration للرسائل العالقة | فحص DLQ |

---

### **المحور 7 — لوحة الأدمن**
| الصفحة | الفحص |
|---|---|
| `/admin/analytics` | KPIs دقيقة، funnel صحيح |
| `/admin/audit` | كل العمليات الحساسة مسجّلة |
| `/admin/plan-limits` | تعديل الحدود يعمل ويُسجَّل |
| `/admin/subscriptions` | approve/reject مع notification |
| `/admin/domain-scan` | نتائج صحيحة |
| `/admin/ab-tests` | بيانات حقيقية لا dummy |

**عين الناقد:** هل غير-الأدمن يمكنه الوصول؟ (security--run_security_scan)

---

### **المحور 8 — قاعدة البيانات + RLS**
- `supabase--linter` لفحص RLS gaps
- مراجعة كل سياسة على `profiles`, `subscriptions`, `generations`, `usage_logs`, `payment_receipts`
- اختبار SQL injection على RPCs
- فحص functions بـ `SECURITY DEFINER` (هل `search_path` محدد؟ ✅ لاحظت أنها كذلك)
- اختبار `has_role` لمنع privilege escalation

---

### **المحور 9 — الأداء (Performance)**
| المقياس | الهدف |
|---|---|
| Lighthouse Mobile | ≥ 85 |
| LCP `/` | < 2.5s |
| CLS | < 0.1 |
| Bundle size | < 500KB initial |
| API p95 | < 500ms |
| DB query p95 | < 100ms |

اختبارات: `browser--performance_profile` على home + dashboard + generate-text.

---

### **المحور 10 — الأمان (Security Audit)**
- `security--run_security_scan` كامل
- مراجعة secrets (RESEND_API_KEY يجب حذفه بعد المرحلة الناجحة)
- فحص webhook signatures (`api.notify-telegram-admin`)
- CORS headers على public APIs
- XSS في حقول إدخال المستخدم (store name, prompts)
- File upload validation (`payment-receipts` bucket)
- Rate limiting على `api.demo-generate`

---

### **المحور 11 — تكامل Telegram + Webhooks**
- `notify_admin_on_subscription_request` trigger
- `api.telegram-set-chat-id` flow
- HMAC signature verification

---

### **المحور 12 — UX/Accessibility/i18n**
- RTL سليم في كل الصفحات (لا overflow)
- تباين الألوان WCAG AA
- keyboard navigation
- screen reader (aria-labels)
- responsive breakpoints (320, 375, 458 ← الحالي، 768, 1024, 1440)
- error states + empty states + loading states في كل صفحة

---

## 📦 المخرج النهائي

تقرير منظَّم على شكل ملف `/mnt/documents/audit-report-rifd.md` يحتوي:

```
1. ملخص تنفيذي (10 أسطر) — الحالة العامة + أهم 5 مخاطر
2. مصفوفة Findings (Severity × Category):
   - 🔴 Critical (يمنع الإطلاق)
   - 🟠 High (يجب إصلاحه قبل التسويق)
   - 🟡 Medium (تحسين خلال أسبوع)
   - 🟢 Low (تحسين مستمر)
3. لكل finding:
   - الوصف + الموقع (file:line)
   - أثر الأعمال
   - خطوة الإصلاح المقترحة
4. KPIs قابلة للقياس قبل/بعد الإصلاح
5. خطة Quick Wins (24 ساعة)
6. خطة Roadmap (أسبوعين)
```

---

## ⚙️ خطة التنفيذ (3 جلسات)

| الجلسة | المدة | المحاور | المخرج |
|---|---|---|---|
| **A — Static + Security** | 30 د | 1, 8, 10 | تقرير ثغرات + lint |
| **B — Functional E2E** | 45 د | 2, 3, 4, 5, 6, 7, 11 | تقرير سلوك فعلي بـ browser |
| **C — Perf + UX + Final Report** | 30 د | 9, 12 + تجميع | تقرير `audit-report-rifd.md` نهائي |

---

## 🛠 الأدوات المطلوبة (تتفعّل في وضع التنفيذ)

- `supabase--linter`, `supabase--read_query`, `supabase--analytics_query`
- `security--run_security_scan`, `security--get_table_schema`
- `browser--*` (navigate, observe, act, screenshot, performance_profile, network_requests)
- `code--exec` لتشغيل build + tests + توليد التقرير PDF
- `email_domain--check_email_domain_status`

---

## ⚠️ ضمانات السلامة

- **لن أعدّل أي كود** خلال المراجعة — قراءة فقط
- أي إصلاحات تأتي في **خطة منفصلة بعد التقرير** بأولويات واضحة
- اختبار destructive (حذف/تعديل) يستخدم بياناتي الخاصة فقط، ليس بيانات مستخدمين حقيقيين
- لن أكشف أي PII في التقرير

---

## 📊 معايير القبول

- ≥ 95% من الميزات تعمل end-to-end
- 0 ثغرات Critical أو High
- Lighthouse mobile ≥ 85
- 0 RLS gaps في الجداول الحساسة
- كل قوالب البريد تُرسَل بنجاح في الاختبار

