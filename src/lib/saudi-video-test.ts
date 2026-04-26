export type SaudiVideoPersonaId = "male-young" | "male-premium" | "female-abaya" | "retail-seller";
export type SaudiVideoScenarioId = "perfume" | "abaya" | "arabic-coffee" | "electronics";

export const SAUDI_VIDEO_PERSONAS: Array<{ id: SaudiVideoPersonaId; label: string; brief: string }> = [
  { id: "male-young", label: "متحدث سعودي شاب", brief: "Saudi young male presenter in white thobe and white ghutra, natural UGC delivery." },
  { id: "male-premium", label: "رجل سعودي فاخر", brief: "Elegant Saudi male presenter in formal thobe and red shemagh, premium confident commercial style." },
  { id: "female-abaya", label: "متحدثة سعودية", brief: "Saudi female presenter in modest abaya and hijab, refined ecommerce style." },
  { id: "retail-seller", label: "بائع داخل متجر", brief: "Saudi retail seller inside a modern store, warm direct product recommendation style." },
];

export const SAUDI_VIDEO_TEST_SCENARIOS: Array<{ id: SaudiVideoScenarioId; label: string; productBrief: string; voiceLine: string }> = [
  { id: "perfume", label: "إعلان عطر سعودي فاخر", productBrief: "luxury Arabian perfume bottle, oud and amber mood, premium Riyadh boutique", voiceLine: "هذا العطر صُمم لذوق سعودي فاخر… اطلبه الآن وخلك مميز." },
  { id: "abaya", label: "إعلان عباية/موضة محتشمة", productBrief: "elegant modest abaya fashion, clean Saudi boutique, premium fabric detail", voiceLine: "أناقة محتشمة بتفاصيل راقية… اختاري قطعتك اليوم." },
  { id: "arabic-coffee", label: "إعلان قهوة عربية/منتج تراثي", productBrief: "Saudi Arabic coffee product with dates, warm hospitality atmosphere", voiceLine: "قهوتك بطابع سعودي أصيل… جرّب الطعم اللي يليق بضيافتك." },
  { id: "electronics", label: "إعلان متجر إلكترونيات", productBrief: "modern ecommerce electronics accessory, clear product showcase, fast delivery feel", voiceLine: "منتج عملي وجودة واضحة… اطلبه الآن ويوصلك بسرعة." },
];

export const FAL_VIDEO_TEST_MODELS = [
  { id: "fal-ai/veo3/fast", label: "VEO 3 Fast", supportsVoice: true, supportsTwoImages: true },
  { id: "fal-ai/veo3", label: "VEO 3", supportsVoice: true, supportsTwoImages: true },
  { id: "fal-ai/kling-video/v2.1/standard/image-to-video", label: "Kling Standard I2V", supportsVoice: false, supportsTwoImages: false },
  { id: "fal-ai/minimax/video-01/image-to-video", label: "MiniMax I2V", supportsVoice: false, supportsTwoImages: false },
  { id: "fal-ai/pixverse/v4.5/image-to-video", label: "PixVerse I2V", supportsVoice: false, supportsTwoImages: false },
] as const;

export function buildSaudiFalTestPrompt(input: { personaBrief: string; scenarioId: SaudiVideoScenarioId; includeProductImage: boolean; includeVoice: boolean }) {
  const scenario = SAUDI_VIDEO_TEST_SCENARIOS.find((item) => item.id === input.scenarioId) ?? SAUDI_VIDEO_TEST_SCENARIOS[0];
  return [
    "Create a premium Saudi commercial video for ecommerce in Riyadh.",
    `Main character reference: ${input.personaBrief} Keep identity, clothing, modesty, face structure, and Gulf/Saudi visual style consistent with the provided image.`,
    input.includeProductImage ? `Product reference: keep the provided product image accurate, visible, and central. Product context: ${scenario.productBrief}.` : `Product context: ${scenario.productBrief}.`,
    "Camera movement: slow cinematic push-in, subtle orbit around the product, natural hand gesture from the presenter, realistic hands, realistic face, premium retail lighting.",
    input.includeVoice ? `Audio: clear Saudi Arabic voiceover in a natural Gulf accent, synchronized with the commercial. Spoken line: ${scenario.voiceLine}` : "No voice requirement unless the model supports audio reliably.",
    "Avoid readable text, Arabic letters inside the generated video, distorted logos, Westernized clothing, unrealistic fingers, face warping, oversexualized styling, or exaggerated claims.",
    "Vertical 9:16, 5 to 8 seconds, high-conversion Saudi ad style.",
  ].join("\n");
}

export function evaluateSaudiVideoImage(input: { hasProductImage: boolean; personaLabel: string }) {
  return {
    score: input.hasProductImage ? 92 : 84,
    recommendation: input.hasProductImage
      ? `ممتازة للاختبار: ${input.personaLabel} مع صورة منتج يسمحان بقياس الالتزام بالشخص والمنتج والحركة.`
      : `جيدة للاختبار: ${input.personaLabel} تكفي لاختبار الشخصية والصوت، ويفضّل إضافة صورة منتج لقياس إعلان التجارة الإلكترونية.`
  };
}