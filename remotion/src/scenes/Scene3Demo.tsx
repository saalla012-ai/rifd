import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Tajawal";
import { COLORS } from "../theme";

const { fontFamily } = loadFont("normal", { weights: ["400", "700", "900"], subsets: ["arabic"] });

/**
 * Scene 3 (0-130): Live typing demo
 * Shows a chat-like card: input → AI generates a real Saudi-dialect post.
 */
const POST_TEXT = "يا قلبي 💚 وصلتنا تشكيلة العود الفاخر — رائحة تخلّيك ما تنساها. اطلب الحين والتوصيل مجاني داخل الرياض ✨";

export const Scene3Demo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardIn = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });
  const inputIn = spring({ frame: frame - 10, fps, config: { damping: 18 } });
  const buttonIn = spring({ frame: frame - 25, fps, config: { damping: 14 } });

  // Button press at frame 45
  const pressed = interpolate(frame, [42, 48], [1, 0.94], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pressBack = interpolate(frame, [48, 56], [0.94, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const buttonScale = frame < 48 ? pressed : pressBack;

  // Result card appears
  const resultIn = spring({ frame: frame - 55, fps, config: { damping: 18, stiffness: 130 } });

  // Typing effect
  const charsToShow = Math.max(0, Math.floor(interpolate(frame, [70, 125], [0, POST_TEXT.length], { extrapolateRight: "clamp" })));
  const typedText = POST_TEXT.slice(0, charsToShow);

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
          width: "100%",
          maxWidth: 920,
          background: COLORS.white,
          borderRadius: 36,
          padding: 50,
          opacity: cardIn,
          transform: `translateY(${interpolate(cardIn, [0, 1], [60, 0])}px) scale(${interpolate(cardIn, [0, 1], [0.92, 1])})`,
          boxShadow: "0 30px 80px rgba(15,31,24,0.2), 0 8px 24px rgba(15,31,24,0.08)",
          border: `2px solid ${COLORS.greenGlow}30`,
        }}
      >
        {/* Header chip */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: COLORS.green,
            color: COLORS.white,
            padding: "10px 22px",
            borderRadius: 100,
            fontSize: 28,
            fontWeight: 700,
            opacity: cardIn,
          }}
        >
          ✨ جرّب رِفد
        </div>

        {/* Input row */}
        <div
          style={{
            marginTop: 30,
            opacity: inputIn,
            transform: `translateY(${interpolate(inputIn, [0, 1], [20, 0])}px)`,
          }}
        >
          <div style={{ fontSize: 26, color: COLORS.ink + "99", marginBottom: 14, fontWeight: 700 }}>
            نوع المتجر
          </div>
          <div
            style={{
              background: COLORS.creamDeep,
              borderRadius: 18,
              padding: "24px 28px",
              fontSize: 38,
              fontWeight: 700,
              color: COLORS.ink,
              border: `2px solid ${COLORS.green}30`,
            }}
          >
            🌸 متجر عطور وعود
          </div>
        </div>

        {/* CTA button */}
        <div
          style={{
            marginTop: 28,
            opacity: buttonIn,
            transform: `scale(${buttonScale * interpolate(buttonIn, [0, 1], [0.9, 1])})`,
          }}
        >
          <div
            style={{
              background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldGlow})`,
              color: COLORS.greenDeep,
              padding: "26px 0",
              borderRadius: 18,
              fontSize: 40,
              fontWeight: 900,
              textAlign: "center",
              boxShadow: `0 12px 30px ${COLORS.gold}60`,
            }}
          >
            ولّد منشور — 10 ثواني ⚡
          </div>
        </div>

        {/* Result card */}
        {frame >= 55 && (
          <div
            style={{
              marginTop: 36,
              background: `linear-gradient(135deg, ${COLORS.green}, ${COLORS.greenDeep})`,
              borderRadius: 24,
              padding: "36px 40px",
              opacity: resultIn,
              transform: `translateY(${interpolate(resultIn, [0, 1], [40, 0])}px) scale(${interpolate(resultIn, [0, 1], [0.95, 1])})`,
              boxShadow: `0 20px 50px ${COLORS.greenDeep}40`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  background: COLORS.goldGlow,
                  boxShadow: `0 0 20px ${COLORS.goldGlow}`,
                }}
              />
              <span style={{ color: COLORS.cream, fontSize: 24, fontWeight: 700 }}>
                النتيجة جاهزة للنشر
              </span>
            </div>
            <div
              style={{
                fontSize: 38,
                fontWeight: 400,
                color: COLORS.cream,
                lineHeight: 1.7,
                minHeight: 200,
              }}
            >
              {typedText}
              {charsToShow < POST_TEXT.length && charsToShow > 0 && (
                <span
                  style={{
                    display: "inline-block",
                    width: 4,
                    height: 36,
                    background: COLORS.goldGlow,
                    marginRight: 4,
                    verticalAlign: "middle",
                    opacity: Math.floor(frame / 6) % 2 === 0 ? 1 : 0,
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
