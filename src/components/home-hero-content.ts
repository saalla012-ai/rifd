export const HERO_EXPERIMENT = "hero_hook" as const;

export const HERO_HOOKS = {
  A: {
    eyebrow: "بدل ما يضيع يومك على المحتوى",
    promiseLead: "أعطنا وصفاً سريعاً",
    promiseEnd: "والباقي على رِفد",
    outputs: ["منشور", "صورة", "زاوية ريلز"],
  },
  B: {
    eyebrow: "خلّ عرضك يبان من أول نظرة",
    promiseLead: "أعطنا وصفاً سريعاً",
    promiseEnd: "ونطلع لك عرضاً يبيع",
    outputs: ["محتوى", "صورة", "ريلز"],
  },
} as const;

export const QUICK_TYPES = [
  { id: "perfumes", label: "🌸 عطور" },
  { id: "fashion", label: "👗 أزياء" },
  { id: "food", label: "🍫 شوكولاتة" },
] as const;

export const HERO_BENEFITS = [
  { icon: "🇸🇦", title: "عامية أصيلة", sub: "ما تحس إنه مترجم" },
  { icon: "📦", title: "حزمة أولية", sub: "منشور + صورة + ريلز" },
  { icon: "⚡", title: "ثوانٍ معدودة", sub: "نتيجة أقرب للتنفيذ" },
  { icon: "🧠", title: "ذاكرة متجر", sub: "كل مرة أذكى من قبل" },
] as const;