import type { CampaignPack } from "@/server/campaign-packs";

const goalLabel: Record<CampaignPack["goal"], string> = {
  launch: "إطلاق منتج",
  clearance: "تصفية المخزون",
  upsell: "زيادة قيمة السلة",
  leads: "بناء قاعدة عملاء",
  competitive: "مواجهة المنافسين",
  winback: "إعادة الاستهداف",
};

export function campaignSmartPrompt(campaign: CampaignPack, kind: "text" | "image" | "video") {
  const base = [
    `المنتج: ${campaign.product}`,
    `هدف الحملة: ${goalLabel[campaign.goal]}`,
    `الجمهور: ${campaign.audience}`,
    `العرض: ${campaign.offer}`,
    `القناة: ${campaign.channel}`,
    campaign.brief ? `ملخص الحملة:\n${campaign.brief}` : "",
  ].filter(Boolean).join("\n");

  if (kind === "text") return [base, campaign.text_prompt, "اكتب نصاً يبيع بصياغة سعودية واضحة: هوك، فائدة، عرض، ودعوة إجراء مباشرة."].filter(Boolean).join("\n\n");
  if (kind === "image") return [base, campaign.image_prompt, "صمّم صورة إعلان للمنتج: المنتج واضح، مساحة للنص العربي، العرض ظاهر بدون مبالغة، ومناسبة للقناة المختارة."].filter(Boolean).join("\n\n");
  return [base, campaign.video_prompt, "حوّلها إلى فيديو قصير: أول ثانيتين تشد الانتباه، المنتج واضح، حركة بسيطة، ونهاية بدعوة إجراء."].filter(Boolean).join("\n\n");
}

export function campaignTextTemplate(campaign: CampaignPack) {
  if (campaign.channel === "snapchat") return "snap-ad-copy";
  if (campaign.channel === "tiktok") return "tiktok-ad-script";
  if (campaign.channel === "whatsapp") return "whatsapp-reply";
  if (campaign.goal === "launch") return "ig-post-launch";
  return "meta-ad-copy";
}

export function campaignImageTemplate(campaign: CampaignPack) {
  if (campaign.goal === "launch") return "img-ig-story-launch";
  if (campaign.channel === "instagram") return "img-meta-ad";
  return "img-white-friday";
}

export function campaignVideoDefaults(campaign: CampaignPack) {
  return {
    aspectRatio: campaign.channel === "whatsapp" ? "1:1" as const : "9:16" as const,
    selectedPersonaId: campaign.audience.includes("الفخامة") ? "male-premium" : campaign.audience.includes("الأمهات") ? "female-abaya" : "male-young",
    templateId: campaign.product.includes("عطر") ? "perfume-premium-hook" : campaign.product.includes("قهوة") ? "coffee-hospitality" : campaign.product.includes("عباية") ? "abaya-launch" : "electronics-benefit",
  };
}

export function campaignEditPreset(campaign: CampaignPack) {
  if (campaign.goal === "launch" || campaign.audience.includes("الفخامة")) return "luxury-bg";
  if (campaign.channel === "instagram" || campaign.channel === "snapchat") return "instagram-square";
  if (campaign.goal === "clearance") return "add-text";
  return "enhance";
}