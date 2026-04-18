/**
 * Public demo endpoint — rate-limited by IP, no auth required.
 * Powers the home page "جرّب الآن" widget. Caps at 3 requests per IP per hour
 * (in-memory, resets on Worker restart) to keep Lovable AI credits safe.
 */

import { createFileRoute } from "@tanstack/react-router";
import { chatComplete, AIError } from "@/server/lovable-ai";

const HOURLY_LIMIT = 3;
const buckets = new Map<string, { count: number; resetAt: number }>();

function takeToken(ip: string): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const b = buckets.get(ip);
  if (!b || b.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + hour });
    return { ok: true, remaining: HOURLY_LIMIT - 1, resetAt: now + hour };
  }
  if (b.count >= HOURLY_LIMIT) {
    return { ok: false, remaining: 0, resetAt: b.resetAt };
  }
  b.count += 1;
  return { ok: true, remaining: HOURLY_LIMIT - b.count, resetAt: b.resetAt };
}

const PRODUCT_LABEL: Record<string, string> = {
  dropshipping: "متجر دروبشيبنق",
  fashion: "متجر أزياء",
  beauty: "متجر تجميل وعناية",
  food: "متجر مأكولات",
  electronics: "متجر إلكترونيات",
};
const AUDIENCE_LABEL: Record<string, string> = {
  young: "شباب 18-30",
  family: "العائلات",
  women: "النساء",
  business: "رواد الأعمال",
};

export const Route = createFileRoute("/api/demo-generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip =
          request.headers.get("cf-connecting-ip") ||
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          "anon";

        const gate = takeToken(ip);
        if (!gate.ok) {
          return Response.json(
            {
              error: "وصلت حدّ المعاينة المجانية (3 توليدات/ساعة). سجّل واحصل على 5 توليدات مجانية فوراً.",
              resetAt: gate.resetAt,
            },
            { status: 429 }
          );
        }

        let body: { storeName?: string; productType?: string; audience?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "صيغة الطلب غير صحيحة" }, { status: 400 });
        }

        const storeName = (body.storeName ?? "").toString().slice(0, 60).trim() || "متجرك";
        const product = PRODUCT_LABEL[body.productType ?? ""] ?? "متجر إلكتروني";
        const audience = AUDIENCE_LABEL[body.audience ?? ""] ?? "العامة";

        const system = `أنت كاتب محتوى تسويقي محترف للسوق السعودي. اكتب منشور إنستقرام واحد قصير (50-80 كلمة) بالعامية السعودية الأصيلة. ابدأ مباشرة بالمحتوى — لا مقدمات. استخدم 2-3 emojis بذكاء. أنهِ بـ CTA + 4 هاشتاقات سعودية.`;

        const user = `اكتب منشور إنستقرام لإطلاق منتج في "${storeName}" — ${product}، الجمهور المستهدف: ${audience}.`;

        try {
          const out = await chatComplete({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
            temperature: 0.9,
          });
          return Response.json({
            result: out.text.trim(),
            remaining: gate.remaining,
          });
        } catch (e) {
          if (e instanceof AIError) {
            return Response.json({ error: e.message }, { status: e.status });
          }
          return Response.json(
            { error: e instanceof Error ? e.message : "خطأ غير متوقع" },
            { status: 500 }
          );
        }
      },
    },
  },
});
