# Memory: index.md
Updated: today

# Project Memory

## Core
نطاق البريد: `notify.rifd.club` (الجذر `rifd.club`). عند أي إعادة إضافة، اكتب الجذر فقط — لا تكتب `notify` يدوياً.
دومين الإنتاج: `https://rifd.lovable.app`. كل cron jobs و webhooks يجب أن تستخدمه — لا تستخدم `id-preview-*` أبداً.
DLQ alerts تصل عبر تيليجرام. راجع `/admin/email-monitor` يومياً.
لا تكشف `app_settings.whatsapp_number` للزوار — استخدم RPC `get_founding_status` للعدّاد العام و RPC للمسجلين فقط لرقم الواتساب.
عند تفعيل اشتراك (status → activated) تُحدَّث `profiles.plan` تلقائياً عبر trigger — لا تُحدّثها يدوياً من الكود.
Idempotency: unique partial index على `(user_id, plan) WHERE status='pending'` — عالج خطأ 23505 في UI.

## Memories
- [Email domain naming](mem://constraints/email-domain-name) — قاعدة كتابة اسم النطاق + سجلات NS
