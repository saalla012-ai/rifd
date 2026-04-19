import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import * as React from "react";
import { render } from "@react-email/components";
import { TEMPLATES } from "@/lib/email-templates/registry";
import { sendResendEmail } from "@/server/resend";

const SITE_NAME = "رِفد";
const FROM_ADDRESS = `${SITE_NAME} <onboarding@resend.dev>`;

/**
 * Server function — sends the welcome email immediately after signup.
 * Bypasses pgmq queue (which uses the disabled internal Lovable email system)
 * and goes straight to Resend.
 *
 * Idempotent: uses message_id `welcome-{userId}` and skips if already logged.
 */
export const sendWelcomeEmail = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { userId: string; email: string; fullName?: string }) => input,
  )
  .handler(async ({ data }) => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      console.error("send-welcome: missing SUPABASE_URL/SERVICE_ROLE_KEY");
      return { status: "config_error" as const };
    }

    const supabase = createClient<any>(supabaseUrl, serviceKey);
    const messageId = `welcome-${data.userId}`;
    const email = data.email.toLowerCase();

    // suppression check
    const { data: suppressed } = await supabase
      .from("suppressed_emails")
      .select("email")
      .eq("email", email)
      .maybeSingle();
    if (suppressed) return { status: "suppressed" as const };

    // idempotency check (already sent or queued)
    const { data: existing } = await supabase
      .from("email_send_log")
      .select("id, status")
      .eq("message_id", messageId)
      .in("status", ["sent", "pending"])
      .maybeSingle();
    if (existing) return { status: "duplicate" as const };

    const template = TEMPLATES["welcome"];
    if (!template) {
      console.error("send-welcome: template not registered");
      return { status: "no_template" as const };
    }

    try {
      const element = React.createElement(template.component, {
        fullName: data.fullName,
      });
      const html = await render(element);
      const text = await render(element, { plainText: true });
      const subject =
        typeof template.subject === "function"
          ? template.subject({ fullName: data.fullName })
          : template.subject;

      const result = await sendResendEmail({
        from: FROM_ADDRESS,
        to: data.email,
        subject,
        html,
        text,
        headers: { "X-Idempotency-Key": messageId },
        tags: [{ name: "template", value: "welcome" }],
      });

      await supabase.from("email_send_log").insert({
        message_id: messageId,
        template_name: "welcome",
        recipient_email: data.email,
        status: "sent",
        metadata: { provider: "resend", provider_id: result.id, source: "signup_trigger" },
      });
      console.log("send-welcome: sent", { messageId, providerId: result.id });
      return { status: "sent" as const, providerId: result.id };
    } catch (err: any) {
      const errMsg = String(err?.message ?? err).slice(0, 1000);
      console.error("send-welcome: failed", { messageId, errMsg });
      await supabase.from("email_send_log").insert({
        message_id: messageId,
        template_name: "welcome",
        recipient_email: data.email,
        status: "failed",
        error_message: errMsg,
        metadata: { source: "signup_trigger" },
      });
      return { status: "send_failed" as const, error: errMsg };
    }
  });
