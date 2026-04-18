

## المشكلة
الحروف العربية في الـPDF تظهر منفصلة لأن `pdf-lib` + `arabic-reshaper` لا ينتج ligatures صحيحة مع Noto Naskh الحالي.

## الحل
استبدال خط Noto Naskh بخط **Amiri** (Regular + Bold) بصيغة TTF تقليدية تحتوي Arabic Presentation Forms مدمجة. Amiri معروف بدعمه الممتاز للـreshaping عبر `arabic-reshaper` + `bidi-js` مع `pdf-lib`.

## التنفيذ

### 1) إضافة خطوط Amiri
- تحميل `Amiri-Regular.ttf` و `Amiri-Bold.ttf` من Google Fonts (مفتوحة المصدر، SIL OFL).
- وضعها في `src/assets/fonts/`.
- (اختياري) حذف ملفات Noto القديمة.

### 2) تحديث `src/routes/api.invoice.$requestId.ts`
- تغيير الاستيراد:
  ```ts
  import amiriRegularUrl from "@/assets/fonts/Amiri-Regular.ttf?url";
  import amiriBoldUrl from "@/assets/fonts/Amiri-Bold.ttf?url";
  ```
- استبدال `notoRegularUrl` / `notoBoldUrl` بمتغيرات Amiri في `readFontBytes(...)`.
- الإبقاء على نفس منطق `shapeArabic` (reshaper + bidi) — Amiri يحوي الـPresentation Forms المطلوبة فيُرسم الحروف موصولة.
- `subset: false` يبقى كما هو (مهم لتجنّب فقدان الـligatures عند التضمين).

### 3) التحقق بعد التنفيذ
- بعد التطبيق، تنزيل فاتورة لطلب مفعّل والتأكد بصرياً أن:
  - الحروف العربية موصولة بشكل صحيح
  - الأرقام والنص اللاتيني في اتجاهها الصحيح
  - لا توجد مربعات سوداء أو حروف مفقودة

## الملفات المتأثرة
| ملف | تغيير |
|---|---|
| `src/assets/fonts/Amiri-Regular.ttf` | جديد |
| `src/assets/fonts/Amiri-Bold.ttf` | جديد |
| `src/routes/api.invoice.$requestId.ts` | تبديل مراجع الخطوط |
| `src/assets/fonts/NotoNaskhArabic-*.ttf` | حذف (تنظيف) |

## ملاحظة
إن استمرت مشكلة فصل الحروف حتى مع Amiri، فالسبب الجذري هو أن `arabic-reshaper` لا يُخرج Presentation Forms متوافقة. الخطة الاحتياطية: التبديل إلى مكتبة `harfbuzzjs` للـshaping (تتطلب تغييراً أكبر).

