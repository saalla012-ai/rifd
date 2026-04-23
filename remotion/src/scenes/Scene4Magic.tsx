import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Tajawal";
import { COLORS } from "../theme";

const { fontFamily } = loadFont("normal", { weights: ["400", "700", "900"], subsets: ["arabic"] });

const OUTPUT_CARDS: Array<{ title: string; body: string; tone: "text" | "visual" }> = [
  {
    title: "المنشور الرئيسي",
    body: "افتتاحية بيعية مختصرة + وعد واضح + CTA خفيف يليق بالقطاع.",
    tone: "text",
  },
  {
    title: "3 هوكات بديلة",
    body: "زوايا مختلفة لنفس الحملة بدل إعادة كتابة الطلب من الصفر.",
    tone: "text",
  },
  {
    title: "اتجاه الصورة",
    body: "مشهد بصري واحد يثبّت الهوية ويجعل العرض قابلاً للتنفيذ بسرعة.",
    tone: "visual",
  },
  {
    title: "فكرة Reel",
    body: "افتتاحية + تسلسل لقطات + إغلاق بيعي من نفس المنطق.",
    tone: "visual",
  },
];

const OutputCard: React.FC<{ index: number; title: string; body: string; tone: "text" | "visual" }> = ({
  index,
  title,
  body,
  tone,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = 56 + index * 10;
  const reveal = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 170 } });

  return (
    <div
      style={{
        width: 215,
        minHeight: 220,
        borderRadius: 24,
        background: COLORS.white,
        border: `2px solid ${tone === "visual" ? COLORS.gold : COLORS.greenGlow}35`,
        boxShadow: "0 18px 36px rgba(15,31,24,0.16)",
        padding: 20,
        opacity: reveal,
        transform: `translateY(${interpolate(reveal, [0, 1], [45, 0])}px) scale(${interpolate(reveal, [0, 1], [0.82, 1])})`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div
          style={{
            display: "inline-flex",
            padding: "8px 12px",
            borderRadius: 999,
            background: tone === "visual" ? `${COLORS.gold}20` : `${COLORS.greenGlow}18`,
            color: tone === "visual" ? COLORS.gold : COLORS.greenDeep,
            fontSize: 18,
            fontWeight: 900,
          }}
        >
          {tone === "visual" ? "مخرج بصري" : "مخرج نصي"}
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: COLORS.ink, marginTop: 18, lineHeight: 1.3 }}>
          {title}
        </div>
        <div style={{ fontSize: 20, fontWeight: 500, color: COLORS.ink, opacity: 0.8, marginTop: 14, lineHeight: 1.6 }}>
          {body}
        </div>
      </div>

      <div
        style={{
          marginTop: 18,
          padding: "12px 14px",
          borderRadius: 18,
          background: tone === "visual" ? `${COLORS.gold}12` : `${COLORS.green}10`,
          color: tone === "visual" ? COLORS.gold : COLORS.green,
          fontSize: 18,
          fontWeight: 700,
        }}
      >
        من نفس الطلب
      </div>
    </div>
  );
};

export const Scene4Magic: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const inputIn = spring({ frame, fps, config: { damping: 14 } });
  const packIn = spring({ frame: frame - 24, fps, config: { damping: 12, stiffness: 160 } });
  const titleIn = spring({ frame: frame - 40, fps, config: { damping: 14 } });
  const badgeIn = spring({ frame: frame - 70, fps, config: { damping: 15 } });
  const drift = interpolate(frame, [65, 180], [0, -24], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        direction: "rtl",
        padding: "48px 38px 34px",
      }}
    >
      <div
        style={{
          borderRadius: 30,
          background: COLORS.white,
          border: `3px solid ${COLORS.greenGlow}40`,
          boxShadow: "0 18px 36px rgba(15,31,24,0.12)",
          padding: 30,
          opacity: inputIn,
          transform: `translateY(${interpolate(inputIn, [0, 1], [-42, 0])}px)`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24 }}>
          <div>
            <div style={{ fontSize: 21, fontWeight: 700, color: COLORS.ink, opacity: 0.65, marginBottom: 10 }}>
              المدخل
            </div>
            <div style={{ fontSize: 40, fontWeight: 900, color: COLORS.greenDeep, lineHeight: 1.3 }}>
              متجر عطور — جمهور نسائي — نبرة راقية
            </div>
          </div>
          <div
            style={{
              borderRadius: 22,
              background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldGlow})`,
              color: COLORS.greenDeep,
              padding: "20px 28px",
              fontSize: 28,
              fontWeight: 900,
              boxShadow: `0 10px 28px ${COLORS.gold}66`,
              transform: `scale(${interpolate(packIn, [0, 1], [0.88, 1])})`,
              whiteSpace: "nowrap",
            }}
          >
            ولّد الحزمة ←
          </div>
        </div>
      </div>

      <div
        style={{
          textAlign: "center",
          marginTop: 28,
          opacity: titleIn,
          transform: `translateY(${interpolate(titleIn, [0, 1], [24, 0])}px)`,
        }}
      >
        <div style={{ fontSize: 48, fontWeight: 900, color: COLORS.greenDeep, lineHeight: 1.3 }}>
          ليس "30 منشوراً" فقط — بل بداية حملة مترابطة من نفس الطلب
        </div>
      </div>

      <div
        style={{
          marginTop: 28,
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 18,
          transform: `translateY(${drift}px)`,
        }}
      >
        {OUTPUT_CARDS.map((card, index) => (
          <OutputCard key={card.title} index={index} title={card.title} body={card.body} tone={card.tone} />
        ))}
      </div>

      <div
        style={{
          marginTop: 28,
          display: "flex",
          justifyContent: "center",
          opacity: badgeIn,
          transform: `scale(${interpolate(badgeIn, [0, 1], [0.9, 1])})`,
        }}
      >
        <div
          style={{
            borderRadius: 999,
            background: `${COLORS.green}14`,
            color: COLORS.greenDeep,
            padding: "16px 28px",
            fontSize: 24,
            fontWeight: 800,
            border: `2px solid ${COLORS.green}24`,
          }}
        >
          مدخل واحد ← رسالة + صورة + Reel + CTA ضمن نفس منطق البيع
        </div>
      </div>
    </AbsoluteFill>
  );
};
