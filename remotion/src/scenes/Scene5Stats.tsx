import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Tajawal";
import { COLORS } from "../theme";

const { fontFamily } = loadFont("normal", { weights: ["400", "700", "900"], subsets: ["arabic"] });

const STATS = [
  { num: 30, suffix: "", label: "منشور جاهز", glyph: "30+", color: COLORS.green },
  { num: 5, suffix: "د", label: "بدل 5 ساعات", glyph: "⏱", color: COLORS.gold },
  { num: 800, suffix: " ر.س", label: "وفّرها شهرياً", glyph: "ر.س", color: COLORS.greenDeep },
];

const StatBlock: React.FC<{ index: number; delay: number }> = ({ index, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stat = STATS[index];
  const local = frame - delay;

  const cardIn = spring({ frame: local, fps, config: { damping: 12, stiffness: 140 } });
  const numCount = interpolate(local, [8, 40], [0, stat.num], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const display = Math.round(numCount).toString();
  const iconBounce = spring({ frame: local - 4, fps, config: { damping: 8, stiffness: 200 } });

  return (
    <div
      style={{
        opacity: cardIn,
        transform: `translateX(${interpolate(cardIn, [0, 1], [-80, 0])}px) scale(${interpolate(cardIn, [0, 1], [0.85, 1])})`,
        background: COLORS.white,
        borderRadius: 28,
        padding: "32px 40px",
        boxShadow: "0 16px 40px rgba(15,31,24,0.15)",
        border: `3px solid ${stat.color}30`,
        display: "flex",
        alignItems: "center",
        gap: 32,
      }}
    >
      <div
        style={{
          fontSize: 80,
          transform: `scale(${iconBounce}) rotate(${interpolate(iconBounce, [0, 1], [-30, 0])}deg)`,
        }}
      >
        {stat.icon}
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 130,
            fontWeight: 900,
            color: stat.color,
            lineHeight: 1,
            letterSpacing: "-4px",
            display: "flex",
            alignItems: "baseline",
            gap: 8,
          }}
        >
          {display}
          <span style={{ fontSize: 50, fontWeight: 700 }}>{stat.suffix}</span>
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, color: COLORS.ink, marginTop: 6 }}>
          {stat.label}
        </div>
      </div>
    </div>
  );
};

export const Scene5Stats: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleIn = spring({ frame, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        direction: "rtl",
        padding: "60px 50px",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontSize: 60,
          fontWeight: 900,
          color: COLORS.greenDeep,
          textAlign: "center",
          marginBottom: 40,
          opacity: titleIn,
          transform: `translateY(${interpolate(titleIn, [0, 1], [-30, 0])}px)`,
        }}
      >
        الفرق بأرقام 📊
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <StatBlock index={0} delay={10} />
        <StatBlock index={1} delay={28} />
        <StatBlock index={2} delay={46} />
      </div>
    </AbsoluteFill>
  );
};
