import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import * as React from "react";
import { render } from "@react-email/components";
import { TEMPLATES } from "@/lib/email-templates/registry";

const SITE_NAME = "رِفد";
const SENDER_DOMAIN = "notify.rifd.club";
const FROM_DOMAIN = "notify.rifd.club";

/**
 * Cron-triggered route — يُرسل رسائل onboarding للمستخدمين الجدد.
 *   - welcome: لكل من سجّل خلال آخر 24 ساعة ولم يستلم welcome بعد.
 *   - onboarding-tip-day3: لمن سجّل قبل 3 أيام (±12h) ولم يكمل onboarded.
 *
 * فحص idempotency عبر email_send_log (message_id فريد) + suppression list.
 * يُستدعى يومياً عبر pg_cron — متجاوز لـmiddleware لأنه تحت /hooks/.
 */
export const Route = createFileRoute("/hooks/onboarding-emails")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !serviceKey) {
          return Response.json(
            { error: "Server configuration error" },
            { status: 500 },
          );
        }

        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createClient<any>(supabaseUrl, serviceKey);
        const now = new Date();
        const results: Array<{
          userId: string;
          email: string;
          bucket: string;
          status: string;
        }> = [];

        // ============== Bucket 1: welcome (آخر 24 ساعة) ==============
        const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const { data: welcomeRows, error: welcomeErr } = await supabase
          .from("profiles")
          .select("id, email, full_name, created_at")
          .gte("created_at", since24h.toISOString())
          .not("email", "is", null);

        if (welcomeErr) {
          console.error("welcome query failed", { welcomeErr });
        } else {
          for (const row of welcomeRows ?? []) {
            const res = await enqueueIfNew(supabase, {
              templateName: "welcome",
              messageId: `welcome-${row.id}`,
              email: row.email!,
              templateData: { fullName: row.full_name ?? undefined },
            });
            results.push({
              userId: row.id,
              email: row.email!,
              bucket: "welcome",
              status: res,
            });
          }
        }

        // ============== Buckets 2-5: day-1, day-3, day-5, day-7 ==============
        // كل bucket يستهدف نافذة 24h حول اليوم المحدد منذ التسجيل.
        const dayBuckets: Array<{
          day: number;
          template: string;
          prefix: string;
          requireNotOnboarded?: boolean;
        }> = [
          { day: 1, template: "onboarding-day1", prefix: "day1" },
          {
            day: 3,
            template: "onboarding-tip-day3",
            prefix: "tip-day3",
            requireNotOnboarded: true,
          },
          { day: 5, template: "onboarding-day5", prefix: "day5" },
          { day: 7, template: "onboarding-day7", prefix: "day7" },
        ];

        for (const bucket of dayBuckets) {
          const target = new Date(
            now.getTime() - bucket.day * 24 * 60 * 60 * 1000,
          );
          const lower = new Date(target.getTime() - 12 * 60 * 60 * 1000);
          const upper = new Date(target.getTime() + 12 * 60 * 60 * 1000);

          let query = supabase
            .from("profiles")
            .select("id, email, full_name, onboarded, created_at")
            .gte("created_at", lower.toISOString())
            .lt("created_at", upper.toISOString())
            .not("email", "is", null);

          if (bucket.requireNotOnboarded) {
            query = query.eq("onboarded", false);
          }

          const { data: rows, error: rowsErr } = await query;
          if (rowsErr) {
            console.error(`${bucket.prefix} query failed`, { rowsErr });
            continue;
          }

          for (const row of rows ?? []) {
            const res = await enqueueIfNew(supabase, {
              templateName: bucket.template,
              messageId: `${bucket.prefix}-${row.id}`,
              email: row.email!,
              templateData: { fullName: row.full_name ?? undefined },
            });
            results.push({
              userId: row.id,
              email: row.email!,
              bucket: bucket.prefix,
              status: res,
            });
          }
        }

        return Response.json({ processed: results.length, results });
      },
    },
  },
});

async function enqueueIfNew(
  supabase: ReturnType<typeof createClient<any>>,
  args: {
    templateName: string;
    messageId: string;
    email: string;
    templateData: Record<string, any>;
  },
): Promise<string> {
  const { templateName, messageId, email, templateData } = args;

  // suppression check
  const { data: suppressed } = await supabase
    .from("suppressed_emails")
    .select("email")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  if (suppressed) return "suppressed";

  // duplicate check
  const { data: existing } = await supabase
    .from("email_send_log")
    .select("id")
    .eq("message_id", messageId)
    .in("status", ["pending", "sent"])
    .maybeSingle();
  if (existing) return "duplicate";

  const template = TEMPLATES[templateName];
  if (!template) {
    console.error(`Template ${templateName} not registered`);
    return "no_template";
  }

  try {
    const element = React.createElement(template.component, templateData);
    const html = await render(element);
    const plainText = await render(element, { plainText: true });
    const subject =
      typeof template.subject === "function"
        ? template.subject(templateData)
        : template.subject;

    const { error: enqueueError } = await supabase.rpc(
      "enqueue_email" as any,
      {
        queue_name: "transactional_emails",
        payload: {
          message_id: messageId,
          label: templateName,
          to: email,
          from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
          sender_domain: SENDER_DOMAIN,
          purpose: "transactional",
          idempotency_key: messageId,
          subject,
          html,
          text: plainText,
          queued_at: new Date().toISOString(),
        },
      } as any,
    );
    if (enqueueError) {
      console.error("enqueue failed", { templateName, messageId, enqueueError });
      return "enqueue_failed";
    }

    await supabase.from("email_send_log").insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: email,
      status: "pending",
    });
    return "enqueued";
  } catch (e) {
    console.error("render/enqueue exception", { templateName, messageId, e });
    return "render_failed";
  }
}
