export type PlanId = "free" | "starter" | "growth" | "pro" | "business";
export type PaidPlanId = Exclude<PlanId, "free">;

export const VIDEO_CREDIT_COSTS = {
  video_fast: 150,
  video_fast_8s: 240,
  video_lite: 450,
  video_lite_8s: 450,
  video_quality: 1600,
  video_quality_8s: 1600,
} as const;

export type VideoQuality = "fast" | "lite" | "quality";
export type VideoDuration = 5 | 8;

export function videoCreditCost(quality: VideoQuality, duration: VideoDuration = 5) {
  if (quality === "lite") return duration === 8 ? VIDEO_CREDIT_COSTS.video_lite_8s : VIDEO_CREDIT_COSTS.video_lite;
  if (quality === "quality") return duration === 8 ? VIDEO_CREDIT_COSTS.video_quality_8s : VIDEO_CREDIT_COSTS.video_quality;
  return duration === 8 ? VIDEO_CREDIT_COSTS.video_fast_8s : VIDEO_CREDIT_COSTS.video_fast;
}

export const VIDEO_QUALITY_LABELS: Record<VideoQuality, string> = {
  fast: "سريع",
  lite: "إعلاني",
  quality: "احترافي",
};

export type PlanCatalogEntry = {
  id: PlanId;
  name: string;
  tier: "free" | "entry" | "popular" | "premium" | "scale";
  monthlyPriceSar: number;
  yearlyPriceSar: number;
  monthlyCredits: number;
  dailyTextCap: number;
  dailyImageCap: number;
  imageProAllowed: boolean;
  videoFastAllowed: boolean;
  videoQualityAllowed: boolean;
  maxVideoDurationSeconds: VideoDuration;
  tagline: string;
  badge?: string;
};

export const PLAN_CATALOG = [
  {
    id: "free",
    name: "Free",
    tier: "free",
    monthlyPriceSar: 0,
    yearlyPriceSar: 0,
    monthlyCredits: 150,
    dailyTextCap: 10,
    dailyImageCap: 2,
    imageProAllowed: false,
    videoFastAllowed: true,
    videoQualityAllowed: false,
    maxVideoDurationSeconds: 5,
    tagline: "للتجربة الآمنة وبناء أول ذاكرة متجر",
  },
  {
    id: "starter",
    name: "Starter",
    tier: "entry",
    monthlyPriceSar: 149,
    yearlyPriceSar: 1490,
    monthlyCredits: 2000,
    dailyTextCap: 100,
    dailyImageCap: 20,
    imageProAllowed: false,
    videoFastAllowed: true,
    videoQualityAllowed: false,
    maxVideoDurationSeconds: 8,
    tagline: "لبداية فيديو سريع منتظمة بلا تكلفة احترافية",
  },
  {
    id: "growth",
    name: "Growth",
    tier: "popular",
    monthlyPriceSar: 249,
    yearlyPriceSar: 2490,
    monthlyCredits: 6000,
    dailyTextCap: 250,
    dailyImageCap: 50,
    imageProAllowed: true,
    videoFastAllowed: true,
    videoQualityAllowed: false,
    maxVideoDurationSeconds: 8,
    tagline: "الأفضل لمعظم المتاجر النشطة",
    badge: "الأكثر توازناً",
  },
  {
    id: "pro",
    name: "Pro",
    tier: "premium",
    monthlyPriceSar: 399,
    yearlyPriceSar: 3990,
    monthlyCredits: 14000,
    dailyTextCap: 600,
    dailyImageCap: 100,
    imageProAllowed: true,
    videoFastAllowed: true,
    videoQualityAllowed: true,
    maxVideoDurationSeconds: 8,
    tagline: "للمتجر الذي يعتمد الفيديو كقناة نمو",
    badge: "أفضل هامش تشغيل",
  },
  {
    id: "business",
    name: "Business",
    tier: "scale",
    monthlyPriceSar: 999,
    yearlyPriceSar: 9990,
    monthlyCredits: 40000,
    dailyTextCap: 1000,
    dailyImageCap: 150,
    imageProAllowed: true,
    videoFastAllowed: true,
    videoQualityAllowed: true,
    maxVideoDurationSeconds: 8,
    tagline: "للفرق والوكالات الخفيفة متعددة الحملات",
    badge: "للتوسع",
  },
] as const satisfies readonly PlanCatalogEntry[];

export const PLAN_BY_ID = Object.fromEntries(PLAN_CATALOG.map((plan) => [plan.id, plan])) as Record<PlanId, PlanCatalogEntry>;
export const PAID_PLANS = PLAN_CATALOG.filter((plan) => plan.id !== "free") as PlanCatalogEntry[];

export function formatPlanNumber(value: number) {
  return value.toLocaleString("ar-SA");
}

export function estimateVideoCount(credits: number, quality: VideoQuality, duration: VideoDuration = 5) {
  const cost = videoCreditCost(quality, duration);
  return cost > 0 ? Math.floor(credits / cost) : 0;
}