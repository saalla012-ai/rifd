import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CampaignPack } from "@/server/campaign-packs";

export function CampaignContextBar({ campaign, campaignId, loading, error }: { campaign: CampaignPack | null; campaignId?: string; loading: boolean; error: string | null }) {
  if (!campaignId) return null;
  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between" dir="rtl">
      <div className="min-w-0 text-sm">
        <p className="font-extrabold text-primary">{loading ? "جاري تحميل سياق الحملة…" : campaign ? `مرتبطة بحملة: ${campaign.product || "حملة محفوظة"}` : "الأداة تعمل بدون سياق حملة"}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{campaign ? `${campaign.goal} · ${campaign.channel}` : error ?? "يمكنك المتابعة بشكل طبيعي."}</p>
      </div>
      {campaign && (
        <Button asChild variant="outline" size="sm" className="shrink-0 gap-1">
          <Link to="/dashboard/campaign-studio" search={{ campaignId: campaign.id } as never}><ArrowLeft className="h-3.5 w-3.5" /> العودة للاستوديو</Link>
        </Button>
      )}
    </div>
  );
}
