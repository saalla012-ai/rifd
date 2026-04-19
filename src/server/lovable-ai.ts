/**
 * Lovable AI Gateway helper — server-only.
 * Wraps calls to the OpenAI-compatible /chat/completions endpoint with sane
 * error handling for rate limits (429) and credit exhaustion (402).
 */

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }>;
};

export class AIError extends Error {
  status: number;
  code: "rate_limited" | "payment_required" | "upstream" | "unknown";
  constructor(message: string, status: number, code: AIError["code"]) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export type AIUsage = {
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
};

export async function chatComplete(opts: {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  modalities?: ("text" | "image")[];
}): Promise<{ text: string; images: string[]; usage: AIUsage; raw: any }> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    throw new AIError("LOVABLE_API_KEY is not configured", 500, "unknown");
  }

  const body: Record<string, unknown> = {
    model: opts.model,
    messages: opts.messages,
  };
  if (typeof opts.temperature === "number") body.temperature = opts.temperature;
  if (opts.modalities) body.modalities = opts.modalities;

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (res.status === 429) {
    throw new AIError(
      "تم تجاوز الحد المسموح حالياً، حاول بعد لحظات",
      429,
      "rate_limited"
    );
  }
  if (res.status === 402) {
    throw new AIError(
      "نفد رصيد الـAI في المنصة. يرجى التواصل مع الدعم",
      402,
      "payment_required"
    );
  }
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new AIError(
      `خطأ من مزود الـAI (${res.status}): ${errText.slice(0, 200)}`,
      res.status,
      "upstream"
    );
  }

  const json = await res.json();
  const message = json?.choices?.[0]?.message ?? {};
  const text: string = typeof message.content === "string" ? message.content : "";
  const images: string[] =
    (message.images ?? [])
      .map((img: any) => img?.image_url?.url ?? null)
      .filter((u: string | null): u is string => !!u) ?? [];

  const u = json?.usage ?? {};
  const usage: AIUsage = {
    prompt_tokens: typeof u.prompt_tokens === "number" ? u.prompt_tokens : null,
    completion_tokens: typeof u.completion_tokens === "number" ? u.completion_tokens : null,
    total_tokens: typeof u.total_tokens === "number" ? u.total_tokens : null,
  };

  return { text, images, usage, raw: json };
}
