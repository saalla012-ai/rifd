import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { EmailLayout, brand, fontFamily, spacing, SITE_NAME } from "./_shared/layout";
import { PrimaryButton, SecondaryButton, InfoCard } from "./_shared/components";

interface DiscountProps {
  fullName?: string;
  pricingUrl?: string;
  plansUrl?: string;
}

/**
 * قالب تذكير شخصي بعرض الافتتاح 30% — يُرسل مرة واحدة مدى الحياة
 * للمستخدم المجاني الذي مضى على تسجيله 7 أيام بدون طلب اشتراك.
 *
 * تصنيف Lifecycle/Transactional — مرتبط بسلوك فردي، ليس حملة جماعية.
 * idempotency: discount-30-{userId}
 */
const FreeTrialDiscountEmail = ({
  fullName,
  pricingUrl = "https://rifd.site/pricing?promo=FOUNDING30",
  plansUrl = "https://rifd.site/pricing",
}: DiscountProps) => (
  <EmailLayout preview={`عرضنا الافتتاحي ينتظرك — خصم 30% لمؤسّسي ${SITE_NAME}`}>
    <Heading style={h1}>
      {fullName ? `${fullName}، احتفظنا لك بمكان 🎁` : "احتفظنا لك بمكان 🎁"}
    </Heading>
    <Text style={text}>
      مضى أسبوع على انضمامك إلى <strong>{SITE_NAME}</strong>. لاحظنا أنّك ما زلت تستكشف — وهذا طبيعي تماماً، التجربة الجادة تأخذ وقتها.
    </Text>
    <Text style={text}>
      ولأنك من <strong>أوائل من سجّلوا</strong>، احتفظنا لك بحق الانضمام إلى <strong>برنامج المؤسّسين</strong> بسعر افتتاحي خاص.
    </Text>

    <Section style={offerBox}>
      <Text style={offerLabel}>عرض المؤسّسين — لمدة محدودة</Text>
      <Text style={offerHeading}>
        خصم <span style={discount}>30%</span>
      </Text>
      <Text style={offerSubtext}>على أول اشتراك سنوي — مدى الحياة</Text>
      <Text style={code}>كود العرض: <strong>FOUNDING30</strong></Text>
    </Section>

    <InfoCard variant="highlight">
      <Text style={whyTitle}>💎 ماذا ستحصل عليه؟</Text>
      <Text style={whyItem}>✅ توليد نصوص بلا حدود يومية</Text>
      <Text style={whyItem}>✅ مكتبة صور احترافية لمتجرك</Text>
      <Text style={whyItem}>✅ حفظ ملفات تعريف لعدة متاجر</Text>
      <Text style={whyItem}>✅ أولوية في الدعم وقوالب جديدة</Text>
    </InfoCard>

    <div style={{ textAlign: "center", margin: `${spacing.lg} 0` }}>
      <PrimaryButton href={pricingUrl}>فعّل اشتراكي بـ 30% خصم</PrimaryButton>
    </div>

    <div style={{ textAlign: "center", margin: `${spacing.md} 0` }}>
      <SecondaryButton href={plansUrl}>اعرض كل الخطط</SecondaryButton>
    </div>

    <Text style={tip}>
      💡 العرض ينطبق <strong>مرة واحدة فقط</strong> ولأول دفعة سنوية. مقاعد المؤسّسين محدودة — كلما اقتربنا من الحد الأقصى، يُغلق العرض تلقائياً.
    </Text>

    <Text style={muted}>
      إن كانت لديك أي أسئلة قبل الاشتراك، ردّ على هذه الرسالة وسنجيبك خلال ساعات.
      <br />
      فريق {SITE_NAME}
    </Text>
  </EmailLayout>
);

export const template = {
  component: FreeTrialDiscountEmail,
  subject: (data: Record<string, any>) =>
    data?.fullName
      ? `${data.fullName}، عرضنا الافتتاحي ينتظرك — خصم 30% 🎁`
      : `عرضنا الافتتاحي ينتظرك — خصم 30% 🎁`,
  displayName: "تذكير عرض المؤسّسين 30%",
  previewData: { fullName: "محمد" },
} satisfies TemplateEntry;

const h1 = { fontSize: "24px", fontWeight: 700, color: brand.primary, margin: `0 0 ${spacing.md}`, fontFamily };
const text = { fontSize: "15px", color: brand.textBody, lineHeight: "1.8", margin: `0 0 ${spacing.md}`, fontFamily };
const offerBox = { background: `linear-gradient(135deg, ${brand.primary} 0%, #0f3d28 100%)`, borderRadius: "14px", padding: `${spacing.lg}`, margin: `${spacing.lg} 0`, textAlign: "center" as const };
const offerLabel = { fontSize: "12px", color: brand.gold, fontWeight: 700, letterSpacing: "1.5px", margin: "0 0 8px", textTransform: "uppercase" as const, fontFamily };
const offerHeading = { fontSize: "32px", color: "#ffffff", fontWeight: 900, margin: "8px 0", fontFamily };
const discount = { fontSize: "44px", color: brand.gold, fontFamily };
const offerSubtext = { fontSize: "14px", color: "#d1fae5", margin: "0 0 12px", fontFamily };
const code = { fontSize: "14px", color: "#ffffff", margin: "12px 0 0", fontFamily, backgroundColor: "rgba(255,255,255,0.12)", padding: "8px 16px", borderRadius: "8px", display: "inline-block" };
const whyTitle = { fontSize: "14px", color: brand.primary, fontWeight: 700, margin: `0 0 ${spacing.sm}`, fontFamily };
const whyItem = { fontSize: "14px", color: brand.textPrimary, margin: "6px 0", lineHeight: "1.7", fontFamily };
const tip = { fontSize: "13px", color: brand.textMuted, lineHeight: "1.7", margin: `${spacing.md} 0`, fontStyle: "italic" as const, fontFamily };
const muted = { fontSize: "13px", color: brand.textMuted, margin: `${spacing.lg} 0 0`, lineHeight: "1.7", fontFamily };
