import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/Tajawal";
import { COLORS } from "../theme";

const { fontFamily } = loadFont("normal", { weights: ["400", "700", "900"], subsets: ["arabic"] });

const STATS = [
  { num: "30", unit: "منشور", caption: "لمتجرك في 5 دقائق", color: COLORS.green },
  { num: "800", unit: "ر.س", caption: "وفّرها شهرياً", color: COLORS.gold },
  { num: "40", unit: "قالب", caption: "بالعامية السعودية", color: COLORS.greenDeep },
];

const StatCard: React.FC<{ index: number }> = ({ index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stat = STATS[index];

  const cardIn = spring({ frame, fps, config: { damping: 14, stiffness: 130 } });
  const numCount = interpolate(frame, [10, 50], [0, parseInt(stat.num)], { extrapolateRight: "clamp" });
  const displayNum = Math.round(numCount).toString();

  return (
    <div
      style={{
        opacity: cardIn,
        transform: `translateY(${interpolate(cardIn, [0, 1], [50, 0])}px) scale(${interpolate(cardIn, [0, 1], [0.85, 1])})`,
        background: COLORS.white,
        borderRadius: 32,
        padding: "50px 40px",
        textAlign: "center",
        boxShadow: "0 20px 50px rgba(15,31,24,0.15)",
        border: `3px solid ${stat.color}25`,
        minWidth: 280,
      }}
    >
      <div
        style={{
          fontSize: 140,
          fontWeight: 900,
          color: stat.color,
          lineHeight: 1,
          letterSpacing: "-4px",
        }}
      >
        {displayNum}
      </div>
      <div style={{ fontSize: 36, fontWeight: 700, color: COLORS.ink, marginTop: 8 }}>
        {stat.unit}
      </div>
      <div style={{ fontSize: 26, fontWeight: 400, color: COLORS.ink + "99", marginTop: 14 }}>
        {stat.caption}
      </div>
    </div>
  );
};

export const Scene4Stats: React.FC = () => {
  const frame = useCurrentFrame();
  const titleIn = spring({ frame, fps: 30, config: { damping: 16 } });

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        direction: "rtl",
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
      }}
    >
      <div
        style={{
          fontSize: 56,
          fontWeight: 900,
          color: COLORS.ink,
          marginBottom: 60,
          textAlign: "center",
          opacity: titleIn,
          transform: `translateY(${interpolate(titleIn, [0, 1], [-30, 0])}px)`,
        }}
      >
        الأرقام تتكلم 📊
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 30, width: "100%", maxWidth: 600 }}>
        <Sequence from={15} durationInFrames={120}>
          <StatCard index={0} />
        </Sequence>
        <Sequence from={35} durationInFrames={100}>
          <StatCard index={1} />
        </Sequence>
        <Sequence from={55} durationInFrames={80}>
          <StatCard index={2} />
        </Sequence>
      </div>
    </AbsoluteFill>
  );
};
