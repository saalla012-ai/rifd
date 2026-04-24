---
name: Email domain naming rule
description: قاعدة كتابة اسم نطاق البريد + سجل المحاولات
type: constraint
---

## الوضع الحالي
**النطاق الفعّال:** `notify.rifd.site` (status: pending DNS verification).
الكود في الملفات الخمسة يستخدمه الآن.

## القاعدة الذهبية
عند إضافة نطاق بريد في Lovable، **اكتب الجذر فقط** (`rifd.site`).
Lovable يضيف `notify.` تلقائياً — تكرارها ينتج `notify.notify.rifd.site` وهو مكسور.

## سجل المحاولات
| المحاولة | النتيجة | السبب |
|---|---|---|
| `notify.rifd.site` (المحاولة الأولى) | ❌ Failed | `DOMAIN_OWNED_BY_ANOTHER_ACCOUNT` |
| `rifd.site` (الجذر) | ❌ Failed | نفس المشكلة |
| `mail.rifd.site` | ⏳ لم يُجرَّب | غير ضروري الآن |
| **`rifd.site` → `notify.rifd.site` (إعادة محاولة)** | ✅ **Pending DNS** | نجح بعد إعادة الإضافة |

## الملفات المُحدَّثة (تستخدم notify.rifd.site)
1. `src/routes/lovable/email/auth/webhook.ts`
2. `src/routes/lovable/email/transactional/send.ts`
3. `src/routes/hooks/onboarding-emails.ts`
4. `src/routes/hooks/expiring-subscriptions.ts`
5. `src/server/send-welcome.ts`

## درس مستفاد
أحياناً إعادة إضافة نفس النطاق بعد فترة تنجح — Mailgun قد يحرر الملكية تلقائياً.
