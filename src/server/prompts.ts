/**
 * Server-side system prompt builder.
 * Builds personalized system prompts using the user's store profile so every
 * generation reflects the brand's voice without the user having to repeat it.
 */

export type StoreContext = {
  store_name?: string | null;
  product_type?: string | null;
  audience?: string | null;
  tone?: string | null;
  brand_color?: string | null;
};

const TONE_LABEL: Record<string, string> = {
  fun: "نبرة مرحة وقريبة من الجمهور",
  pro: "نبرة احترافية ورصينة",
  warm: "نبرة دافئة وعاطفية",
  bold: "نبرة جريئة وحماسية",
};

const PRODUCT_LABEL: Record<string, string> = {
  dropshipping: "متجر دروبشيبنق",
  fashion: "متجر أزياء وملابس",
  beauty: "متجر تجميل وعناية",
  food: "متجر مأكولات",
  electronics: "متجر إلكترونيات",
  services: "متجر خدمات",
  handmade: "متجر منتجات يدوية",
  other: "متجر متنوع",
};

export function buildTextSystemPrompt(ctx: StoreContext, template: string): string {
  const toneText = ctx.tone ? TONE_LABEL[ctx.tone] ?? "نبرة طبيعية" : "نبرة طبيعية";
  const productText = ctx.product_type
    ? PRODUCT_LABEL[ctx.product_type] ?? "متجر إلكتروني"
    : "متجر إلكتروني";

  return `أنت كاتب محتوى تسويقي محترف للسوق السعودي. اكتب باللغة العربية الفصحى المخلوطة بالعامية السعودية الأصيلة (مثل: "كذا"، "وش رايك"، "تراه"، "يفرّح القلب"، "حقك").

سياق المتجر:
- الاسم: ${ctx.store_name ?? "متجر العميل"}
- النوع: ${productText}
- الجمهور المستهدف: ${ctx.audience ?? "مستخدمي السوشيال السعوديين"}
- النبرة المطلوبة: ${toneText}

نوع المحتوى المطلوب: ${template}

قواعد:
1. ابدأ مباشرة بالمحتوى — لا مقدمات ولا اعتذارات.
2. استخدم emojis بذكاء (٢-٤ لكل منشور).
3. أضف CTA واضح (دعوة لاتخاذ إجراء).
4. ${template.includes("هاشتاق") || template.includes("إنستقرام") ? "أنهِ بـ ٤-٦ هاشتاقات سعودية ذات صلة." : "لا تستخدم هاشتاقات إلا إذا طُلب منك."}
5. اكتب محتوى أصلي وليس قالباً. اجعله ينطبق على عميل سعودي حقيقي.`;
}

export function buildImagePrompt(ctx: StoreContext, userPrompt: string, template: string): string {
  const brand = ctx.brand_color ? ` Use brand color ${ctx.brand_color} as accent.` : "";
  return `Professional Saudi Arabian e-commerce marketing image. ${template}. ${userPrompt}. High quality, clean composition, modern design, photorealistic where applicable.${brand} Include bold Arabic text overlay where relevant. Square format suitable for Instagram.`;
}
