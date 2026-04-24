---
name: Email domain naming rule
description: تاريخ المحاولات الفاشلة + الحل الصحيح
type: constraint
---

## الوضع الحالي (24 أبريل 2026)
**لا يوجد نطاق بريد فعّال.** الكود مُحدَّث لـ `mail.rifd.site` لكنه لم يُضَف في Lovable.

## سجل المحاولات (كلها فاشلة حالياً)
| المحاولة | النتيجة | السبب |
|---|---|---|
| `notify.rifd.site` | ❌ Failed | `DOMAIN_OWNED_BY_ANOTHER_ACCOUNT` في Mailgun |
| `rifd.site` (الجذر) | ❌ Failed | نفس المشكلة — مملوك لحساب Mailgun آخر |
| `mail.rifd.site` | ⏳ لم يُجرَّب | يجب إضافته يدوياً في Lovable |

## الحل الصحيح
1. في Lovable Cloud → Emails → اضغط `+ Add a new email domain`
2. أدخل: `mail.rifd.site`
3. إذا فشل أيضاً → جرب `send.rifd.site` أو `email.rifd.site`
4. إذا فشلت كل المحاولات → تواصل مع دعم Lovable لتحرير ملكية `rifd.site` من Mailgun

## الملفات (تستخدم mail.rifd.site الآن)
1. `src/routes/lovable/email/auth/webhook.ts`
2. `src/routes/lovable/email/transactional/send.ts`
3. `src/routes/hooks/onboarding-emails.ts`
4. `src/routes/hooks/expiring-subscriptions.ts`
5. `src/server/send-welcome.ts`

## درس مستفاد
لا تثق بالصور المعروضة في حوارات الإعداد كدليل على النجاح — تحقق دائماً عبر `email_domain--check_email_domain_status`.
