import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Tajawal";
import { COLORS } from "../theme";

const { fontFamily } = loadFont("normal", { weights: ["400", "700", "900"], subsets: ["arabic"] });

/**
 * Scene 6 — CTA (220 frames, ~7.3s)
 * Brand + URL massive + benefit chips. Pulsing CTA, gentle parallax.
 */
export const Scene6CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const brandIn = spring({ frame, fps, config: { damping: 14 } });
  const urlIn = spring({ frame: frame - 18, fps, config: { damping: 12, stiffness: 130 } });
  const ctaIn = spring({ frame: frame - 40, fps, config: { damping: 14 } });
  const chipsIn = spring({ frame: frame - 60, fps, config: { damping: 16 } });

  // Pulse on CTA
  const pulse = 1 + Math.sin(frame * 0.18) * 0.025;
  // Subtle parallax: brand drifts up slightly
  const parallax = interpolate(frame, [0, 220], [0, -25]);

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
      <div style={{ textAlign: "center", transform: `translateY(${parallax}px)` }}>
        {/* Brand mark */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: COLORS.ink,
            opacity: brandIn,
            transform: `translateY(${interpolate(brandIn, [0, 1], [30, 0])}px)`,
          }}
        >
          ابدأ مجاناً اليوم
        </div>

        <div
          style={{
            fontSize: 200,
            fontWeight: 900,
            color: COLORS.greenDeep,
            margin: "20px 0 60px",
            letterSpacing: "-8px",
            lineHeight: 1.4,
            paddingTop: 30,
            opacity: brandIn,
            transform: `scale(${interpolate(brandIn, [0, 1], [0.6, 1])})`,
            textShadow: `0 16px 50px ${COLORS.greenDeep}40`,
          }}
        >
          رِفد
        </div>

        {/* URL chip — pulsing gold */}
        <div
          style={{
            display: "inline-block",
            background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldGlow})`,
            color: COLORS.greenDeep,
            padding: "32px 70px",
            borderRadius: 100,
            fontSize: 78,
            fontWeight: 900,
            opacity: urlIn,
            transform: `scale(${pulse * interpolate(urlIn, [0, 1], [0.7, 1])})`,
            boxShadow: `0 24px 60px ${COLORS.gold}70, 0 0 80px ${COLORS.goldGlow}50`,
            direction: "ltr",
            letterSpacing: "-2px",
          }}
        >
          rifd.club
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            color: COLORS.ink,
            marginTop: 40,
            opacity: ctaIn,
            transform: `translateY(${interpolate(ctaIn, [0, 1], [20, 0])}px)`,
          }}
        >
          5 توليدات مجانية — جرّب الآن
        </div>

        {/* Trust chips */}
        <div
          style={{
            marginTop: 36,
            display: "flex",
            justifyContent: "center",
            gap: 20,
            flexWrap: "wrap",
            opacity: chipsIn,
          }}
        >
          {["✓ بدون بطاقة", "✓ عامية سعودية", "✓ إلغاء بنقرة"].map((b) => (
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
