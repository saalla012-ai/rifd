import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertAdmin, type DbClient } from "@/server/admin-auth";
import { chatCompleteStructured } from "@/server/lovable-ai";
import type { Database } from "@/integrations/supabase/types";

type CampaignPackRow = Database["public"]["Tables"]["campaign_packs"]["Row"];
type CampaignGoal = "launch" | "clearance" | "upsell" | "leads" | "competitive" | "winback";
type CampaignChannel = "instagram" | "snapchat" | "tiktok" | "whatsapp";
type CampaignStudioChannel = CampaignChannel | "email" | "all";
type CampaignStatus = "draft" | "generated" | "archived";

export type CampaignPack = {
  id: string;
  user_id: string;
  product: string;
  audience: string;
  offer: string;
  goal: CampaignGoal;
  channel: CampaignChannel;
  status: CampaignStatus;
  brief: string;
  text_prompt: string;
  image_prompt: string;
  video_prompt: string;
  product_image_path: string | null;
  created_at: string;
  updated_at: string;
};

export type CampaignBrief = {
  campaignName: string;
  corePromise: string;
  marketingMessage: string;
  hook: string;
  cta: string;
  strategyAngle: string;
  textPrompt: string;
  imagePrompt: string;
  videoPrompt: string;
};

export type AdminCampaignPack = CampaignPack & {
  user_email: string | null;
  user_store: string | null;
};

const goals = ["launch", "clearance", "upsell", "leads", "competitive", "winback"] as const;
const dbChannels = ["instagram", "snapchat", "tiktok", "whatsapp"] as const;
const studioChannels = ["instagram", "snapchat", "tiktok", "whatsapp", "email", "all"] as const;

const packSchema = z.object({
  id: z.string().uuid().optional(),
  product: z.string().max(500).default(""),
  audience: z.string().max(500).default(""),
  offer: z.string().max(500).default(""),
  goal: z.enum(goals),
  channel: z.enum(dbChannels),
  status: z.enum(["draft", "generated", "archived"]).default("draft"),
  brief: z.string().max(5000),
  textPrompt: z.string().max(5000),
  imagePrompt: z.string().max(3000),
  videoPrompt: z.string().max(3000),
  productImagePath: z.string().max(1000).nullable().optional(),
});

const generateBriefSchema = z.object({
  campaignId: z.string().uuid().optional(),
  product: z.string().trim().max(500).default(""),
  audience: z.string().trim().max(500).default(""),
  audienceLabel: z.string().trim().max(120).default(""),
  offer: z.string().trim().max(500).default(""),
  offerLabel: z.string().trim().max(120).default(""),
  goal: z.enum(goals),
  channel: z.enum(studioChannels),
  channelLabel: z.string().trim().max(120).default(""),
  occasion: z.string().trim().max(120).default("بدون مناسبة"),
  customerStage: z.string().trim().max(160).default("عملاء جدد أول مرة يسمعون عنا"),
  productImagePath: z.string().max(1000).nullable().optional(),
});

const briefSchema = z.object({
  campaignName: z.string().min(2).max(90),
  corePromise: z.string().min(5).max(220),
  marketingMessage: z.string().min(10).max(500),
  hook: z.string().min(3).max(180),
  cta: z.string().min(2).max(80),
  strategyAngle: z.string().min(5).max(220),
  textPrompt: z.string().min(10).max(5000),
  imagePrompt: z.string().min(10).max(3000),
  videoPrompt: z.string().min(10).max(3000),
});

const listSchema = z.object({
  status: z.enum(["active", "draft", "generated", "archived", "all"]).default("active"),
  limit: z.number().int().min(1).max(100).default(20),
});

const adminListSchema = z.object({
  status: z.enum(["all", "draft", "generated", "archived"]).default("all"),
  limit: z.number().int().min(1).max(300).default(150),
});

const goalAngles: Record<CampaignGoal, string> = {
  launch: "الفضول + أول تجربة",
  clearance: "الفرصة الأخيرة",
  upsell: "قيمة أكبر مقابل سعر أفضل",
  leads: "مغناطيس القيمة",
  competitive: "التميز والثقة بدون لغة عدائية",
  winback: "اشتقنا لك + عرض حصري",
};

function mapPack(row: CampaignPackRow): CampaignPack {
  return row as CampaignPack;
}

function toDbChannel(channel: CampaignStudioChannel): CampaignChannel {
  return dbChannels.includes(channel as CampaignChannel) ? (channel as CampaignChannel) : "instagram";
}

function trimTo(value: string, max: number) {
  return value.length > max ? value.slice(0, max) : value;
}

function formatBrief(input: z.infer<typeof generateBriefSchema>, brief: CampaignBrief) {
  return trimTo(
    [
      `اسم الحملة: ${brief.campaignName}`,
      `الهدف: ${input.goal}`,
      `الزاوية: ${brief.strategyAngle}`,
      `المنتج: ${input.product || "غير محدد"}`,
      `الجمهور: ${input.audienceLabel || input.audience || "غير محدد"}`,
      `العرض: ${input.offerLabel || input.offer || "غير محدد"}`,
      `القناة: ${input.channelLabel || input.channel}`,
      `المناسبة: ${input.occasion}`,
      `مرحلة العميل: ${input.customerStage}`,
      `الوعد الأساسي: ${brief.corePromise}`,
      `الرسالة التسويقية: ${brief.marketingMessage}`,
      `Hook: ${brief.hook}`,
      `CTA: ${brief.cta}`,
    ].join("\n"),
    5000,
  );
}

export const listCampaignPacks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => listSchema.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    let query = supabase
      .from("campaign_packs")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(data.limit);

    if (data.status === "active") query = query.neq("status", "archived");
    else if (data.status !== "all") query = query.eq("status", data.status);

    const { data: rows, error } = await query;
    if (error) throw new Error(`فشل تحميل حزم الحملات: ${error.message}`);
    return { packs: ((rows ?? []) as CampaignPackRow[]).map(mapPack) };
  });

export const saveCampaignPack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => packSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    const payload = {
      user_id: userId,
      product: data.product,
      audience: data.audience,
      offer: data.offer,
      goal: data.goal,
      channel: data.channel,
      status: data.status,
      brief: data.brief,
      text_prompt: data.textPrompt,
      image_prompt: data.imagePrompt,
      video_prompt: data.videoPrompt,
      product_image_path: data.productImagePath ?? null,
    };

    const table = supabase.from("campaign_packs");
    const query = data.id
      ? table.update(payload).eq("id", data.id).eq("user_id", userId).select("*").single()
      : table.insert(payload).select("*").single();

    const { data: row, error } = await query;
    if (error || !row) throw new Error(`فشل حفظ حزمة الحملة: ${error?.message ?? "استجابة فارغة"}`);
    return { pack: mapPack(row as CampaignPackRow) };
  });

export const generateCampaignBrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => generateBriefSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    const { object } = await chatCompleteStructured<CampaignBrief>({
      model: "google/gemini-3-flash-preview",
      temperature: 0.55,
      tool: {
        name: "build_campaign_brief",
        description: "يبني خطة حملة تسويقية منظمة لتاجر سعودي باللغة العربية.",
        parameters: {
          type: "object",
          properties: {
            campaignName: { type: "string" },
            corePromise: { type: "string" },
            marketingMessage: { type: "string" },
            hook: { type: "string" },
            cta: { type: "string" },
            strategyAngle: { type: "string" },
            textPrompt: { type: "string" },
            imagePrompt: { type: "string" },
            videoPrompt: { type: "string" },
          },
          required: ["campaignName", "corePromise", "marketingMessage", "hook", "cta", "strategyAngle", "textPrompt", "imagePrompt", "videoPrompt"],
        },
      },
      messages: [
        {
          role: "system",
          content:
            "أنت خبير تسويق سعودي للتجارة الإلكترونية وSaaS. اكتب بالعربية الواضحة مع لمسة عامية سعودية خفيفة. لا تستخدم مبالغات غير قابلة للتصديق ولا لغة عدائية ضد المنافسين. أخرج خطة عملية مختصرة ومناسبة لتاجر سعودي.",
        },
        {
          role: "user",
          content: [
            `هدف الحملة: ${data.goal}`,
            `الزاوية الاستراتيجية الملزمة: ${goalAngles[data.goal]}`,
            `اسم المنتج: ${data.product || "منتج متجر إلكتروني"}`,
            `الجمهور: ${data.audienceLabel || data.audience || "عملاء سعوديون"}`,
            `العرض: ${data.offerLabel || data.offer || "عرض واضح ومقنع"}`,
            `قناة النشر: ${data.channelLabel || data.channel}`,
            `مناسبة الحملة: ${data.occasion}`,
            `مرحلة العميل: ${data.customerStage}`,
            "المطلوب: اسم حملة، وعد أساسي، رسالة تسويقية، Hook، CTA، prompt للنص، prompt للصورة، prompt للفيديو. اجعل المخرجات سهلة التنفيذ داخل أدوات النص والصورة والفيديو.",
          ].join("\n"),
        },
      ],
    });

    const brief = briefSchema.parse(object);
    const briefText = formatBrief(data, brief);
    const payload = {
      user_id: userId,
      product: data.product,
      audience: data.audienceLabel || data.audience,
      offer: data.offerLabel || data.offer,
      goal: data.goal,
      channel: toDbChannel(data.channel),
      status: "generated" as CampaignStatus,
      brief: briefText,
      text_prompt: trimTo(brief.textPrompt, 5000),
      image_prompt: trimTo(brief.imagePrompt, 3000),
      video_prompt: trimTo(brief.videoPrompt, 3000),
      product_image_path: data.productImagePath ?? null,
    };

    const table = supabase.from("campaign_packs");
    const query = data.campaignId
      ? table.update(payload).eq("id", data.campaignId).eq("user_id", userId).select("*").single()
      : table.insert(payload).select("*").single();

    const { data: row, error } = await query;
    if (error || !row) throw new Error(`فشل حفظ خطة الحملة: ${error?.message ?? "استجابة فارغة"}`);
    return { brief, pack: mapPack(row as CampaignPackRow) };
  });

export const archiveCampaignPack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    const { error } = await supabase
      .from("campaign_packs")
      .update({ status: "archived" })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(`فشل أرشفة الحملة: ${error.message}`);
    return { success: true };
  });

export const listAdminCampaignPacks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => adminListSchema.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: DbClient; userId: string };
    await assertAdmin(supabase, userId);

    let query = supabaseAdmin
      .from("campaign_packs")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(data.limit);
    if (data.status !== "all") query = query.eq("status", data.status);

    const { data: rows, error } = await query;
    if (error) throw new Error(`فشل تحميل حملات العملاء: ${error.message}`);

    const packs = ((rows ?? []) as CampaignPackRow[]).map(mapPack);
    const userIds = Array.from(new Set(packs.map((p) => p.user_id)));
    const { data: profiles } = userIds.length
      ? await supabaseAdmin.from("profiles").select("id, email, store_name").in("id", userIds)
      : { data: [] as Array<{ id: string; email: string | null; store_name: string | null }> };
    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

    const stats = packs.reduce(
      (acc, pack) => {
        acc.total += 1;
        acc[pack.status] += 1;
        return acc;
      },
      { total: 0, draft: 0, generated: 0, archived: 0 } as Record<CampaignStatus | "total", number>,
    );

    return {
      stats,
      packs: packs.map((pack): AdminCampaignPack => {
        const profile = profileMap.get(pack.user_id);
        return { ...pack, user_email: profile?.email ?? null, user_store: profile?.store_name ?? null };
      }),
    };
  });
