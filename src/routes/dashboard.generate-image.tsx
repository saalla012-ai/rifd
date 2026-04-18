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

type ImgSearch = { template?: string };

export const Route = createFileRoute("/dashboard/generate-image")({
  head: () => ({ meta: [{ title: "توليد صور — رِفد" }] }),
  validateSearch: (s: Record<string, unknown>): ImgSearch => ({
    template: typeof s.template === "string" ? s.template : undefined,
  }),
  component: GenerateImagePage,
});

function GenerateImagePage() {
  const search = useSearch({ from: "/dashboard/generate-image" });
  const initial = search.template && IMAGE_PROMPTS.some((p) => p.id === search.template)
    ? search.template
    : IMAGE_PROMPTS[0].id;
  const [quality, setQuality] = useState<"flash" | "pro">("flash");
  const [templateId, setTemplateId] = useState(initial);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const router = useRouter();

  const template = IMAGE_PROMPTS.find((p) => p.id === templateId) ?? IMAGE_PROMPTS[0];

  const go = async () => {
    if (!prompt.trim()) { toast.error("اكتب وصف الصورة أولاً"); return; }
    setLoading(true);
    setImageUrl(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("سجّل الدخول أولاً");
      const out = await generateImage({
        data: { prompt, templateTitle: template.title, templateId: template.id, quality },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setImageUrl(out.url);
      setRemaining(out.remaining);
      toast.success("تم توليد الصورة ✨");
      router.invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطأ في التوليد");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">توليد صور</h1>
          <p className="mt-1 text-sm text-muted-foreground">بوسترات وصور منتجات بنص عربي بارز</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1">
            <Link to="/dashboard/templates"><LayoutGrid className="h-3.5 w-3.5" /> كل القوالب</Link>
          </Button>
          {remaining !== null && (
            <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-bold text-gold">
              باقي {remaining} صورة
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
                className={cn("rounded-lg border p-3 text-right text-sm",
                  quality === "pro" ? "border-primary bg-primary/10" : "border-border")}
              >
                <Crown className="mb-1 h-4 w-4 text-gold" />
                <div className="font-bold">جودة عالية (Pro)</div>
                <div className="text-xs text-muted-foreground">~30 ث • للإعلانات الممولة</div>
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
          </div>

          <Button onClick={go} disabled={loading} className="w-full gradient-primary text-primary-foreground shadow-elegant">
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
          <div className="mt-3 text-center">
            <Link to="/dashboard/library" className="text-xs text-primary hover:underline">
              شوف كل توليداتك في المكتبة ←
            </Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
