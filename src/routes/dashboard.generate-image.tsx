import { useState } from "react";
import { createFileRoute, Link, useRouter, useSearch } from "@tanstack/react-router";
import { Image as ImageIcon, Loader2, Zap, Crown, Download, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { IMAGE_PROMPTS } from "@/lib/prompts-data";
import { cn } from "@/lib/utils";
import { generateImage } from "@/server/ai-functions";
import { supabase } from "@/integrations/supabase/client";
import { QuotaExceededDialog, isQuotaError } from "@/components/quota-exceeded-dialog";
import { useAuth } from "@/hooks/use-auth";
import { useCreditsSummary } from "@/hooks/use-credits-summary";
import { getMemorySignals, getSmartPromptSuggestions } from "@/lib/memory-insights";
import { track } from "@/lib/analytics/posthog";

type ImgSearch = { template?: string; prompt?: string; campaignPackId?: string };

export const Route = createFileRoute("/dashboard/generate-image")({
  head: () => ({ meta: [{ title: "توليد صور — رِفد" }] }),
  validateSearch: (s: Record<string, unknown>): ImgSearch => ({
    template: typeof s.template === "string" ? s.template : undefined,
    prompt: typeof s.prompt === "string" ? s.prompt : undefined,
    campaignPackId: typeof s.campaignPackId === "string" ? s.campaignPackId : undefined,
  }),
  component: GenerateImagePage,
});

function GenerateImagePage() {
  const { profile } = useAuth();
  const { data: credits, loading: creditsLoading, refresh: refreshCredits } = useCreditsSummary();
  const search = useSearch({ from: "/dashboard/generate-image" });
  const initial = search.template && IMAGE_PROMPTS.some((p) => p.id === search.template)
    ? search.template
    : IMAGE_PROMPTS[0].id;
  const [quality, setQuality] = useState<"flash" | "pro">("flash");
  const [templateId, setTemplateId] = useState(initial);
  const [prompt, setPrompt] = useState(search.prompt ?? "");
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [quotaDialog, setQuotaDialog] = useState<{ open: boolean; reason?: string }>({ open: false });
  const router = useRouter();

  const template = IMAGE_PROMPTS.find((p) => p.id === templateId) ?? IMAGE_PROMPTS[0];
  const smartSuggestions = getSmartPromptSuggestions(profile, "image");
  const memorySignals = getMemorySignals(profile).slice(0, 4);
  const proAllowed = credits?.imageProAllowed ?? true;

  const go = async () => {
    if (!prompt.trim()) { toast.error("اكتب وصف الصورة أولاً"); return; }
    if (quality === "pro" && !proAllowed) {
      setQuotaDialog({ open: true, reason: "IMAGE_PRO_NOT_ALLOWED: صور Pro متاحة في باقات Growth وما فوق. استخدم Flash أو رقّ الباقة." });
      return;
    }
    setLoading(true);
    setImageUrl(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("سجّل الدخول أولاً");
      const out = await generateImage({
        data: { prompt, templateTitle: template.title, templateId: template.id, quality, campaignPackId: search.campaignPackId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setImageUrl(out.url);
      setRemaining(out.remainingDaily);
      void refreshCredits();
      track("generation_created", { kind: "image", template: template.id, quality });
      toast.success("تم توليد الصورة ✨");
      router.invalidate();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "خطأ في التوليد";
      if (isQuotaError(msg)) {
        setQuotaDialog({ open: true, reason: msg });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">توليد صور</h1>
          <p className="mt-1 text-sm text-muted-foreground">بوسترات وصور منتجات ضمن حصة يومية مجانية</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1">
            <Link to="/dashboard/templates"><LayoutGrid className="h-3.5 w-3.5" /> كل القوالب</Link>
          </Button>
          {remaining !== null && (
            <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-bold text-gold">
              باقي {remaining.toLocaleString("ar-SA")} صورة اليوم
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft space-y-4">
          <div>
            <Label>نموذج التوليد</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => setQuality("flash")}
                className={cn("rounded-lg border p-3 text-right text-sm",
                  quality === "flash" ? "border-primary bg-primary/10" : "border-border")}
              >
                <Zap className="mb-1 h-4 w-4 text-primary" />
                <div className="font-bold">سريع (Flash)</div>
                <div className="text-xs text-muted-foreground">~15 ث • للمحتوى اليومي</div>
              </button>
              <button
                onClick={() => setQuality("pro")}
                disabled={!proAllowed}
                className={cn("rounded-lg border p-3 text-right text-sm",
                  quality === "pro" ? "border-primary bg-primary/10" : "border-border",
                  !proAllowed && "cursor-not-allowed opacity-55")}
              >
                <Crown className="mb-1 h-4 w-4 text-gold" />
                <div className="font-bold">جودة عالية (Pro)</div>
                <div className="text-xs text-muted-foreground">{proAllowed ? "~30 ث • للإعلانات الممولة" : "متاحة من Growth"}</div>
              </button>
            </div>
          </div>

          <div>
            <Label>القالب</Label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {IMAGE_PROMPTS.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">{template.description}</p>
          </div>

          <div>
            <Label>وصف الصورة</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="مثلاً: بوستر جمعة بيضاء بخصم 50% بألوان فاخرة وذهبية"
              className="mt-1 min-h-24"
              maxLength={1500}
            />
            {smartSuggestions.length > 0 && (
              <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-bold text-primary">اقتراحات بصرية مبنية على ذاكرة متجرك</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {smartSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setPrompt(suggestion)}
                      className="rounded-full border border-primary/20 bg-background px-2.5 py-1 text-[11px] text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button onClick={go} disabled={loading || creditsLoading || (quality === "pro" && !proAllowed)} className="w-full gradient-primary text-primary-foreground shadow-elegant">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري التوليد...</> : <><ImageIcon className="h-4 w-4" /> ولّد الصورة</>}
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">المعاينة</h3>
            {imageUrl && (
              <a
                href={imageUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs hover:bg-accent"
              >
                <Download className="h-3 w-3" /> تنزيل
              </a>
            )}
          </div>
          <div className="mt-3 flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-secondary/30 text-sm text-muted-foreground">
            {imageUrl ? (
              <img src={imageUrl} alt="نتيجة التوليد" className="h-full w-full object-cover" />
            ) : loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              "الصورة بتظهر هنا"
            )}
          </div>
          {memorySignals.length > 0 && (
            <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-4">
              <p className="text-xs font-bold text-muted-foreground">الإشارات التي يُفترض أن تنعكس بصرياً</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {memorySignals.map((signal) => (
                  <span key={signal} className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-bold text-foreground/85">
                    {signal}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="mt-3 text-center">
            <Link to="/dashboard/library" className="text-xs text-primary hover:underline">
              شوف كل توليداتك في المكتبة ←
            </Link>
          </div>
        </div>
      </div>

      <QuotaExceededDialog
        open={quotaDialog.open}
        onOpenChange={(v) => setQuotaDialog((s) => ({ ...s, open: v }))}
        kind="صورة"
        reason={quotaDialog.reason}
      />
    </DashboardShell>
  );
}
