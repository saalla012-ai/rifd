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

interface WelcomeProps {
  fullName?: string;
  dashboardUrl?: string;
}

const WelcomeEmail = ({
  fullName,
  dashboardUrl = "https://rifd.site/dashboard",
}: WelcomeProps) => (
  <Html lang="ar" dir="rtl">
    <Head />
    <Preview>أهلاً بك في {SITE_NAME} — ابدأ توليد محتوى متجرك الآن</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {fullName ? `أهلاً ${fullName} 👋` : "أهلاً بك 👋"}
        </Heading>
        <Text style={text}>
          سعداء بانضمامك إلى <strong>{SITE_NAME}</strong> — منصة توليد المحتوى
          الذكي لمتاجر التجارة الإلكترونية في السعودية.
        </Text>
        <Text style={text}>إليك خطوات سريعة للبدء:</Text>
        <Section style={listBox}>
          <Text style={listItem}>1️⃣ أكمل ملف متجرك (اسم، فئة، جمهور).</Text>
          <Text style={listItem}>2️⃣ جرّب أول قالب نصي وشاهد النتيجة.</Text>
          <Text style={listItem}>3️⃣ ولّد صورة منتج احترافية بضغطة واحدة.</Text>
        </Section>
        <Section style={{ textAlign: "center", margin: "30px 0" }}>
          <Button href={dashboardUrl} style={button}>
            ابدأ الآن
          </Button>
        </Section>
        <Text style={footer}>
          إن احتجت أي مساعدة، فقط أجب على هذه الرسالة وسنردّ عليك.
          <br />
          فريق {SITE_NAME}
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: WelcomeEmail,
  subject: `أهلاً بك في ${SITE_NAME} 🎉`,
  displayName: "ترحيب",
  previewData: { fullName: "محمد" },
} satisfies TemplateEntry;

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Tahoma, Arial, sans-serif',
};
const container = { padding: "30px 25px", maxWidth: "560px", margin: "0 auto" };
const h1 = { fontSize: "22px", fontWeight: "bold", color: "#1a5d3e", margin: "0 0 20px" };
const text = { fontSize: "15px", color: "#374151", lineHeight: "1.7", margin: "0 0 16px" };
const listBox = {
  backgroundColor: "#f0f9f4",
  borderRadius: "10px",
  padding: "16px 20px",
  margin: "20px 0",
  border: "1px solid #d1e7dd",
};
const listItem = { fontSize: "14px", color: "#1f2937", margin: "6px 0", lineHeight: "1.6" };
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
const footer = { fontSize: "13px", color: "#6b7280", margin: "30px 0 0", lineHeight: "1.6" };
