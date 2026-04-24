/**
 * Credits Layer (Phase 2)
 * ─────────────────────────────────────────────────────────────
 * مصدر الحقيقة الوحيد لتكلفة النقاط في كل النظام.
 * كل دوال التوليد تمر من هنا → consume → عمل AI → refund عند الفشل.
 *
 * ⚠️ غيّر الأرقام هنا فقط — لا تكرّرها في ملفات أخرى.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type DbClient = SupabaseClient<Database>;

// ============================================================
// تكلفة النقاط (مصدر الحقيقة)
// ============================================================
export const CREDIT_COSTS = {
  image_flash: 10,
  image_pro: 25,
  video_fast: 300,
  video_quality: 900,
} as const;

export type ImageQuality = "flash" | "pro";
export type VideoQuality = "fast" | "quality";

export function imageCost(q: ImageQuality): number {
  return q === "pro" ? CREDIT_COSTS.image_pro : CREDIT_COSTS.image_flash;
}

export function videoCost(q: VideoQuality): number {
  return q === "quality" ? CREDIT_COSTS.video_quality : CREDIT_COSTS.video_fast;
}

// ============================================================
// رسائل أخطاء عربية موحَّدة (يفهمها العميل ويعرض CTA مناسب)
// ============================================================
export class InsufficientCreditsError extends Error {
  required: number;
  constructor(required: number) {
    super(`insufficient_credits: required=${required}`);
    this.name = "InsufficientCreditsError";
    this.required = required;
  }
}

export class TextQuotaExceededError extends Error {
  used: number;
  cap: number;
  constructor(used: number, cap: number) {
    super(`text_quota_exceeded: used=${used} cap=${cap}`);
    this.name = "TextQuotaExceededError";
    this.used = used;
    this.cap = cap;
  }
}

// ============================================================
// Helpers يستدعيها ai-functions داخل handler واحد
// ============================================================

/**
 * يستهلك نقاط من المحفظة (plan أولاً ثم topup).
 * يُرجع `ledgerId` لاستخدامه في refund لاحقاً.
 * يرفع `InsufficientCreditsError` إذا الرصيد لا يكفي.
 */
export async function consume(
  db: DbClient,
  amount: number,
  txnType: "consume_image" | "consume_video",
  metadata: Record<string, unknown> = {}
): Promise<{ ledgerId: string; remainingTotal: number; remainingPlan: number; remainingTopup: number }> {
  const { data, error } = await db.rpc("consume_credits", {
    _amount: amount,
    _txn_type: txnType,
    _metadata: metadata as never,
  });

  if (error) {
    if (/insufficient_credits/i.test(error.message)) {
      throw new InsufficientCreditsError(amount);
    }
    throw new Error(`فشل خصم النقاط: ${error.message}`);
  }

  const row = (data as Array<{
    ledger_id: string;
    remaining_total: number;
    remaining_plan: number;
    remaining_topup: number;
  }>)?.[0];

  if (!row) throw new Error("فشل خصم النقاط: استجابة فارغة");

  return {
    ledgerId: row.ledger_id,
    remainingTotal: row.remaining_total,
    remainingPlan: row.remaining_plan,
    remainingTopup: row.remaining_topup,
  };
}

/**
 * يرجّع نقاط استُهلكت سابقاً (عند فشل التوليد بعد الخصم).
 * idempotent: لا يعيد المبلغ مرتين.
 */
export async function refund(
  db: DbClient,
  ledgerId: string,
  reason = "generation_failed"
): Promise<void> {
  const { error } = await db.rpc("refund_credits", {
    _ledger_id: ledgerId,
    _reason: reason,
  });
  if (error) {
    if (/already_refunded/i.test(error.message)) return;
    // لا نرفع — فشل الـrefund لا يجب أن يحجب رسالة الخطأ الأصلية للعميل
    console.error(`refund_credits failed: ${error.message}`);
  }
}

/**
 * يستهلك نقطة واحدة من حصة النص اليومية (200/يوم).
 * النصوص لا تخصم نقاط — تستخدم عدّاد منفصل.
 */
export async function consumeTextQuota(db: DbClient): Promise<{ used: number; cap: number }> {
  const { data, error } = await db.rpc("consume_text_quota");
  if (error) throw new Error(`فشل التحقق من الحصة: ${error.message}`);

  const row = (data as Array<{ allowed: boolean; used: number; daily_cap: number }>)?.[0];
  if (!row) throw new Error("استجابة فارغة من الحصة");

  if (!row.allowed) throw new TextQuotaExceededError(row.used, row.daily_cap);
  return { used: row.used, cap: row.daily_cap };
}

// ============================================================
// Server Function: ملخص النقاط للواجهة (شريط الرصيد)
// ============================================================
export const getCreditsSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context as { supabase: DbClient };
    const { data, error } = await supabase.rpc("get_user_credits_summary");
    if (error) throw new Error(`فشل جلب الرصيد: ${error.message}`);

    const row = (data as Array<{
      plan_credits: number;
      topup_credits: number;
      total_credits: number;
      cycle_ends_at: string | null;
      daily_text_used: number;
      daily_text_cap: number;
      daily_image_used: number;
      daily_image_cap: number;
      plan: "free" | "starter" | "growth" | "pro" | "business";
    }>)?.[0];

    if (!row) {
      return {
        planCredits: 0,
        topupCredits: 0,
        totalCredits: 0,
        cycleEndsAt: null,
        dailyTextUsed: 0,
        dailyTextCap: 200,
        dailyImageUsed: 0,
        dailyImageCap: 50,
        plan: "free" as const,
        costs: CREDIT_COSTS,
      };
    }

    return {
      planCredits: row.plan_credits,
      topupCredits: row.topup_credits,
      totalCredits: row.total_credits,
      cycleEndsAt: row.cycle_ends_at,
      dailyTextUsed: row.daily_text_used,
      dailyTextCap: row.daily_text_cap,
      dailyImageUsed: row.daily_image_used,
      dailyImageCap: row.daily_image_cap,
      plan: row.plan,
      costs: CREDIT_COSTS,
    };
  });

// ============================================================
// Server Function: قائمة باقات النقاط الإضافية (للعرض)
// ============================================================
export const listTopupPackages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context as { supabase: DbClient };
    const { data, error } = await supabase
      .from("topup_packages")
      .select("id, display_name, credits, price_sar, display_order")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) throw new Error(`فشل جلب الباقات: ${error.message}`);
    return { packages: data ?? [] };
  });
