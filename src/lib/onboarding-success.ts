type PackTone = "fun" | "pro" | "luxury" | "friendly";

type PackInput = {
  storeName: string;
  productTypeLabel: string;
  audienceLabel: string;
  tone: PackTone | string;
  primaryPost: string;
};

export type SuccessPack = {
  primaryPost: string;
  hooks: string[];
  cta: string;
  hashtags: string[];
  imageIdea: string;
  imagePrompt: string;
  reelIdea: string;
  secondPostIdea: string;
  storySequence: string[];
  whyItFits: string;
  campaignAngle: string;
  firstWin: string;
  nextMove: string;
  quickChecklist: string[];
  campaignSequence: Array<{ title: string; detail: string }>;
  launchActions: string[];
};

const TONE_COPY: Record<string, { adjective: string; cta: string }> = {
  fun: { adjective: "خفيفة وحيوية", cta: "جرّب الآن قبل نفاد الكمية" },
  pro: { adjective: "احترافية وواثقة", cta: "اطلب الآن واستفد من القيمة مباشرة" },
  luxury: { adjective: "فخمة وراقية", cta: "اطلب الآن واختبر الفرق من أول تجربة" },
  friendly: { adjective: "ودودة وقريبة", cta: "اطلب اليوم وخلك من أوائل المستفيدين" },
};

function slugifyArabic(text: string) {
  return text
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\u0000-\u007F\u0600-\u06FF_]+/g, "");
}

function inferMarketAngle(productTypeLabel: string, audienceLabel: string) {
  const sector = productTypeLabel.toLowerCase();

  if (sector.includes("عطر") || sector.includes("perfume") || sector.includes("beauty")) {
    return {
      campaignAngle: `التركيز هنا يجب أن يكون على الإحساس والانطباع الأول والثقة في الاختيار لدى ${audienceLabel}، لا على الوصف العام فقط.`,
      firstWin: "أول مكسب لك: الخطاب خرج أقرب للفخامة والتجربة من كونه عرضاً عاماً بارداً.",
      nextMove: "أفضل خطوة تالية: ثبّت هذه الزاوية في الصورة ثم حوّلها إلى Reel قصير يبرز الإحساس قبل تفاصيل السعر.",
    };
  }

  if (sector.includes("عباية") || sector.includes("fashion") || sector.includes("أزياء")) {
    return {
      campaignAngle: `الزاوية البيعية الأقوى هنا هي ربط ${productTypeLabel} بالاستخدام اليومي والشكل النهائي على ${audienceLabel} بدل الاكتفاء بوصف الخامة فقط.`,
      firstWin: "أول مكسب لك: المحتوى خرج أقرب لمشهد الارتداء الحقيقي لا مجرد مواصفات جامدة.",
      nextMove: "أفضل خطوة تالية: حوّل المنشور إلى Carousel أو Reel يقارن بين الإطلالة والاستخدام والمقاس المناسب.",
    };
  }

  if (sector.includes("هد") || sector.includes("gift") || sector.includes("sweet") || sector.includes("coffee")) {
    return {
      campaignAngle: `العامل الحاسم هنا هو مناسبة الشراء واللحظة الاجتماعية؛ لذلك بُنيت الرسالة لتقرب ${productTypeLabel} من قرار الإهداء أو الضيافة عند ${audienceLabel}.`,
      firstWin: "أول مكسب لك: صار عندك محتوى يبيع المناسبة نفسها لا المنتج فقط.",
      nextMove: "أفضل خطوة تالية: أنشئ نسخة ثانية من المنشور مرتبطة بمناسبة محددة مثل هدية أو زيارة أو إطلاق جديد.",
    };
  }

  return {
    campaignAngle: `بُنيت هذه الزاوية لتربط ${productTypeLabel} بدافع شراء مفهوم لدى ${audienceLabel} بحيث لا يظهر المحتوى عاماً أو قابلاً للنسخ لأي متجر آخر.`,
    firstWin: "أول مكسب لك: النتيجة خرجت بخطاب أوضح من النصوص العامة وأقرب لاستخدام فعلي في متجرك.",
    nextMove: "أفضل خطوة تالية: ثبّت نفس الزاوية البيعية في الصورة والريلز حتى تبدو الحملة متماسكة من أول لمسة.",
  };
}

export function buildSuccessPack({
  storeName,
  productTypeLabel,
  audienceLabel,
  tone,
  primaryPost,
}: PackInput): SuccessPack {
  const toneCopy = TONE_COPY[tone] ?? TONE_COPY.pro;
  const marketAngle = inferMarketAngle(productTypeLabel, audienceLabel);

  return {
    primaryPost,
    hooks: [
      `${productTypeLabel} يليق بذوق ${audienceLabel} — بدون لف ودوران.`,
      `${storeName} يقدّم ${productTypeLabel} بصياغة ${toneCopy.adjective} جاهزة للنشر.`,
      `لو تبغى محتوى يبيع فعلاً، هذه البداية المناسبة لـ${storeName}.`,
    ],
    cta: toneCopy.cta,
    hashtags: [`#${slugifyArabic(storeName)}`, `#${slugifyArabic(productTypeLabel)}`, "#متاجر_سعودية"],
    imageIdea: `صورة بطولية لمنتج من ${productTypeLabel} بإضاءة احترافية، ألوان العلامة، ومساحة واضحة لعنوان العرض واسم ${storeName}.`,
    imagePrompt: `أنشئ صورة إعلان عمودية لـ ${storeName} لمنتج من ${productTypeLabel} بأسلوب ${toneCopy.adjective}، مع تركيز واضح على الوعد الأساسي، وتكوين أنيق مناسب لجمهور ${audienceLabel} ومساحة عنوان عربية واضحة.`,
    reelIdea: `ريل قصير من 3 لقطات: لقطة جذب سريعة، إبراز الفائدة الأساسية لمنتج ${productTypeLabel}، ثم CTA نهائي موجّه إلى ${audienceLabel}.`,
    secondPostIdea: `منشور متابعة يثبت نفس زاوية الحملة لكن من اعتراض مختلف: لماذا ${productTypeLabel} مناسب لـ${audienceLabel} الآن تحديداً، مع مثال استخدام أو مناسبة شراء أوضح.`,
    storySequence: [
      `ستوري 1: هوك سريع يبرز الوعد الأساسي لـ${productTypeLabel}.`,
      `ستوري 2: صورة أو لقطة مقرّبة تعزّز الثقة وتوضح الفائدة بشكل مباشر.`,
      `ستوري 3: CTA مختصر يدفع ${audienceLabel} إلى الطلب أو الاستفسار فوراً.`,
    ],
    whyItFits: `بُني هذا الناتج على نوع متجرك (${productTypeLabel})، والجمهور المستهدف (${audienceLabel})، ونبرة العلامة ${toneCopy.adjective} حتى يظهر المحتوى وكأنه مكتوب خصيصاً لـ${storeName}.`,
    campaignAngle: marketAngle.campaignAngle,
    firstWin: marketAngle.firstWin,
    nextMove: marketAngle.nextMove,
    quickChecklist: [
      "ثبّت وعداً واحداً واضحاً في أول سطر بدلاً من حشد أكثر من فكرة داخل المنشور.",
      `ولّد الصورة أولاً من نفس الزاوية البيعية لـ${productTypeLabel} حتى تبدو الحملة مترابطة بصرياً من أول أصل.`,
      "احتفظ بالـ CTA الحالي كنقطة إغلاق أولى ثم اختبر نسخة ثانية بعد أول نشر.",
    ],
    campaignSequence: [
      {
        title: "Hook",
        detail: `ابدأ بالهوك الأقرب لـ${audienceLabel} ثم افتح مباشرة على الوعد الأساسي دون مقدمات طويلة.`,
      },
      {
        title: "Visual",
        detail: `اربط الصورة أو أول لقطة Reel بنفس الانطباع الذي يريد ${storeName} تثبيته حول ${productTypeLabel}.`,
      },
      {
        title: "Conversion",
        detail: `اختم بنفس CTA الحالي أولاً، ثم راقب التفاعل قبل توسيع العرض أو تغيير الرسالة.`,
      },
    ],
    launchActions: [
      "انسخ المنشور كما هو كنقطة انطلاق، ثم عدّل فقط ما يخص المنتج أو العرض الحالي.",
      "ولّد صورة واحدة فوراً من نفس الزاوية البيعية قبل كتابة نسخة ثانية مختلفة حتى لا تتشتت الحملة.",
      "بعد النشر الأول، استخدم نفس الزاوية لعمل Reel قصير بدل البدء من فكرة جديدة تماماً.",
    ],
  };
}
