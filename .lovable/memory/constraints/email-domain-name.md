---
name: Email domain naming rule
description: قاعدة اسم نطاق البريد + سبب التغيير من notify إلى mail
type: constraint
---

## القاعدة الحالية (24 أبريل 2026)
- **النطاق الفعلي:** `mail.rifd.site`
- **الجذر:** `rifd.site`
- **From address:** `noreply@mail.rifd.site`

## سبب التغيير
- المحاولة الأولى استخدمت `notify.rifd.site` لكنها فشلت بـ `DOMAIN_OWNED_BY_ANOTHER_ACCOUNT` في Mailgun.
- الحل: استبدال `notify` بـ `mail` كنطاق فرعي بديل.

## الملفات المتأثرة
عند أي تغيير لاسم النطاق، حدّث **5 ملفات**:
1. `src/routes/lovable/email/auth/webhook.ts` (السطر 35)
2. `src/routes/lovable/email/transactional/send.ts` (السطر 9-10)
3. `src/routes/hooks/onboarding-emails.ts` (السطر 8-9)
4. `src/routes/hooks/expiring-subscriptions.ts` (السطر 8-9)
5. `src/server/send-welcome.ts` (السطر 9-10)

## سجلات DNS المطلوبة في Namecheap
- **NS records** (4 سجلات) لتفويض النطاق الفرعي لـ Lovable
- **SPF, DKIM, DMARC** تُولَّد تلقائياً من Lovable
