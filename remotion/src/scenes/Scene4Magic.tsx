import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Tajawal";
import { COLORS } from "../theme";

const { fontFamily } = loadFont("normal", { weights: ["400", "700", "900"], subsets: ["arabic"] });

/**
 * Scene 4 — MAGIC (180 frames, 6s) — THE PEAK
 * Top: simple input + click. Bottom: masonry of 30 outputs cascading in.
 */

const POSTS = [
  "عبايتنا الجديدة ✨\nخامة فاخرة وقصة تجنّن",
  "خصم 25% بس اليوم 🔥\nاستفيدي قبل ما تخلص",
  "وصلتنا تشكيلة العود\nروائح أصلية 100%",
  "هديتك للعيد جاهزة 🎁\nغلاف فاخر مجاناً",
  "آراء عميلاتنا تتكلم 💚\nاطلبي وجربي بنفسك",
  "توصيل مجاني للرياض\nعلى طلبات +200 ر.س",
  "قميصنا الكاجوال\nراحة وأناقة بسعر مغري",
  "كولكشن الشتاء وصل ❄️\nدفء يلامس الذوق",
  "مجموعة العروس 👰\nإطلالات لا تُنسى",
  "تشكيلة الأطفال 🧒\nقطن 100% آمن",
  "ساعات سويسرية أصلية\nضمان 5 سنوات",
  "حقائب جلد طبيعي\nصناعة يدوية فاخرة",
];

const PostCard: React.FC<{ index: number; col: number; row: number }> = ({ index, col, row }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Cascade: start at 50, stagger every 3 frames
  const delay = 50 + index * 3;
  const popIn = spring({ frame: frame - delay, fps, config: { damping: 13, stiffness: 180 } });

  const post = POSTS[index % POSTS.length];
  const isImage = index % 3 === 1; // every 3rd is image-style

  return (
    <div
      style={{
        position: "absolute",
        left: col * 280 + 30,
        top: row * 220 + 10,
        width: 250,
        height: 200,
        background: isImage
          ? `linear-gradient(135deg, ${COLORS.green}, ${COLORS.greenGlow})`
          : COLORS.white,
        borderRadius: 18,
        padding: 18,
        boxShadow: "0 10px 24px rgba(15,31,24,0.18)",
        border: `2px solid ${COLORS.gold}30`,
        opacity: popIn,
        transform: `scale(${interpolate(popIn, [0, 1], [0.5, 1])}) translateY(${interpolate(popIn, [0, 1], [40, 0])}px)`,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: isImage ? "center" : "flex-start",
        alignItems: isImage ? "center" : "flex-start",
      }}
    >
      {isImage ? (
        <>
          <div style={{ fontSize: 60 }}>🛍️</div>
          <div style={{ fontSize: 16, color: COLORS.cream, marginTop: 8, fontWeight: 700 }}>
            صورة منتج
          </div>
        </>
      ) : (
        <div style={{ fontSize: 18, color: COLORS.ink, fontWeight: 700, lineHeight: 1.5, whiteSpace: "pre-line" }}>
          {post}
        </div>
      )}
    </div>
  );
};

export const Scene4Magic: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Top: input + button
  const inputIn = spring({ frame, fps, config: { damping: 14 } });
  const click = spring({ frame: frame - 30, fps, config: { damping: 10, stiffness: 180 } });
  const clickScale = 1 - interpolate(frame, [30, 38, 50], [0, 0.1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // Title morph
  const titleOpacity = interpolate(frame, [40, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Camera pan: slight upward drift on grid as posts populate
  const pan = interpolate(frame, [60, 180], [0, -40], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // 12 cards in 4 cols × 3 rows
  const cards = Array.from({ length: 12 }, (_, i) => ({
    index: i,
    col: i % 4,
    row: Math.floor(i / 4),
  }));

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        direction: "rtl",
        padding: "50px 30px 30px",
      }}
    >
      {/* TOP: Input simulation */}
      <div
        style={{
          background: COLORS.white,
          borderRadius: 24,
          padding: 28,
          margin: "0 30px",
          boxShadow: "0 12px 30px rgba(15,31,24,0.12)",
          border: `3px solid ${COLORS.green}40`,
          opacity: inputIn,
          transform: `translateY(${interpolate(inputIn, [0, 1], [-40, 0])}px)`,
        }}
      >
        <div style={{ fontSize: 22, color: COLORS.ink, opacity: 0.7, marginBottom: 12, fontWeight: 700 }}>
          نوع المتجر:
        </div>
        <div style={{ fontSize: 38, color: COLORS.greenDeep, fontWeight: 900, marginBottom: 20 }}>
          عبايات سعودية فاخرة
        </div>
        {/* Generate button */}
        <div
          style={{
            background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldGlow})`,
            color: COLORS.greenDeep,
            padding: "20px 32px",
            borderRadius: 16,
            fontSize: 32,
            fontWeight: 900,
            textAlign: "center",
            transform: `scale(${clickScale})`,
            boxShadow: `0 10px 30px ${COLORS.gold}70`,
          }}
        >
          ✨ ولّد 30 منشور
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          textAlign: "center",
          fontSize: 44,
          fontWeight: 900,
          color: COLORS.greenDeep,
          margin: "30px 0 20px",
          opacity: titleOpacity,
        }}
      >
        ↓ النتيجة في 5 دقائق ↓
      </div>

      {/* Grid */}
      <div
        style={{
          position: "relative",
          flex: 1,
          transform: `translateY(${pan}px)`,
        }}
      >
        {cards.map((c) => (
          <PostCard key={c.index} index={c.index} col={c.col} row={c.row} />
        ))}
      </div>

      {/* Used in scope check */}
      {click > 999 && <span />}
    </AbsoluteFill>
  );
};
