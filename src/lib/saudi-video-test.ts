export type SaudiVideoPersonaId = "male-young" | "male-premium" | "female-abaya" | "retail-seller";
export type SaudiVideoScenarioId = "perfume" | "abaya" | "arabic-coffee" | "electronics";
export type SaudiVideoPromptTemplate = { id: string; label: string; sector: string; risk: "منخفض" | "متوسط" | "عالٍ"; prompt: string };

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
  { id: "fal-ai/pixverse/v6/image-to-video", label: "PixVerse v6 I2V", supportsVoice: true, supportsProductImage: true, supportsTwoImages: false, estimatedUsd: 0.25 },
  { id: "fal-ai/pixverse/v6/text-to-video", label: "PixVerse v6 T2V", supportsVoice: true, supportsProductImage: false, supportsTwoImages: false, estimatedUsd: 0.2 },
  { id: "fal-ai/kling-video/v2.1/standard/image-to-video", label: "Kling Standard I2V — احتياطي", supportsVoice: false, supportsProductImage: true, supportsTwoImages: false, estimatedUsd: 0.35 },
  { id: "fal-ai/minimax/video-01/image-to-video", label: "MiniMax I2V — احتياطي", supportsVoice: false, supportsProductImage: true, supportsTwoImages: false, estimatedUsd: 0.3 },
] as const;

const saudiPrompt = (sector: string, hook: string, action: string, voice: string) => `${hook}\nالمشهد: إعلان سعودي واقعي داخل بيئة ${sector}، المنتج ظاهر بوضوح وغير معزول على خلفية بيضاء.\nالحركة: ${action}\nالكاميرا: عمودي 9:16، دفع سينمائي بطيء، إضاءة متجر سعودية راقية، انتقال واحد ناعم إذا احتاج المشهد.\nالصوت: رجل/امرأة بلهجة سعودية طبيعية يقول/تقول: "${voice}"\nتجنب: النصوص العربية المرئية، الوجوه المشوهة، الأصابع الزائدة، المبالغة غير الموثوقة، تغيير شكل المنتج.`;

export const SAUDI_VIDEO_PROMPT_TEMPLATES: SaudiVideoPromptTemplate[] = [
  { id: "perfume-premium-hook", label: "عطر فاخر — هوك سريع", sector: "العطور", risk: "منخفض", prompt: saudiPrompt("بوتيك عطور فاخر", "ابدأ بلقطة قريبة للزجاجة مع انعكاس ذهبي فاخر.", "المتحدث يرفع العطر بهدوء ثم يقرّبه من الكاميرا مع ابتسامة واثقة.", "هذا العطر يعطيك حضور من أول لحظة… اطلبه اليوم وخلك مميز.") },
  { id: "perfume-oud-story", label: "عود وعنبر", sector: "العطور", risk: "متوسط", prompt: saudiPrompt("ركن عطور سعودي دافئ", "افتح على بخار خفيف وخلفية عود وعنبر دون مبالغة.", "اليد تدير العبوة ببطء والمتحدث يشير لمكونات العطر.", "لمسة عود وعنبر بذوق سعودي… تجربة تستاهلها.") },
  { id: "abaya-elegance", label: "عباية راقية", sector: "الأزياء", risk: "متوسط", prompt: saudiPrompt("بوتيك عبايات محتشم", "اظهر خامة العباية وتفاصيلها الراقية من أول ثانية.", "المتحدثة تتحرك خطوة بسيطة وتلمس القماش لإظهار الجودة.", "أناقة محتشمة بتفاصيل تفرق… اختاري قطعتك اليوم.") },
  { id: "abaya-launch", label: "إطلاق مجموعة", sector: "الأزياء", risk: "متوسط", prompt: saudiPrompt("معرض أزياء سعودي أنيق", "ابدأ بلقطة رفّ فيه أكثر من تصميم ثم ركّز على المنتج الأساسي.", "حركة كاميرا جانبية بطيئة مع التفاف بسيط للقطعة.", "وصلت المجموعة الجديدة… اختاري اللوك اللي يشبهك.") },
  { id: "coffee-hospitality", label: "قهوة وضيافة", sector: "القهوة", risk: "منخفض", prompt: saudiPrompt("جلسة ضيافة سعودية", "ابدأ بصب القهوة بجانب المنتج والتمر في إطار دافئ.", "المتحدث يرفع العبوة ثم يضعها بجانب الدلة.", "قهوتك بطابع سعودي أصيل… جرّب الطعم اللي يليق بضيافتك.") },
  { id: "coffee-morning", label: "قهوة صباحية", sector: "القهوة", risk: "منخفض", prompt: saudiPrompt("مطبخ سعودي حديث", "لقطة صباحية مشرقة للمنتج بجانب فنجان قهوة.", "يد تفتح العبوة والمتحدث يشير للرائحة والطعم.", "ابدأ يومك بمذاق مضبوط… قهوة تفرق معك.") },
  { id: "electronics-benefit", label: "إلكترونيات — فائدة", sector: "الإلكترونيات", risk: "منخفض", prompt: saudiPrompt("مكتب عمل حديث", "افتح بمشكلة صغيرة ثم أظهر المنتج كحل عملي.", "المتحدث يستخدم المنتج أمام الكاميرا بلقطة واضحة.", "منتج عملي وجودة واضحة… اطلبه الآن ويوصلك بسرعة.") },
  { id: "electronics-unboxing", label: "فتح صندوق", sector: "الإلكترونيات", risk: "متوسط", prompt: saudiPrompt("مكتب تصوير منتجات", "ابدأ بفتح الصندوق مع ظهور المنتج بشكل نظيف.", "اليد تخرج المنتج وتضعه على المكتب ثم لقطة قريبة للتفاصيل.", "فتحته وجربته… واضح أنه عملي ويستاهل.") },
  { id: "beauty-skincare", label: "عناية البشرة", sector: "التجميل", risk: "متوسط", prompt: saudiPrompt("ركن عناية فاخر", "ابدأ بلقطة المنتج مع إضاءة ناعمة ونظيفة.", "المتحدثة تمسك المنتج وتشرح فائدته دون تطبيق مباشر مبالغ.", "روتين بسيط ونتيجة تحبينها… جربيه اليوم.") },
  { id: "beauty-makeup", label: "مكياج", sector: "التجميل", risk: "متوسط", prompt: saudiPrompt("طاولة مكياج راقية", "لقطة قريبة للمنتج مع لون واضح ومتناسق.", "حركة يد تعرض العبوة ثم لقطة للنتيجة بشكل محتشم.", "لون ثابت ولمسة مرتبة… خليه ضمن اختياراتك.") },
  { id: "gifts-luxury", label: "هدايا فاخرة", sector: "الهدايا", risk: "منخفض", prompt: saudiPrompt("ركن تغليف هدايا", "ابدأ بفتح صندوق هدية أنيق والمنتج داخله.", "المتحدث يقدّم الهدية باتجاه الكاميرا بحركة دافئة.", "هدية مرتبة وتوصل الإحساس قبل الكلام… اطلبها الآن.") },
  { id: "sweets-maamoul", label: "حلويات ومعمول", sector: "الحلويات", risk: "منخفض", prompt: saudiPrompt("ضيافة منزلية سعودية", "افتح على صينية مرتبة والمنتج في المنتصف.", "يد تلتقط قطعة واحدة والمتحدث يشير للتغليف والجودة.", "ضيافة تفتح النفس… اطلبها لمناسبتك الجاية.") },
  { id: "restaurant-offer", label: "مطعم — عرض", sector: "المطاعم", risk: "متوسط", prompt: saudiPrompt("مطعم سعودي عصري", "ابدأ بلقطة طبق جذابة مع بخار خفيف طبيعي.", "النادل يضع الطبق أمام الكاميرا والمتحدث يشير للعرض.", "جوعان؟ العرض هذا لك… اطلبه الآن.") },
  { id: "home-decor", label: "ديكور منزلي", sector: "المنزل", risk: "منخفض", prompt: saudiPrompt("غرفة معيشة سعودية حديثة", "أظهر المنتج داخل ديكور واقعي وليس كصورة منفصلة.", "الكاميرا تتحرك ببطء حول المنتج لإظهار حجمه وتناسقه.", "تفصيل بسيط يغير شكل المكان… اختاره لبيتك.") },
  { id: "kids-product", label: "منتج أطفال", sector: "الأطفال", risk: "عالٍ", prompt: saudiPrompt("غرفة أطفال آمنة ومرتبة", "أظهر المنتج وحده بوضوح دون إظهار طفل بملامح قريبة.", "يد بالغة تعرض المنتج وتوضح طريقة استخدامه بأمان.", "اختيار عملي ومريح لطفلك… شوفي التفاصيل الآن.") },
  { id: "fitness-product", label: "رياضة", sector: "الرياضة", risk: "متوسط", prompt: saudiPrompt("نادي منزلي بسيط", "ابدأ باستخدام المنتج في حركة آمنة وواضحة.", "المتحدث يوضح الفائدة بحركة قصيرة دون مبالغة جسدية.", "خلك مستمر بأداة تساعدك… اطلبها اليوم.") },
  { id: "supplements", label: "مكملات", sector: "الصحة", risk: "عالٍ", prompt: saudiPrompt("مطبخ صحي مرتب", "أظهر العبوة بوضوح مع كأس ماء ومشهد نظيف.", "المتحدث يمسك العبوة دون تقديم ادعاءات علاجية.", "اختيارك اليومي يبدأ بتنظيم بسيط… اقرأ التفاصيل واطلبه.") },
  { id: "jewelry", label: "مجوهرات", sector: "المجوهرات", risk: "متوسط", prompt: saudiPrompt("طاولة مجوهرات فاخرة", "لقطة ماكرو للقطعة مع لمعان طبيعي غير مبالغ.", "اليد تدير القطعة ببطء والمتحدث يبرز التصميم.", "قطعة ناعمة وتلفت النظر… مناسبة لك أو كهدية.") },
  { id: "bags", label: "شنط", sector: "الإكسسوارات", risk: "منخفض", prompt: saudiPrompt("بوتيك إكسسوارات", "أظهر الشنطة بحجمها الحقيقي مع خامتها وتفاصيلها.", "المتحدثة تحمل الشنطة وتضعها على الطاولة بلقطة واضحة.", "عملية وأنيقة… شنطة تناسب يومك.") },
  { id: "shoes", label: "أحذية", sector: "الأزياء", risk: "متوسط", prompt: saudiPrompt("متجر أحذية حديث", "لقطة منخفضة للحذاء مع إضاءة نظيفة.", "حركة يد تعرض النعل والتفاصيل دون مشي مبالغ.", "راحة وشكل مرتب… شوف المقاسات واطلب الآن.") },
  { id: "watch", label: "ساعة", sector: "الإكسسوارات", risk: "متوسط", prompt: saudiPrompt("مكتب فاخر", "لقطة قريبة للساعة على المعصم ثم على الطاولة.", "المتحدث يحرّك المعصم ببطء لإظهار اللمعة والتفاصيل.", "تفصيل صغير يعطي حضور… اختر ساعتك اليوم.") },
  { id: "phone-case", label: "كفر جوال", sector: "الإكسسوارات التقنية", risk: "منخفض", prompt: saudiPrompt("مكتب تصوير تقني", "أظهر الكفر وهو يركب على الجوال بوضوح.", "حركة يد تقلب الجوال وتعرض الحماية والتصميم.", "حماية وشكل في نفس الوقت… اطلبه لجوالك.") },
  { id: "pet-product", label: "منتجات أليفة", sector: "الحيوانات الأليفة", risk: "عالٍ", prompt: saudiPrompt("ركن منزلي نظيف", "أظهر المنتج بجانب مساحة الحيوان دون تفاعل معقد.", "يد بالغة تعرض المنتج وتضعه في مكانه.", "راحة أكثر لحيوانك الأليف… شوف التفاصيل.") },
  { id: "car-accessory", label: "إكسسوار سيارة", sector: "السيارات", risk: "متوسط", prompt: saudiPrompt("داخل سيارة حديثة", "أظهر المنتج مركباً داخل السيارة بوضوح.", "المتحدث يركب المنتج بحركة واحدة سهلة.", "تفصيل بسيط يخلي مشاويرك أرتب… اطلبه الآن.") },
  { id: "digital-service", label: "خدمة رقمية", sector: "الخدمات", risk: "متوسط", prompt: saudiPrompt("مكتب سعودي حديث", "أظهر المتحدث أمام شاشة مجردة دون نصوص واضحة.", "المتحدث يشير للشاشة ثم يخاطب الكاميرا بثقة.", "إذا تبغى نتيجة أسرع، الخدمة هذي تختصر عليك وقت.") },
  { id: "ramadan-offer", label: "رمضان", sector: "موسمي", risk: "منخفض", prompt: saudiPrompt("أجواء رمضانية راقية", "أظهر المنتج ضمن سفرة رمضانية دون ازدحام بصري.", "المتحدث يضع المنتج في منتصف الطاولة مع إضاءة دافئة.", "جهّز طلبات رمضان من بدري… العرض لفترة محدودة.") },
  { id: "eid-gift", label: "العيد", sector: "موسمي", risk: "منخفض", prompt: saudiPrompt("تغليف عيد أنيق", "افتح على صندوق هدية مع لمسات عيد راقية.", "المتحدث يرفع المنتج ويقدمه كخيار هدية.", "هدية عيد مرتبة وتوصل بسرعة… اطلبها الآن.") },
  { id: "national-day", label: "اليوم الوطني", sector: "موسمي", risk: "متوسط", prompt: saudiPrompt("ديكور سعودي أخضر وأبيض", "أظهر المنتج ضمن أجواء وطنية راقية دون شعارات مشوهة.", "حركة كاميرا بطيئة على المنتج والمتحدث بجانب خلفية سعودية.", "احتفل بطريقتك… منتج يليق بالمناسبة.") },
  { id: "limited-offer", label: "عرض محدود", sector: "عروض", risk: "منخفض", prompt: saudiPrompt("متجر إلكتروني مصور داخل مكتب", "ابدأ بظهور المنتج بوضوح مع إحساس استعجال بصري دون نصوص.", "المتحدث يشير للمنتج ثم للكاميرا بدعوة مباشرة.", "العرض محدود والكمية تمشي بسرعة… اطلبه الآن.") },
  { id: "premium-testimonial", label: "توصية فاخرة", sector: "عام", risk: "متوسط", prompt: saudiPrompt("مكتب سعودي فاخر", "المتحدث يبدأ مباشرة بتوصية طبيعية دون مبالغة.", "حركة يد هادئة نحو المنتج ثم لقطة قريبة له.", "جربته وفرق معي… إذا يناسبك لا تفوته.") },
];

export function buildSaudiFalTestPrompt(input: { personaBrief: string; scenarioId: SaudiVideoScenarioId; includeProductImage: boolean; includeVoice: boolean }) {
  const scenario = SAUDI_VIDEO_TEST_SCENARIOS.find((item) => item.id === input.scenarioId) ?? SAUDI_VIDEO_TEST_SCENARIOS[0];
  return [
    "Create a premium Saudi commercial video for ecommerce in Riyadh.",
    `Main character reference: ${input.personaBrief} Keep identity, clothing, modesty, face structure, and Gulf/Saudi visual style consistent with the provided image.`,
    input.includeProductImage ? `Product reference: keep the provided product image accurate, visible, and central. Product context: ${scenario.productBrief}.` : `Product context: ${scenario.productBrief}.`,
    "Camera movement: slow cinematic push-in, subtle orbit around the product, natural hand gesture from the presenter, realistic hands, realistic face, premium retail lighting.",
    input.includeVoice ? `Audio: clear Saudi Arabic voiceover in a natural Gulf accent, synchronized with the commercial. Spoken line: ${scenario.voiceLine}` : "No voice requirement unless the model supports audio reliably.",
    "Avoid readable text, Arabic letters inside the generated video, distorted logos, Westernized clothing, unrealistic fingers, face warping, oversexualized styling, or exaggerated claims.",
    "PixVerse v6 settings: enable generated audio, allow one smooth multi-clip camera change, use thinking/auto reasoning when available, and keep the product reference dominant instead of a plain white-background cutout.",
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