/**
 * Resend email sender via Lovable Connector Gateway.
 * Server-only — uses LOVABLE_API_KEY + RESEND_API_KEY from process.env.
 */

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

export interface SendResendEmailParams {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  reply_to?: string;
  headers?: Record<string, string>;
  tags?: Array<{ name: string; value: string }>;
}

export interface ResendSendResult {
  id: string;
}

export async function sendResendEmail(
  params: SendResendEmailParams,
): Promise<ResendSendResult> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const response = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: params.from,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      ...(params.text ? { text: params.text } : {}),
      ...(params.reply_to ? { reply_to: params.reply_to } : {}),
      ...(params.headers ? { headers: params.headers } : {}),
      ...(params.tags ? { tags: params.tags } : {}),
    }),
  });

  const data = (await response.json().catch(() => ({}))) as any;
  if (!response.ok) {
    throw new Error(
      `Resend API call failed [${response.status}]: ${JSON.stringify(data)}`,
    );
  }
  return data as ResendSendResult;
}
