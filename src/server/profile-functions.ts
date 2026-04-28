import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const phoneSchema = z.object({
  whatsapp: z.string().trim().regex(/^9665\d{8}$/),
});

export const checkWhatsappAvailability = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => phoneSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: existing, error } = await context.supabase
      .from("profiles")
      .select("id")
      .eq("whatsapp", data.whatsapp)
      .neq("id", context.userId)
      .maybeSingle();

    if (error) throw new Error("تعذر التحقق من رقم واتساب حالياً");

    return { available: !existing };
  });