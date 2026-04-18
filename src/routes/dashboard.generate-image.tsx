import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Image as ImageIcon, Upload, Loader2, Zap, Crown } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { IMAGE_PROMPTS } from "@/lib/prompts-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/generate-image")({
  head: () => ({ meta: [{ title: "توليد صور — رِفد" }] }),
  component: GenerateImagePage,
});

function GenerateImagePage() {
  const [model, setModel] = useState<"flash" | "pro">("flash");
  const [template, setTemplate] = useState(IMAGE_PROMPTS[0].id);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const go = () => {
    setLoading(true);
    setDone(false);
    setTimeout(() => { setLoading(false); setDone(true); }, 1500);
  };

  return (
    <DashboardShell>
      <h1 className="text-2xl font-extrabold">توليد صور</h1>
      <p className="mt-1 text-sm text-muted-foreground">بوسترات وصور منتجات بنص عربي بارز</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft space-y-4">
          <div>
            <Label>نموذج التوليد</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => setModel("flash")}
                className={cn("rounded-lg border p-3 text-right text-sm",
                  model === "flash" ? "border-primary bg-primary/10" : "border-border")}
              >
                <Zap className="mb-1 h-4 w-4 text-primary" />
                <div className="font-bold">سريع (Flash)</div>
                <div className="text-xs text-muted-foreground">15 ث • مناسب للحصص اليومية</div>
              </button>
              <button
                onClick={() => setModel("pro")}
                className={cn("rounded-lg border p-3 text-right text-sm",
                  model === "pro" ? "border-primary bg-primary/10" : "border-border")}
              >
                <Crown className="mb-1 h-4 w-4 text-gold" />
                <div className="font-bold">جودة عالية (Pro)</div>
                <div className="text-xs text-muted-foreground">30 ث • للإعلانات الممولة</div>
              </button>
            </div>
          </div>

          <div>
            <Label>القالب</Label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {IMAGE_PROMPTS.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>

          <div>
            <Label>وصف الصورة</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="مثلاً: بوستر جمعة بيضاء بخصم 50% بألوان فاخرة"
              className="mt-1 min-h-24"
            />
          </div>

          <div className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
            <Upload className="mx-auto mb-1 h-4 w-4" />
            (اختياري) ارفع صورة منتجك لتحسينها
          </div>

          <Button onClick={go} disabled={loading} className="w-full gradient-primary text-primary-foreground shadow-elegant">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري التوليد...</> : <><ImageIcon className="h-4 w-4" /> ولّد الصورة</>}
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h3 className="font-bold">المعاينة</h3>
          <div className="mt-3 flex aspect-square items-center justify-center rounded-lg border border-dashed border-border bg-secondary/30 text-sm text-muted-foreground">
            {done ? "✨ صورة ناتجة (تجريبي — يصير حي في الموجة 2)" : "الصورة بتظهر هنا"}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
