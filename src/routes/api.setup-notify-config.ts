import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

/**
 * يُستدعى من لوحة الأدمن لتخزين webhook URL + secret في internal_config.
 * التحقق: المستخدم مسجّل دخول وله دور admin في user_roles.
 */
export const Route = createFileRoute("/api/setup-notify-config")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const SUPABASE_URL = process.env.SUPABASE_URL;
          const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
          const NOTIFY_WEBHOOK_SECRET = process.env.NOTIFY_WEBHOOK_SECRET;

          if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
            return jsonError("server misconfigured (supabase env)", 500);
          }
          if (!NOTIFY_WEBHOOK_SECRET) {
            return jsonError("NOTIFY_WEBHOOK_SECRET missing", 500);
          }

          const authHeader = request.headers.get("Authorization") ?? "";
          const token = authHeader.replace(/^Bearer\s+/i, "").trim();
          if (!token) return jsonError("unauthorized: missing token", 401);

          // تحقّق من صحة الـtoken وجلب المستخدم
          const userClient = createClient<Database>(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY,
            { auth: { persistSession: false, autoRefreshToken: false } }
          );
          const { data: userData, error: userErr } =
            await userClient.auth.getUser(token);
          if (userErr || !userData?.user) {
            return jsonError("unauthorized: invalid session", 401);
          }

          // تحقّق من دور admin
          const { data: roleRow } = await supabaseAdmin
            .from("user_roles")
            .select("role")
            .eq("user_id", userData.user.id)
            .eq("role", "admin")
            .maybeSingle();

          if (!roleRow) return jsonError("forbidden: admin only", 403);

          const origin = new URL(request.url).origin;
          const webhookUrl = `${origin}/api/notify-telegram-admin`;

          const { error } = await supabaseAdmin
            .from("internal_config")
            .upsert(
              [
                { key: "notify_webhook_url", value: webhookUrl },
                { key: "notify_webhook_secret", value: NOTIFY_WEBHOOK_SECRET },
              ],
              { onConflict: "key" }
            );

          if (error) {
            console.error("setup-notify-config upsert error:", error);
            return jsonError(error.message, 500);
          }

          return new Response(
            JSON.stringify({ ok: true, webhookUrl }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (error) {
          console.error("setup-notify-config error:", error);
          return jsonError(
            error instanceof Error ? error.message : "unknown",
            500
          );
        }
      },
    },
  },
});

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
