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

interface Day7Props {
  fullName?: string;
  pricingUrl?: string;
}

const OnboardingDay7Email = ({
  fullName,
  pricingUrl = "https://rifd.site/pricing",
}: Day7Props) => (
  <Html lang="ar" dir="rtl">
    <Head />
    <Preview>عرض خاص لك: خصم 20% على خطة Pro لمدة 48 ساعة فقط</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {fullName ? `${fullName}، عرض خاص لك 🎁` : "عرض خاص لك 🎁"}
        </Heading>

        <Text style={text}>
          مضى أسبوع على انضمامك إلى <strong>{SITE_NAME}</strong>. نتمنى أن
          تكون قد جرّبت توليد منشورات وصور لمتجرك.
        </Text>

        <Section style={offerBox}>
          <Text style={offerLabel}>عرض لمدة 48 ساعة فقط</Text>
          <Text style={offerHeading}>
            خصم <span style={discount}>20%</span> على خطة Pro
          </Text>
          <Text style={offerSubtext}>
            توليد <strong>غير محدود</strong> للنصوص + 200 صورة شهرياً
          </Text>
        </Section>

        <Section style={featuresBox}>
          <Text style={featureItem}>✅ توليد نصوص بلا حدود يومية</Text>
          <Text style={featureItem}>✅ 200 صورة احترافية شهرياً</Text>
          <Text style={featureItem}>✅ حفظ ملفات تعريف لعدة متاجر</Text>
          <Text style={featureItem}>✅ دعم أولوية عبر واتساب</Text>
          <Text style={featureItem}>✅ قوالب حصرية للمواسم السعودية</Text>
        </Section>

        <Section style={{ textAlign: "center", margin: "32px 0" }}>
          <Button href={pricingUrl} style={button}>
            احصل على الخصم الآن
          </Button>
        </Section>

        <Text style={urgency}>
          ⏰ <strong>ينتهي العرض خلال 48 ساعة</strong> — استخدم الكود{" "}
          <strong style={code}>WELCOME20</strong> عند طلب الاشتراك.
        </Text>

        <Text style={footer}>
          مستمر في الخطة المجانية؟ لا مشكلة — استفد من 10 توليدات شهرياً
          مجاناً دائماً.
          <br />
          فريق {SITE_NAME}
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: OnboardingDay7Email,
  subject: "🎁 خصم 20% على Pro — 48 ساعة فقط",
  displayName: "Onboarding Day 7 - Upgrade",
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
const offerBox = {
  background: "linear-gradient(135deg, #1a5d3e 0%, #0f3d28 100%)",
  borderRadius: "12px",
  padding: "24px 20px",
  margin: "24px 0",
  textAlign: "center" as const,
};
const offerLabel = {
  fontSize: "12px",
  color: "#86efac",
  fontWeight: "bold",
  letterSpacing: "1px",
  margin: "0 0 8px",
  textTransform: "uppercase" as const,
};
const offerHeading = {
  fontSize: "24px",
  color: "#ffffff",
  fontWeight: "bold",
  margin: "0 0 8px",
};
const discount = {
  fontSize: "32px",
  color: "#fbbf24",
};
const offerSubtext = {
  fontSize: "14px",
  color: "#d1fae5",
  margin: 0,
};
const featuresBox = {
  backgroundColor: "#f0f9f4",
  borderRadius: "10px",
  padding: "16px 20px",
  margin: "20px 0",
  border: "1px solid #d1e7dd",
};
const featureItem = {
  fontSize: "14px",
  color: "#1f2937",
  margin: "6px 0",
  lineHeight: "1.6",
};
const button = {
  backgroundColor: "#1a5d3e",
  color: "#ffffff",
  padding: "14px 32px",
  borderRadius: "8px",
  textDecoration: "none",
  fontSize: "16px",
  fontWeight: "bold",
  display: "inline-block",
};
const urgency = {
  fontSize: "14px",
  color: "#92400e",
  backgroundColor: "#fffbeb",
  padding: "12px 16px",
  borderRadius: "8px",
  borderRight: "3px solid #f59e0b",
  margin: "20px 0",
  textAlign: "center" as const,
};
const code = {
  backgroundColor: "#fef3c7",
  padding: "2px 8px",
  borderRadius: "4px",
  fontFamily: "monospace",
  color: "#78350f",
};
const footer = {
  fontSize: "13px",
  color: "#6b7280",
  margin: "30px 0 0",
  lineHeight: "1.6",
};
