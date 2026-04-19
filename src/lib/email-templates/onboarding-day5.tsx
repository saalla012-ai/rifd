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

interface Day5Props {
  fullName?: string;
  dashboardUrl?: string;
}

const OnboardingDay5Email = ({
  fullName,
  dashboardUrl = "https://rifd.club/dashboard",
}: Day5Props) => (
  <Html lang="ar" dir="rtl">
    <Head />
    <Preview>كيف وفّر متجر "بيت الذوق" 18 ساعة شهرياً مع {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {fullName ? `${fullName}، شف هذي القصة 👇` : "قصة قد تلهمك 👇"}
        </Heading>

        <Text style={text}>
          <strong>أم خالد</strong> — صاحبة متجر "بيت الذوق" للعبايات في
          الرياض — كانت تقضي <strong>3 ساعات يومياً</strong> في كتابة محتوى
          إنستقرام وتيك توك لـ 12 منتج جديد كل أسبوع.
        </Text>

        <Section style={problemBox}>
          <Text style={problemTitle}>😩 قبل {SITE_NAME}:</Text>
          <Text style={problemText}>
            • منشورات متشابهة وممّلة
            <br />
            • تأخّر في إطلاق المنتجات
            <br />• إرهاق وتسويق غير منتظم
          </Text>
        </Section>

        <Section style={solutionBox}>
          <Text style={solutionTitle}>✨ بعد {SITE_NAME}:</Text>
          <Text style={solutionText}>
            • <strong>18 ساعة موفّرة شهرياً</strong>
            <br />
            • محتوى يومي بنبرة متجرها الخاصة
            <br />• زيادة <strong>34%</strong> في تفاعل الإنستقرام خلال شهر
          </Text>
        </Section>

        <Text style={quote}>
          "صرت أطلق منتج جديد كل يومين بدل أسبوع. رِفد فهم نبرتي بسرعة عجيبة."
          <br />
          <span style={quoteAuthor}>— أم خالد، بيت الذوق</span>
        </Text>

        <Section style={{ textAlign: "center", margin: "32px 0" }}>
          <Button href={dashboardUrl} style={button}>
            ابدأ قصتك الآن
          </Button>
        </Section>

        <Text style={footer}>
          نريد أن نسمع قصتك أيضاً — ردّ على هذه الرسالة وأخبرنا.
          <br />
          فريق {SITE_NAME}
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: OnboardingDay5Email,
  subject: "كيف وفّرت أم خالد 18 ساعة شهرياً 📈",
  displayName: "Onboarding Day 5 - Social Proof",
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
const problemBox = {
  backgroundColor: "#fef2f2",
  borderRadius: "10px",
  padding: "16px 20px",
  margin: "18px 0",
  border: "1px solid #fecaca",
};
const problemTitle = {
  fontSize: "14px",
  color: "#991b1b",
  fontWeight: "bold",
  margin: "0 0 8px",
};
const problemText = {
  fontSize: "14px",
  color: "#7f1d1d",
  lineHeight: "1.7",
  margin: 0,
};
const solutionBox = {
  backgroundColor: "#f0fdf4",
  borderRadius: "10px",
  padding: "16px 20px",
  margin: "18px 0",
  border: "1px solid #bbf7d0",
};
const solutionTitle = {
  fontSize: "14px",
  color: "#14532d",
  fontWeight: "bold",
  margin: "0 0 8px",
};
const solutionText = {
  fontSize: "14px",
  color: "#166534",
  lineHeight: "1.7",
  margin: 0,
};
const quote = {
  fontSize: "15px",
  color: "#1f2937",
  fontStyle: "italic",
  lineHeight: "1.7",
  borderRight: "3px solid #1a5d3e",
  paddingRight: "16px",
  margin: "24px 0",
};
const quoteAuthor = {
  fontSize: "13px",
  color: "#6b7280",
  fontStyle: "normal",
  fontWeight: "bold",
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
const footer = {
  fontSize: "13px",
  color: "#6b7280",
  margin: "30px 0 0",
  lineHeight: "1.6",
};
