import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Tajawal";
import { COLORS } from "../theme";

const { fontFamily } = loadFont("normal", { weights: ["400", "700", "900"], subsets: ["arabic"] });

/**
 * Scene 1 (0-110): The Hook
 * Big question that punches: "تكتب منشورات متجرك؟"
 * Then strikes through with red — pivot to solution.
 */
export const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const line1 = spring({ frame, fps, config: { damping: 18, stiffness: 140 } });
  const line2 = spring({ frame: frame - 12, fps, config: { damping: 18, stiffness: 140 } });
  const line3 = spring({ frame: frame - 24, fps, config: { damping: 18, stiffness: 140 } });

  // Strike-through reveal
  const strike = interpolate(frame, [55, 75], [0, 100], { extrapolateRight: "clamp" });
  const strikeOpacity = interpolate(frame, [55, 60], [0, 1], { extrapolateRight: "clamp" });

  // Replacement word slide-in
  const newWord = spring({ frame: frame - 75, fps, config: { damping: 14, stiffness: 180 } });

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        direction: "rtl",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
      }}
    >
      <div style={{ textAlign: "center", color: COLORS.ink, lineHeight: 1.05 }}>
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            opacity: line1,
            transform: `translateY(${interpolate(line1, [0, 1], [40, 0])}px)`,
          }}
        >
          تعبت تكتب
        </div>

        <div
          style={{
            fontSize: 140,
            fontWeight: 900,
            color: COLORS.greenDeep,
            margin: "20px 0",
            opacity: line2,
            transform: `translateY(${interpolate(line2, [0, 1], [60, 0])}px) scale(${interpolate(line2, [0, 1], [0.9, 1])})`,
            position: "relative",
            display: "inline-block",
          }}
        >
          منشورات متجرك؟
        </div>

        <div
          style={{
            marginTop: 40,
            fontSize: 56,
            fontWeight: 700,
            color: COLORS.ink,
            opacity: line3,
            position: "relative",
            display: "inline-block",
          }}
        >
          <span style={{ position: "relative", display: "inline-block" }}>
            <span style={{ color: frame >= 75 ? COLORS.red + "60" : COLORS.ink }}>
              5 ساعات يومياً
            </span>
            {/* Strike through */}
            <span
              style={{
                position: "absolute",
                top: "50%",
                right: 0,
                height: 6,
                width: `${strike}%`,
                background: COLORS.red,
                opacity: strikeOpacity,
                transform: "translateY(-50%) rotate(-2deg)",
                borderRadius: 3,
              }}
            />
          </span>
        </div>

        {/* Replacement: "5 دقائق فقط" */}
        <div
          style={{
            marginTop: 30,
            fontSize: 88,
            fontWeight: 900,
            color: COLORS.green,
            opacity: newWord,
            transform: `translateY(${interpolate(newWord, [0, 1], [40, 0])}px) scale(${interpolate(newWord, [0, 1], [0.7, 1])})`,
          }}
        >
          5 دقائق فقط ⚡
        </div>
      </div>
    </AbsoluteFill>
  );
};
