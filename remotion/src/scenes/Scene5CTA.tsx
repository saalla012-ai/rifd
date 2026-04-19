import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Tajawal";
import { COLORS } from "../theme";

const { fontFamily } = loadFont("normal", { weights: ["400", "700", "900"], subsets: ["arabic"] });

/**
 * Scene 5 (0-110): Closing — brand + URL + invitation
 */
export const Scene5CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const logoIn = spring({ frame: frame - 15, fps, config: { damping: 12, stiffness: 120 } });
  const urlIn = spring({ frame: frame - 35, fps, config: { damping: 16 } });
  const badgeIn = spring({ frame: frame - 50, fps, config: { damping: 18 } });

  // Pulse on the URL chip
  const pulse = 1 + Math.sin(frame * 0.15) * 0.02;

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
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: COLORS.ink,
            opacity: titleIn,
            transform: `translateY(${interpolate(titleIn, [0, 1], [30, 0])}px)`,
          }}
        >
          ابدأ مجاناً اليوم
        </div>

        <div
          style={{
            fontSize: 200,
            fontWeight: 900,
            color: COLORS.greenDeep,
            margin: "20px 0 70px",
            opacity: logoIn,
            transform: `scale(${interpolate(logoIn, [0, 1], [0.5, 1])})`,
            letterSpacing: "-6px",
            lineHeight: 1,
          }}
        >
          رِفد
        </div>

        <div
          style={{
            display: "inline-block",
            background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldGlow})`,
            color: COLORS.greenDeep,
            padding: "26px 56px",
            borderRadius: 100,
            fontSize: 56,
            fontWeight: 900,
            opacity: urlIn,
            transform: `scale(${pulse * interpolate(urlIn, [0, 1], [0.7, 1])})`,
            boxShadow: `0 20px 50px ${COLORS.gold}70, 0 0 60px ${COLORS.goldGlow}40`,
            direction: "ltr",
          }}
        >
          rifd.club
        </div>

        <div
          style={{
            marginTop: 50,
            display: "flex",
            justifyContent: "center",
            gap: 24,
            flexWrap: "wrap",
            opacity: badgeIn,
          }}
        >
          {["✓ بدون بطاقة", "✓ 5 توليدات مجانية", "✓ إلغاء بنقرة"].map((b) => (
            <div
              key={b}
              style={{
                background: COLORS.white,
                color: COLORS.green,
                padding: "16px 28px",
                borderRadius: 100,
                fontSize: 28,
                fontWeight: 700,
                border: `2px solid ${COLORS.green}30`,
                boxShadow: "0 8px 20px rgba(15,31,24,0.08)",
              }}
            >
              {b}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
