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

interface SubscriptionActivatedProps {
  fullName?: string;
  planLabel?: string;
  billingCycleLabel?: string;
  activatedUntil?: string;
  invoiceUrl?: string;
  dashboardUrl?: string;
}

const SubscriptionActivatedEmail = ({
  fullName,
  planLabel = "احترافي",
  billingCycleLabel = "شهري",
  activatedUntil,
  invoiceUrl,
  dashboardUrl = "https://rifd.site/dashboard/billing",
}: SubscriptionActivatedProps) => (
  <Html lang="ar" dir="rtl">
    <Head />
    <Preview>تم تفعيل اشتراكك في {SITE_NAME} بنجاح 🎉</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {fullName ? `أهلاً ${fullName} 👋` : "مرحباً بك 👋"}
        </Heading>
        <Text style={text}>
          سعيدون بإخبارك أنّ اشتراكك في <strong>{SITE_NAME}</strong> تم تفعيله
          بنجاح، وأصبح حسابك جاهزاً للاستخدام الكامل.
        </Text>

        <Section style={infoBox}>
          <Text style={infoRow}>
            <strong>الباقة:</strong> {planLabel}
          </Text>
          <Text style={infoRow}>
            <strong>دورة الفوترة:</strong> {billingCycleLabel}
          </Text>
          {activatedUntil && (
            <Text style={infoRow}>
              <strong>سارٍ حتى:</strong> {activatedUntil}
            </Text>
          )}
        </Section>

        <Section style={{ textAlign: "center", margin: "30px 0" }}>
          <Button href={dashboardUrl} style={button}>
            افتح لوحة التحكم
          </Button>
        </Section>

        {invoiceUrl && (
          <Text style={text}>
            يمكنك تنزيل فاتورتك من{" "}
            <a href={invoiceUrl} style={link}>
              هنا
            </a>
            .
          </Text>
        )}

        <Text style={footer}>
          إن كان لديك أي استفسار، فقط أجب على هذه الرسالة وسنردّ عليك.
          <br />
          فريق {SITE_NAME}
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: SubscriptionActivatedEmail,
  subject: `🎉 تم تفعيل اشتراكك في ${SITE_NAME}`,
  displayName: "تفعيل الاشتراك",
  previewData: {
    fullName: "محمد",
    planLabel: "احترافي",
    billingCycleLabel: "شهري",
    activatedUntil: "18 مايو 2026",
    invoiceUrl: "https://rifd.site/dashboard/billing",
  },
} satisfies TemplateEntry;

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Tahoma, Arial, sans-serif',
};
const container = {
  padding: "30px 25px",
  maxWidth: "560px",
  margin: "0 auto",
};
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
const infoBox = {
  backgroundColor: "#f0f9f4",
  borderRadius: "10px",
  padding: "16px 20px",
  margin: "20px 0",
  border: "1px solid #d1e7dd",
};
const infoRow = {
  fontSize: "14px",
  color: "#1f2937",
  margin: "6px 0",
  lineHeight: "1.6",
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
const link = { color: "#1a5d3e", textDecoration: "underline" };
const footer = {
  fontSize: "13px",
  color: "#6b7280",
  margin: "30px 0 0",
  lineHeight: "1.6",
};
