import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/debug-env")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(
          JSON.stringify({
            has_SUPABASE_URL: !!process.env.SUPABASE_URL,
            has_SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            has_SUPABASE_PUBLISHABLE_KEY: !!process.env.SUPABASE_PUBLISHABLE_KEY,
            has_NOTIFY_WEBHOOK_SECRET: !!process.env.NOTIFY_WEBHOOK_SECRET,
            has_TELEGRAM_API_KEY: !!process.env.TELEGRAM_API_KEY,
            has_TELEGRAM_ADMIN_CHAT_ID: !!process.env.TELEGRAM_ADMIN_CHAT_ID,
            has_LOVABLE_API_KEY: !!process.env.LOVABLE_API_KEY,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      },
    },
  },
});
