# خطة تجهيز حزمة المراجعة لـ Claude Max

سأجمع المطلوب في **رد واحد منظّم** + **رد منفصل سرّي** لبيانات حساب الاختبار. الخطوات أدناه تُنفَّذ بالتسلسل عند الموافقة.

---

## المرحلة 1: تنفيذ استعلامات SQL (الحزمة 1)

أشغّل الاستعلامات الثمانية عبر `supabase--read_query` وأعرض كل نتيجة في جدول Markdown منفصل بعنوانه (Funnel / توزيع الباقات / الاستخدام / الفيديو / النشطين 7 أيام / pipeline الاشتراكات / الإيرادات / استهلاك النقاط).

ملاحظة مبكرة من فحص أولي: عدد المستخدمين الحالي صغير جداً (4 signups, 1 paid) — سأعرض الأرقام كما هي بدون تجميل.

---

## المرحلة 2: تكلفة AI الفعلية (الحزمة 2)

- استخراج الأسعار **من الكود الفعلي**: `src/server/cost.ts` (يحوي تسعيرنا الداخلي للنماذج النصية والصور) + جدول `video_provider_configs`.
- تشغيل استعلام `video_provider_configs` لعرض كلفة الفيديو الفعلية لكل مزوّد.
- حساب إجمالي التكلفة من جدول `generations` آخر 30 يوم (موجود فعلياً عبر `estimated_cost_usd`).
- **أصرّح بوضوح**: لا يوجد لدينا اتصال مباشر بفاتورة Lovable AI Gateway من داخل التطبيق؛ سأعتمد على `estimated_cost_usd` المُسجّل لكل توليدة كأقرب تقدير، وأذكر أنه تقديري وليس فاتورة.
- لا أستطيع التقاط Screenshots من صفحات Pricing الخارجية (Lovable/Replicate/FAL) — سأذكر ذلك صراحة.

---

## المرحلة 3: Screenshots للتجربة (الحزمة 3)

سأستخدم متصفّح الـ sandbox (`browser--navigate_to_sandbox` + `browser--screenshot`) لالتقاط:

- **Desktop (1366×768)**: الرئيسية، Pricing، Onboarding (الخطوات + ConsentDialog)، Dashboard، Generate Text، Generate Image، Generate Video، Campaign Studio، Library، Settings، Billing، Quota Exceeded (إن أمكن استدعاؤه)، صفحة الدفع البنكي.
- **Mobile (375×812)**: الرئيسية، Pricing، Dashboard، Generate Image.

**قيود سأذكرها للمستخدم بصراحة**:
1. المتصفح يفتح على بيئة الـ Preview (`id-preview--…lovable.app`) وليس `rifd.site` مباشرةً. الكود واحد، لكن إذا كان الإصرار على production فعلي فهذا يحتاج تنفيذاً يدوياً منك. سأحاول `navigate_to_url` على `https://rifd.site` كبديل.
2. للحصول على Dashboard فعلي يلزم تسجيل دخول. سأستخدم حساب الاختبار الذي سأنشئه في المرحلة 5.
3. بعض الشاشات (Quota Exceeded، Success Pack) تتطلب حالات معيّنة قد لا أستطيع تركيبها كلها — سألتقط ما أستطيع وأُبلغك بما تعذّر.
4. ستحفظ الـ Screenshots في `/mnt/documents/audit-pack/` وأرفقها كـ `presentation-artifact`.

---

## المرحلة 4: ملفات الكود (الحزمة 4)

أرفق المحتوى الكامل لـ:
- `src/lib/plan-catalog.ts`, `src/lib/prompts-data.ts`
- `src/server/ai-functions.ts`, `src/server/video-functions.ts`, `src/server/credits.ts`, `src/server/cost.ts` (إضافي مهم)
- `src/routes/pricing.tsx`, `src/routes/index.tsx`, `src/routes/dashboard.billing.index.tsx`, `src/routes/onboarding.tsx`, `src/routes/dashboard.generate-text.tsx`, `src/routes/dashboard.generate-image.tsx`
- `src/components/quota-exceeded-dialog.tsx`, `src/components/consent-dialog.tsx`, `src/components/consent-settings.tsx`
- آخر 5 migrations في `supabase/migrations/`

ملاحظة: `src/components/onboarding-success-pack.tsx` **محذوف** فعلياً (في الجلسة السابقة) — سأذكر ذلك بدل إرفاق ملف غير موجود.

نظراً لحجم الملفات (~4200 سطر إجمالاً)، سأرفعها ملفاً مجمّعاً واحداً في `/mnt/documents/audit-pack/code-bundle.md` بدل إغراق المحادثة، وأضع ملخّصاً في الرد نفسه.

---

## المرحلة 5: حساب اختبار للمستشار (رد منفصل)

عبر migration:
1. إنشاء مستخدم جديد في `auth.users` بـ email: `claude-audit@rifd.site` وكلمة سر قوية عشوائية (32 char).
2. تفعيل البريد فوراً (`email_confirmed_at = now()`).
3. تحديث الـ profile (يُنشأ تلقائياً عبر trigger `handle_new_user`): `plan = 'pro'`, `onboarded = true`, ملء بيانات متجر تجريبية معقولة (لا بيانات حقيقية).
4. شحن `user_credits.plan_credits = 5000`، تسجيل سطر في `credit_ledger` بنوع `manual_grant` للسلامة المحاسبية.
5. **لا** أُعطيه أي صلاحية admin (الوصف يقول "كل ميزات التوليد" فقط).

سأرسل الـ credentials في **رد ثانٍ منفصل** بعد تأكيد المرحلة الأولى لتقليل سطح الانكشاف في سجل المحادثة.

---

## ترتيب التسليم

```
رد 1 (علني — حزمة المراجعة):
  ├─ § الحزمة 1: نتائج SQL (8 جداول)
  ├─ § الحزمة 2: تكلفة AI (من cost.ts + video_provider_configs + generations summary)
  ├─ § الحزمة 3: Screenshots (روابط artifacts منظّمة بأقسام)
  ├─ § الحزمة 4: ملخّص الكود + رابط code-bundle.md
  └─ § ملاحظات الشفافية (ما تعذّر جمعه ولماذا)

رد 2 (سرّي — credentials):
  └─ URL + Email + Password لحساب claude-audit
```

---

## ما سأذكره صراحةً كقيود (التزاماً بطلب الشفافية)

- لا أستطيع جلب فاتورة Lovable AI الفعلية من داخل التطبيق.
- Screenshots ستكون من بيئة الـ Preview أو محاولة على rifd.site عبر `navigate_to_url` (الكود متطابق).
- بعض شاشات الحالات الحرجة قد تحتاج محاكاة لن تكتمل دائماً (مثلاً تجاوز الـ quota فعلياً بدون إنفاق ميزانية حقيقية).
- بيانات الاستخدام شحيحة (4 مستخدمين فقط) — هذا الواقع ما قبل الإطلاق.

---

## السؤال الوحيد قبل التنفيذ

هل توافق على إنشاء حساب `claude-audit@rifd.site` بصلاحية `pro` + 5000 نقطة عبر migration؟ (هذا أكبر تعديل في الخطة، الباقي قراءة فقط + التقاط Screenshots).

عند موافقتك، أبدأ التنفيذ بالكامل في الوضع الافتراضي.
