---
name: Email domain naming rule
description: قاعدة اسم نطاق البريد + سجل المحاولات
type: constraint
---

## القرار النهائي (24 أبريل 2026)
- **النطاق الفعلي:** `rifd.site` (الجذر مباشرة، بدون subdomain)
- **From address:** `رِفد <noreply@rifd.site>`
- **Site name:** `رِفد`

## سجل المحاولات
1. ❌ `notify.rifd.site` — فشل: `DOMAIN_OWNED_BY_ANOTHER_ACCOUNT` في Mailgun
2. ❌ `mail.rifd.site` — لم يُستخدم (تم القفز للجذر مباشرة)
3. ✅ `rifd.site` — يعمل (تحت Setting up)

## ملاحظة Lovable
Lovable يدعم استخدام الجذر مباشرة كـ sender domain — لا يلزم subdomain.

## الملفات المُحدَّثة (تستخدم rifd.site الآن)
1. `src/routes/lovable/email/auth/webhook.ts`
2. `src/routes/lovable/email/transactional/send.ts`
3. `src/routes/hooks/onboarding-emails.ts`
4. `src/routes/hooks/expiring-subscriptions.ts`
5. `src/server/send-welcome.ts`

## DNS (تُدار تلقائياً من Lovable)
سجلات NS + SPF + DKIM + DMARC تُولَّد وتُتحقق من Lovable Cloud.
