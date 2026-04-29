import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertAdmin, type DbClient } from "@/server/admin-auth";
import type { Database } from "@/integrations/supabase/types";

type CampaignPackRow = Database["public"]["Tables"]["campaign_packs"]["Row"];
type CampaignGoal = "launch" | "clearance" | "upsell" | "leads" | "competitive" | "winback";
type CampaignChannel = "instagram" | "snapchat" | "tiktok" | "whatsapp";
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

export type AdminCampaignPack = CampaignPack & {
  user_email: string | null;
  user_store: string | null;
};

const packSchema = z.object({
  id: z.string().uuid().optional(),
  product: z.string().max(500).default(""),
  audience: z.string().max(500).default(""),
  offer: z.string().max(500).default(""),
  goal: z.enum(["launch", "clearance", "upsell", "leads", "competitive", "winback"]),
  channel: z.enum(["instagram", "snapchat", "tiktok", "whatsapp"]),
  status: z.enum(["draft", "generated", "archived"]).default("draft"),
  brief: z.string().max(5000),
  textPrompt: z.string().max(5000),
  imagePrompt: z.string().max(3000),
  videoPrompt: z.string().max(3000),
  productImagePath: z.string().max(1000).nullable().optional(),
});

const listSchema = z.object({
  status: z.enum(["active", "draft", "generated", "archived", "all"]).default("active"),
  limit: z.number().int().min(1).max(100).default(20),
});

const adminListSchema = z.object({
  status: z.enum(["all", "draft", "generated", "archived"]).default("all"),
  limit: z.number().int().min(1).max(300).default(150),
});

function mapPack(row: CampaignPackRow): CampaignPack {
  return row as CampaignPack;
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
      { total: 0, draft: 0, generated: 0, archived: 0 } as Record<CampaignStatus | "total", number>
    );

    return {
      stats,
      packs: packs.map((pack): AdminCampaignPack => {
        const profile = profileMap.get(pack.user_id);
        return { ...pack, user_email: profile?.email ?? null, user_store: profile?.store_name ?? null };
      }),
    };
  });
