import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

const SITE_NAME = "رِفد";

interface Day1Props {
  fullName?: string;
  generateUrl?: string;
}

const OnboardingDay1Email = ({
  fullName,
  generateUrl = "https://rifd.club/dashboard/generate-text",
}: Day1Props) => (
  <Html lang="ar" dir="rtl">
    <Head />
    <Preview>أول منشور احترافي في 60 ثانية — جرّبه الآن</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {fullName ? `${fullName}، خلّينا نبدأ 🚀` : "خلّينا نبدأ 🚀"}
        </Heading>

        <Text style={text}>
          أمس انضممت لـ <strong>{SITE_NAME}</strong>. اليوم نبسّط لك الخطوة
          الأولى: <strong>أول منشور احترافي لمتجرك في أقل من دقيقة.</strong>
        </Text>

        <Section style={highlightBox}>
          <Text style={highlightTitle}>📝 جرّب هذا القالب الجاهز:</Text>
          <Text style={quote}>
            "اكتب لي منشور إنستقرام لإطلاق منتج جديد بأسلوب جذّاب، مع 3
            هاشتاقات سعودية."
          </Text>
        </Section>

        <Text style={text}>
          انسخه، الصقه في رِفد، واضغط "توليد" — وستحصل على منشور كامل بنبرة
          متجرك خلال ثوانٍ.
        </Text>

        <Section style={{ textAlign: "center", margin: "32px 0" }}>
          <Button href={generateUrl} style={button}>
            ولّد أول منشور الآن
          </Button>
        </Section>

        <Text style={tip}>
          💡 <strong>نصيحة:</strong> كلما كان وصف منتجك دقيقاً، كانت النتيجة
          أفضل. أضف الفئة، السعر، والجمهور المستهدف.
        </Text>

        <Text style={footer}>
          أي سؤال؟ ردّ على هذه الرسالة وسنساعدك.
          <br />
          فريق {SITE_NAME}
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: OnboardingDay1Email,
  subject: "أول منشور احترافي في 60 ثانية ⚡",
  displayName: "Onboarding Day 1",
  previewData: { fullName: "محمد" },
} satisfies TemplateEntry;

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Tahoma, Arial, sans-serif',
};
const container = { padding: "30px 25px", maxWidth: "560px", margin: "0 auto" };
const h1 = {
  fontSize: "22px",
  fontWeight: "bold",
  color: "#1a5d3e",
  margin: "0 0 20px",
};
const text = {
  fontSize: "15px",
  color: "#374151",
  lineHeight: "1.7",
  margin: "0 0 16px",
};
const highlightBox = {
  backgroundColor: "#f0f9f4",
  borderRadius: "10px",
  padding: "18px 20px",
  margin: "22px 0",
  border: "1px solid #d1e7dd",
};
const highlightTitle = {
  fontSize: "14px",
  color: "#1a5d3e",
  fontWeight: "bold",
  margin: "0 0 10px",
};
const quote = {
  fontSize: "15px",
  color: "#1f2937",
  fontStyle: "italic",
  lineHeight: "1.6",
  margin: 0,
};
const button = {
  backgroundColor: "#1a5d3e",
  color: "#ffffff",
  padding: "12px 28px",
  borderRadius: "8px",
  textDecoration: "none",
  fontSize: "15px",
  fontWeight: "bold",
  display: "inline-block",
};
const tip = {
  fontSize: "14px",
  color: "#6b7280",
  backgroundColor: "#fffbeb",
  padding: "12px 16px",
  borderRadius: "8px",
  borderRight: "3px solid #f59e0b",
  margin: "20px 0",
};
const footer = {
  fontSize: "13px",
  color: "#6b7280",
  margin: "30px 0 0",
  lineHeight: "1.6",
};
