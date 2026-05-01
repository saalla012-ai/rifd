# خطة: تجهيز حزمة وصول كاملة لـ Claude Max للمراجعة

**المبدأ**: لا نصلح أي شيء الآن. فقط نُجهّز لـ Claude **كل** ما قد يحتاجه (وأكثر) ليتمكن من المراجعة الشاملة واقتراح الإصلاحات.

---

## 1. حساب Claude بصلاحيات كاملة (Admin + Pro)

إنشاء مستخدم `claude-audit@rifd.site` عبر Supabase Auth Admin API ثم:

- **الدور**: `admin` في `user_roles` (وصول لكل لوحات `/admin/*`)
- **الخطة**: `pro` في `profiles` مع `onboarded = true`
- **الرصيد**: 10,000 نقطة في `user_credits` (plan_credits + topup_credits)
- **بروفايل تجريبي كامل**: store_name, audience, product_type, tone, brand_color (لتجربة كل الأدوات بدون onboarding)
- **كلمة سر قوية**: `Audit-Claude-2026-Full-Access-X9k`
- **email_confirm = true** (دخول مباشر بدون تحقق بريد)

## 2. حزمة الوصول للقراءة المباشرة (Read-Only Access Pack)

إنشاء ملف `audit-pack/CLAUDE-ACCESS.md` يحوي:

### أ. بيانات الدخول
- URL تسجيل الدخول
- البريد + كلمة السر
- ملاحظة: الحساب أدمن كامل، يقدر يدخل `/admin/*` بالكامل

### ب. روابط مباشرة لكل اللوحات الإدارية
قائمة 18 لوحة admin موجودة:
- `/admin/analytics` — KPIs ومسار التحويل
- `/admin/credit-ledger` — سجل النقاط
- `/admin/subscriptions` — الاشتراكات النشطة/المعلقة
- `/admin/abuse-monitor` — مراقبة الإساءة
- `/admin/video-jobs` — حالة فيديوهات
- `/admin/email-monitor` — DLQ + معدلات الإرسال
- `/admin/audit` — سجل تدقيق الإجراءات
- `/admin/plan-limits`, `/admin/credits`, `/admin/campaign-packs`, `/admin/contact-submissions`, `/admin/ab-tests`, `/admin/dns-check`, `/admin/domain-scan`, `/admin/reconcile`, `/admin/video-providers`

### ج. روابط Dashboard (تجربة المستخدم النهائي)
- `/dashboard` (الرئيسية)
- `/dashboard/generate-text|image|video`
- `/dashboard/campaign-studio`
- `/dashboard/library`, `/dashboard/templates`
- `/dashboard/billing`, `/dashboard/credits`, `/dashboard/usage`
- `/dashboard/store-profile`, `/dashboard/settings`

### د. تنبيهات صريحة (Known Issues / Gaps / Warnings)
نطلب من Claude أن **يكتشف ويُبلّغ عن**:
- Single point of failure: `fal.ai` هو المزود الوحيد للفيديو
- معدل refund للفيديو 27-43% (بيانات قديمة، يحتاج تحقق حي)
- 3 طلبات اشتراك Pro منتهية الصلاحية لم تُعالج
- أي ثغرة RLS، أي endpoint عام بدون حماية، أي مفتاح مكشوف
- أي تناقض بين `plan-catalog.ts` و `plan_entitlements` في DB
- أي استهلاك غير محسوب في `cost.ts`

## 3. Read-Only SQL Snippets للمراجع

ملف `audit-pack/SQL-QUERIES.md` يحوي 15 استعلام جاهز يقدر Claude يطلبه منك تشغيله:
- KPIs (signups, conversion, MRR)
- Funnel (signup → onboarded → first_gen → paid)
- Cost per user (cost.ts vs actual)
- Credit ledger anomalies
- RLS coverage check
- Email deliverability stats
- Video provider performance

## 4. Code Map الكامل

ملف `audit-pack/CODEBASE-MAP.md` يحوي:
- خريطة كل المجلدات الرئيسية مع وصف 3 سطور
- قائمة كل الـ server functions (`src/server/*`) مع الغرض
- قائمة كل الـ public APIs (`src/routes/api/public/*`) مع الـ auth model
- قائمة الـ migrations الأخيرة (آخر 10)
- قائمة كل ملفات التهيئة الحرجة (config.toml, vite.config.ts, wrangler.jsonc)

## 5. Production Screenshots لما تبقى

التقاط 8 لقطات لـ Dashboard من production (`rifd.site`) بعد تسجيل دخول حساب Claude:
- Dashboard home
- Generate text/image/video (الثلاثة)
- Campaign studio
- Billing
- Library
- Settings + Consent settings (الجديدة)

## 6. ملف نهائي موحّد للتسليم

`audit-pack/README.md` يربط كل الملفات السابقة + `code-bundle.md` السابق + الـ screenshots، مع تعليمات لـ Claude:
1. ادخل بحساب الأدمن
2. ابدأ من `/admin/analytics` للنظرة العامة
3. استخدم SQL-QUERIES.md للأرقام
4. راجع CODEBASE-MAP.md قبل اقتراح أي تغيير
5. **مهمتك**: مراجعة قبل حملة Telegram بهدف 80 مشترك مدفوع؛ ابحث عن المخاطر التقنية والاقتصادية وUX، ولا تصلح شيئاً بنفسك—فقط اقترح.

---

## التنفيذ التقني (تفاصيل للمطوّر)

```text
1. Migration → SQL function create_audit_user(email, password)
   تستدعي auth.admin via service role لإنشاء مستخدم
   ثم INSERT في user_roles, profiles, user_credits
   (idempotent: لو موجود → يحدّث الصلاحيات فقط)

2. Server function: invoke once عبر admin-only endpoint
   أو SQL مباشر باستخدام supabaseAdmin

3. كتابة 4 ملفات Markdown في audit-pack/

4. التقاط 8 screenshots عبر browser tool بعد login
```

**لن نُعدّل أي ملف منتج (production code).** كل العمل في:
- migration واحدة (إنشاء حساب)
- مجلد `audit-pack/` (توثيق + screenshots)

بعد موافقتك، سأنفّذ بالترتيب وأرسل الحزمة الكاملة.
