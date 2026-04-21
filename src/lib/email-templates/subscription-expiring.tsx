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

interface SubscriptionExpiringProps {
  fullName?: string;
  planLabel?: string;
  daysRemaining?: number;
  expiresAt?: string;
  renewUrl?: string;
}

const SubscriptionExpiringEmail = ({
  fullName,
  planLabel = "احترافي",
  daysRemaining = 7,
  expiresAt,
  renewUrl = "https://rifd.site/dashboard/billing",
}: SubscriptionExpiringProps) => {
  const isUrgent = daysRemaining <= 1;
  const headline = isUrgent
    ? "اشتراكك ينتهي خلال 24 ساعة ⏰"
    : `اشتراكك ينتهي خلال ${daysRemaining} أيام`;

  return (
    <Html lang="ar" dir="rtl">
      <Head />
      <Preview>{headline} — جدّد الآن لمواصلة استخدام {SITE_NAME}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={isUrgent ? h1Urgent : h1}>{headline}</Heading>

          <Text style={text}>
            {fullName ? `مرحباً ${fullName}،` : "مرحباً،"}
          </Text>

          <Text style={text}>
            نودّ تذكيرك بأنّ اشتراكك في <strong>{SITE_NAME}</strong> (باقة{" "}
            <strong>{planLabel}</strong>)
            {isUrgent
              ? " سينتهي خلال أقل من 24 ساعة."
              : ` سينتهي خلال ${daysRemaining} أيام.`}
          </Text>

          {expiresAt && (
            <Section style={infoBox}>
              <Text style={infoRow}>
                <strong>تاريخ الانتهاء:</strong> {expiresAt}
              </Text>
            </Section>
          )}

          <Text style={text}>
            لتجنّب أي انقطاع في الخدمة وفقدان الوصول لميزات الباقة، نوصي بتجديد
            اشتراكك الآن.
          </Text>

          <Section style={{ textAlign: "center", margin: "30px 0" }}>
            <Button href={renewUrl} style={button}>
              جدّد الاشتراك الآن
            </Button>
          </Section>

          <Text style={footer}>
            إن كنت قد جدّدت اشتراكك بالفعل، يمكنك تجاهل هذه الرسالة.
            <br />
            فريق {SITE_NAME}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: SubscriptionExpiringEmail,
  subject: (data: Record<string, any>) => {
    const days = Number(data?.daysRemaining ?? 7);
    return days <= 1
      ? `⏰ اشتراكك في ${SITE_NAME} ينتهي خلال 24 ساعة`
      : `🔔 اشتراكك في ${SITE_NAME} ينتهي خلال ${days} أيام`;
  },
  displayName: "تذكير قرب انتهاء الاشتراك",
  previewData: {
    fullName: "محمد",
    planLabel: "احترافي",
    daysRemaining: 7,
    expiresAt: "25 أبريل 2026",
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
const h1Urgent = {
  fontSize: "22px",
  fontWeight: "bold",
  color: "#b91c1c",
  margin: "0 0 20px",
};
const text = {
  fontSize: "15px",
  color: "#374151",
  lineHeight: "1.7",
  margin: "0 0 16px",
};
const infoBox = {
  backgroundColor: "#fef3c7",
  borderRadius: "10px",
  padding: "16px 20px",
  margin: "20px 0",
  border: "1px solid #fde68a",
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
const footer = {
  fontSize: "13px",
  color: "#6b7280",
  margin: "30px 0 0",
  lineHeight: "1.6",
};
