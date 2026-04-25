import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type DbClient = SupabaseClient<Database>;

export async function assertAdmin(db: DbClient, userId: string): Promise<void> {
  const { data, error } = await db.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });

  if (error) {
    console.error("Admin role verification failed", { userId, message: error.message });
    throw new Error("تعذر التحقق من الصلاحيات حالياً");
  }
  if (data !== true) throw new Error("هذه الصفحة للأدمن فقط");
}
