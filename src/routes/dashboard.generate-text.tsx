import { useState } from "react";
import { createFileRoute, Link, useRouter, useSearch } from "@tanstack/react-router";
import { Wand2, Copy, Check, Loader2, Star, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TEXT_PROMPTS } from "@/lib/prompts-data";
import { generateText } from "@/server/ai-functions";
import { supabase } from "@/integrations/supabase/client";

type TextSearch = { template?: string };

export const Route = createFileRoute("/dashboard/generate-text")({
  head: () => ({ meta: [{ title: "توليد نص — رِفد" }] }),
  validateSearch: (s: Record<string, unknown>): TextSearch => ({
    template: typeof s.template === "string" ? s.template : undefined,
  }),
  component: GenerateTextPage,
});

function GenerateTextPage() {
  const search = useSearch({ from: "/dashboard/generate-text" });
  const initial = search.template && TEXT_PROMPTS.some((p) => p.id === search.template)
    ? search.template
    : TEXT_PROMPTS[0].id;
  const [templateId, setTemplateId] = useState(initial);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const template = TEXT_PROMPTS.find((p) => p.id === templateId) ?? TEXT_PROMPTS[0];

  const generate = async () => {
    if (!topic.trim()) {
      toast.error("اكتب الموضوع/التفاصيل أولاً");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("سجّل الدخول أولاً");

      const out = await generateText({
        data: { prompt: topic, templateTitle: template.title, templateId: template.id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setResult(out.result);
      setRemaining(out.remaining);
      toast.success("تم التوليد ✨");
      router.invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطأ في التوليد");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <DashboardShell>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">توليد نص</h1>
          <p className="mt-1 text-sm text-muted-foreground">اختر قالب واكتب فكرتك — نحن نتكفّل بالباقي</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1">
            <Link to="/dashboard/templates"><LayoutGrid className="h-3.5 w-3.5" /> كل القوالب</Link>
          </Button>
          {remaining !== null && (
            <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
              باقي {remaining} توليدة
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="space-y-4">
            <div>
              <Label>اختر قالباً</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TEXT_PROMPTS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.badge && <Star className="ml-1 inline h-3 w-3 text-gold" />}
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">{template.description}</p>
            </div>
            <div>
              <Label htmlFor="topic">الموضوع / التفاصيل</Label>
              <Textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="مثلاً: عرض جديد على عطر شرقي بسعر 199 ر.س لمناسبة اليوم الوطني"
                className="mt-1 min-h-32"
                maxLength={2000}
              />
              <p className="mt-1 text-xs text-muted-foreground">{topic.length}/2000</p>
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
                onClick={copy}
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
