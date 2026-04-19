import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COLORS } from "../theme";

/**
 * Persistent layer: warm cream gradient + subtle drifting orbs.
 * Sits behind every scene so transitions feel cinematic, not slidey.
 */
export const PersistentBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(140% 90% at 30% 10%, ${COLORS.cream} 0%, ${COLORS.creamDeep} 75%, #E8DFC9 100%)`,
      }}
    >
      {/* Drifting green orb */}
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.greenGlow}55 0%, transparent 65%)`,
          left: -200 + Math.sin(t * 0.4) * 40,
          top: -150 + Math.cos(t * 0.3) * 30,
          filter: "blur(40px)",
        }}
      />
      {/* Drifting gold orb */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.goldGlow}66 0%, transparent 65%)`,
          right: -180 + Math.cos(t * 0.5) * 50,
          bottom: -120 + Math.sin(t * 0.4) * 40,
          filter: "blur(50px)",
        }}
      />
      {/* Grain — subtle paper feel */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.08,
          background:
            "repeating-radial-gradient(circle at 20% 30%, #00000010 0, #00000010 1px, transparent 1px, transparent 4px)",
          mixBlendMode: "multiply",
        }}
      />
    </AbsoluteFill>
  );
};
