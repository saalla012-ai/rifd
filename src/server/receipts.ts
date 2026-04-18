import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * توليد signed URL لعرض إيصال التحويل البنكي.
 *
 * - المستخدم العادي: يستطيع توليد URL لإيصاله الشخصي فقط (مسار يبدأ بـ user_id الخاص به)
 * - الأدمن: يستطيع توليد URL لأي إيصال
 * - مدة الصلاحية: 5 دقائق فقط (300 ثانية) لأن الإيصال يحتوي بيانات بنكية حساسة
 */
export const getReceiptSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      path: z
        .string()
        .min(1)
        .max(500)
        // مسار آمن: user_id/filename — لا يحتوي على .. أو أحرف خطرة
        .regex(/^[a-f0-9-]+\/[a-zA-Z0-9._-]+$/i, "Invalid receipt path"),
    }).parse
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;

    // التحقق من الصلاحية:
    // 1. إذا كان المسار يبدأ بـ user_id المستخدم → مسموح
    // 2. وإلا → التحقق من دور admin
    const pathOwnerId = data.path.split("/")[0];
    const isOwner = pathOwnerId === userId;

    if (!isOwner) {
      // التحقق من دور admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        throw new Response("Forbidden: Not authorized to view this receipt", {
          status: 403,
        });
      }
    }

    // توليد signed URL باستخدام service role (bucket خاص)
    const { data: signedData, error } = await supabaseAdmin.storage
      .from("payment-receipts")
      .createSignedUrl(data.path, 300); // 5 دقائق

    if (error || !signedData?.signedUrl) {
      throw new Response(`Failed to generate signed URL: ${error?.message ?? "unknown"}`, {
        status: 500,
      });
    }

    return {
      url: signedData.signedUrl,
      expiresIn: 300,
    };
  });
