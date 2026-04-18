import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * نقطة إعداد لمرة واحدة: يستدعيها الأدمن لتخزين webhook URL + secret
 * في جدول internal_config (يستخدمها DB trigger).
 *
 * تتطلّب نفس secret الذي يحمي notify-telegram-admin للأمان.
 */
export const Route = createFileRoute("/api/setup-notify-config")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const expectedSecret = process.env.NOTIFY_WEBHOOK_SECRET;
          if (!expectedSecret) {
            return new Response(
              JSON.stringify({ error: "NOTIFY_WEBHOOK_SECRET missing" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          const provided = request.headers.get("x-webhook-secret");
          if (provided !== expectedSecret) {
            return new Response(JSON.stringify({ error: "unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          // نأخذ origin الحالي ونبني URL الإشعار
          const origin = new URL(request.url).origin;
          const webhookUrl = `${origin}/api/notify-telegram-admin`;

          const rows = [
            { key: "notify_webhook_url", value: webhookUrl },
            { key: "notify_webhook_secret", value: expectedSecret },
          ];

          const { error } = await supabaseAdmin
            .from("internal_config")
            .upsert(rows, { onConflict: "key" });

          if (error) {
            console.error("setup-notify-config upsert error:", error);
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          return new Response(
            JSON.stringify({ ok: true, webhookUrl }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (error) {
          console.error("setup-notify-config error:", error);
          return new Response(
            JSON.stringify({
              error: error instanceof Error ? error.message : "unknown",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
