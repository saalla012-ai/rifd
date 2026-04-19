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

interface TipProps {
  fullName?: string;
  onboardingUrl?: string;
}

const OnboardingTipEmail = ({
  fullName,
  onboardingUrl = "https://rifd.club/onboarding",
}: TipProps) => (
  <Html lang="ar" dir="rtl">
    <Head />
    <Preview>خطوة بسيطة لإطلاق إمكانيات {SITE_NAME} بالكامل</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {fullName ? `${fullName}، مازلت معنا؟` : "مازلت معنا؟"}
        </Heading>
        <Text style={text}>
          لاحظنا أنّك سجّلت في <strong>{SITE_NAME}</strong> قبل ٣ أيام، لكن لم
          تكمل بعد إعداد ملف متجرك. الإعداد يستغرق دقيقة واحدة، وبعده تصبح
          النتائج أدقّ وأقرب لطابع متجرك.
        </Text>
        <Section style={tipBox}>
          <Text style={tipText}>
            💡 <strong>نصيحة:</strong> كلما كان ملف متجرك أوضح (اسم المنتج،
            الجمهور، نبرة الكلام)، كانت نتائج التوليد أكثر احترافية.
          </Text>
        </Section>
        <Section style={{ textAlign: "center", margin: "30px 0" }}>
          <Button href={onboardingUrl} style={button}>
            أكمل الإعداد الآن
          </Button>
        </Section>
        <Text style={footer}>
          نحن هنا لمساعدتك متى احتجت — فريق {SITE_NAME}
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: OnboardingTipEmail,
  subject: `أكمل إعداد متجرك في ${SITE_NAME} 💡`,
  displayName: "تذكير إكمال الإعداد",
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
const tipBox = {
  backgroundColor: "#fffbeb",
  borderRadius: "10px",
  padding: "16px 20px",
  margin: "20px 0",
  border: "1px solid #fde68a",
};
const tipText = { fontSize: "14px", color: "#1f2937", margin: "0", lineHeight: "1.6" };
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
