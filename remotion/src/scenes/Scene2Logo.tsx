import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Tajawal";
import { COLORS } from "../theme";

const { fontFamily } = loadFont("normal", { weights: ["400", "700", "900"], subsets: ["arabic"] });

/**
 * Scene 2 (0-90): Brand reveal
 * Logo "رِفد" zooms in with a sweeping gold underline + tagline.
 */
export const Scene2Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoSpring = spring({ frame, fps, config: { damping: 12, stiffness: 100, mass: 1.2 } });
  const logoScale = interpolate(logoSpring, [0, 1], [0.4, 1]);
  const logoOpacity = interpolate(logoSpring, [0, 1], [0, 1]);

  const underline = interpolate(frame, [25, 55], [0, 100], { extrapolateRight: "clamp" });
  const tagline = spring({ frame: frame - 40, fps, config: { damping: 16, stiffness: 140 } });
  const subtag = spring({ frame: frame - 55, fps, config: { damping: 16 } });

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        direction: "rtl",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 280,
            fontWeight: 900,
            color: COLORS.greenDeep,
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
            letterSpacing: "-8px",
            lineHeight: 1,
            position: "relative",
            display: "inline-block",
          }}
        >
          رِفد
          {/* Gold underline sweep */}
          <div
            style={{
              position: "absolute",
              bottom: -10,
              right: 0,
              height: 14,
              width: `${underline}%`,
              background: `linear-gradient(90deg, ${COLORS.gold}, ${COLORS.goldGlow})`,
              borderRadius: 7,
              boxShadow: `0 4px 20px ${COLORS.gold}80`,
            }}
          />
        </div>

        <div
          style={{
            marginTop: 60,
            fontSize: 64,
            fontWeight: 700,
            color: COLORS.ink,
            opacity: tagline,
            transform: `translateY(${interpolate(tagline, [0, 1], [30, 0])}px)`,
          }}
        >
          آلة المحتوى لمتجرك
        </div>

        <div
          style={{
            marginTop: 20,
            fontSize: 44,
            fontWeight: 400,
            color: COLORS.ink + "AA",
            opacity: subtag,
          }}
        >
          بالعامية السعودية 🇸🇦
        </div>
      </div>
    </AbsoluteFill>
  );
};
