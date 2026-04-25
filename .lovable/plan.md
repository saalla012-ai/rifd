سأجهّز لك الحزمة كملفات ZIP قابلة للتحميل والإرسال فوراً، بدون تضمين أي أسرار أو مفاتيح حساسة.

## المطلوب تنفيذه بعد موافقتك

### 1) إنشاء 3 ملفات ZIP منفصلة

#### ZIP 1: التدقيق التقني والأمان والربحية
الهدف: مراجعة منطق النقاط، تكاليف VEO3، الحصص اليومية، الأمان، صلاحيات الأدمن، وسياسات قاعدة البيانات.

سيشمل ملفات مثل:
- `src/server/credits.ts`
- `src/server/cost.ts`
- `src/server/video-functions.ts`
- `src/server/ai-functions.ts`
- `src/server/lovable-ai.ts`
- `src/server/admin-auth.ts`
- `src/hooks/use-auth.tsx`
- `src/components/admin-guard.tsx`
- `src/integrations/supabase/auth-middleware.ts`
- `src/routes/pricing.tsx`
- `supabase/migrations/`
- `tests/admin-plan-limits.test.ts`

#### ZIP 2: التسويق، تجربة المستخدم، والصفحات العامة
الهدف: تقييم الصفحة الرئيسية، الهيرو، وضوح الفكرة خلال 3 ثوان، صفحات القطاعات، الترتيب التسويقي، والملاءمة للسوق السعودي.

سيشمل ملفات مثل:
- `src/routes/index.tsx`
- `src/routes/about.tsx`
- `src/routes/pricing.tsx`
- `src/routes/proof-center.tsx`
- `src/routes/business-solutions.tsx`
- `src/routes/contact.tsx`
- `src/routes/vs-chatgpt.tsx`
- صفحات القطاعات: `for-abayas-fashion`, `for-perfumes-beauty`, وغيرها
- مكونات الهوم والبراند والثقة والتحويل مثل:
  - `home-hero.tsx`
  - `home-hero-content.ts`
  - `trust-bar.tsx`
  - `comparison-table.tsx`
  - `how-it-works.tsx`
  - `before-after.tsx`
  - `site-header.tsx`
  - `site-footer.tsx`
- `src/styles.css`

#### ZIP 3: رحلة المستخدم، لوحة التحكم، الإيميلات، والأدمن
الهدف: مراجعة مسار المستخدم من التسجيل إلى الاستخدام، لوحة المستخدم، لوحة الأدمن، الإيميلات، الفوترة، الاشتراكات، السجلات، وإدارة المنصة.

سيشمل ملفات مثل:
- `src/routes/auth.tsx`
- `src/routes/onboarding.tsx`
- `src/routes/dashboard.*.tsx`
- `src/components/dashboard-shell.tsx`
- `src/components/credits-bar.tsx`
- `src/components/quota-exceeded-dialog.tsx`
- `src/routes/admin.*.tsx`
- `src/server/admin-*.ts`
- `src/lib/email-templates/`
- `src/lib/email/send.ts`
- `src/routes/lovable/email/`
- `src/routes/legal.privacy.tsx`
- `src/routes/legal.terms.tsx`
- `src/routes/legal.refund.tsx`

### 2) إضافة ملفات إرشادية داخل كل ZIP
سأضيف داخل كل حزمة ملف README/AUDIT_CONTEXT يشرح للمراجع الخارجي:
- ما الذي يجب مراجعته في هذه المرحلة.
- الروابط المباشرة للموقع:
  - Preview: `https://id-preview--694f48b8-26d0-46e8-9443-b81b61c8f1f6.lovable.app`
  - Published: `https://rifd.lovable.app`
  - Custom domain: `https://rifd.site`
  - WWW: `https://www.rifd.site`
- تعليمات عدم الهلوسة.
- طريقة تصنيف النتائج: Critical / High / Medium / Low.
- تنبيه واضح بأن أداة الفيديو المعتمدة هي Google VEO3 عبر Replicate، ويجب تدقيق التكلفة والهوامش بناءً على ذلك.

### 3) إضافة ملف Prompt نهائي جاهز للنسخ
سأضع ملفاً منفصلاً اسمه تقريباً:
- `00_FINAL_AUDIT_PROMPTS_ARABIC.md`

ويحتوي على:
- برومبت المرحلة الأولى: التقنية، الأمان، والربحية.
- برومبت المرحلة الثانية: التسويق وتجربة المستخدم والسوق السعودي.
- برومبت المرحلة الثالثة: الخلاصة وخريطة الطريق حتى 100%.
- قالب مفاتيح دخول آمن تضع فيه الحسابات التجريبية المؤقتة بنفسك، بدون أن أضع أسرار حقيقية داخل الملفات.

### 4) استبعاد الملفات الحساسة تلقائياً
لن أضع داخل أي ZIP:
- `.env`
- أي مفاتيح API أو Service Role حقيقية
- `node_modules`
- `.git`
- ملفات build/cache مثل `dist`, `.output`, `.vinxi`
- أي ملف يحتوي على أسرار تشغيلية مباشرة

## الناتج النهائي
سأرسل لك 4 ملفات قابلة للتحميل:

```text
rifd-audit-stage-1-technical-security-profitability.zip
rifd-audit-stage-2-marketing-ux-saudi-market.zip
rifd-audit-stage-3-user-admin-email-journeys.zip
rifd-final-audit-prompts-and-access-template.zip
```

## ملاحظة مهمة
أنا الآن في وضع القراءة فقط، لذلك لا أستطيع إنشاء ملفات ZIP فعلياً في هذه الرسالة. بمجرد موافقتك على هذه الخطة، سأنتقل للتنفيذ وأنشئ لك الملفات الجاهزة للتحميل مباشرة.