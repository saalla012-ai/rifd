import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing-layout";
import { OnboardingSuccessPack } from "@/components/onboarding-success-pack";
import { buildSuccessPack } from "@/lib/onboarding-success";

const previewPack = buildSuccessPack({
  storeName: "رِفد للعطور",
  productTypeLabel: "عطور فاخرة",
  audienceLabel: "نساء يبحثن عن حضور راقٍ وهدية أنيقة",
  tone: "luxury",
  primaryPost:
    "عطر يبان من أول حضور… تركيبة راقية تمنحك افتتاحية إعلان أقرب للفخامة من النصوص العامة، مع دعوة شراء هادئة وواضحة من أول نظرة.",
});

export const Route = createFileRoute("/onboarding-success-preview")({
  head: () => ({
    meta: [
      { title: "معاينة Success Pack — رِفد" },
      { name: "description", content: "معاينة احترافية لمسار نجاح onboarding وإغلاق ACT-30 في رِفد." },
    ],
  }),
  component: OnboardingSuccessPreviewPage,
});

function OnboardingSuccessPreviewPage() {
  return (
    <MarketingLayout>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <OnboardingSuccessPack pack={previewPack} />
      </div>
    </MarketingLayout>
  );
}