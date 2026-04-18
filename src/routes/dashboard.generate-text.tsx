import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Wand2, Copy, Check, Loader2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TEXT_PROMPTS } from "@/lib/prompts-data";
import { generateDemoResult } from "@/lib/demo-results";

export const Route = createFileRoute("/dashboard/generate-text")({
  head: () => ({ meta: [{ title: "توليد نص — رِفد" }] }),
  component: GenerateTextPage,
});

function GenerateTextPage() {
  const [prompt, setPrompt] = useState(TEXT_PROMPTS[0].id);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = () => {
    setLoading(true);
    setTimeout(() => {
      setResult(generateDemoResult({ storeName: topic || "متجرك", productType: "dropshipping", audience: "young" }));
      setLoading(false);
    }, 1200);
  };

  return (
    <DashboardShell>
      <h1 className="text-2xl font-extrabold">توليد نص</h1>
      <p className="mt-1 text-sm text-muted-foreground">اختر قالب وكتب فكرتك — نحن نتكفّل بالباقي</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="space-y-4">
            <div>
              <Label>اختر قالباً</Label>
              <Select value={prompt} onValueChange={setPrompt}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TEXT_PROMPTS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="topic">الموضوع / التفاصيل</Label>
              <Textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="مثلاً: عرض جديد على عطر شرقي بسعر 199 ر.س"
                className="mt-1 min-h-32"
              />
            </div>
            <Button onClick={generate} disabled={loading} className="w-full gradient-primary text-primary-foreground shadow-elegant">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري التوليد...</> : <><Wand2 className="h-4 w-4" /> ولّد النص</>}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">النتيجة</h3>
            {result && (
              <button
                onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs"
              >
                {copied ? <><Check className="h-3 w-3 text-success" /> تم</> : <><Copy className="h-3 w-3" /> نسخ</>}
              </button>
            )}
          </div>
          {result ? (
            <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-border bg-secondary/40 p-4 text-right font-sans text-sm leading-relaxed">{result}</pre>
          ) : (
            <div className="mt-3 flex h-48 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
              النتيجة بتظهر هنا
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
