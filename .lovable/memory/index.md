# Memory: index.md
Updated: now

# Project Memory

## Core
النطاق الرسمي الموحَّد: **`rifd.site`** (تم استبدال `rifd.club` و`rifd.tech` بالكامل في 2026-04-21). أي رابط/بريد جديد يجب أن يكون تحت `rifd.site` فقط.
نطاق البريد الفرعي: `notify.rifd.site`. عند إعادة إضافة نطاق البريد في Lovable، اكتب الجذر `rifd.site` فقط — Lovable يضيف `notify` تلقائياً.
مراقبة البريد: راجع `/admin/email-monitor` يومياً + تنبيهات Telegram تلقائية لأي `dlq_total > 5` (cron كل 10 دقائق، rate-limited بتنبيه/ساعة).
لا تُكرّر طلبات subscription_requests pending لنفس (user_id, plan) — مفروض على DB بـ unique index؛ تعامل مع PG error 23505 في أي UI ينشئ طلباً.

## Memories
- [Email domain naming](mem://constraints/email-domain-name) — قاعدة كتابة اسم النطاق عند الإعداد + سجلات NS الصحيحة
- [Launch checklist](.lovable/launch-checklist.md) — قائمة الإطلاق الرسمية + SOP للتعامل مع DLQ alerts
