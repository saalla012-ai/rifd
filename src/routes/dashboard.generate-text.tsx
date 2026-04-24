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
import { getSuggestionsFor } from "@/lib/prompt-suggestions";
import { generateText } from "@/server/ai-functions";
import { supabase } from "@/integrations/supabase/client";
import { QuotaExceededDialog, isQuotaError } from "@/components/quota-exceeded-dialog";
import { useAuth } from "@/hooks/use-auth";
import { getMemorySignals, getSmartPromptSuggestions } from "@/lib/memory-insights";
import { track } from "@/lib/analytics/posthog";

type TextSearch = { template?: string };

export const Route = createFileRoute("/dashboard/generate-text")({
  head: () => ({ meta: [{ title: "توليد نص — رِفد" }] }),
  validateSearch: (s: Record<string, unknown>): TextSearch => ({
    template: typeof s.template === "string" ? s.template : undefined,
  }),
  component: GenerateTextPage,
});

function GenerateTextPage() {
  const { profile } = useAuth();
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
  const [quotaDialog, setQuotaDialog] = useState<{ open: boolean; reason?: string }>({ open: false });
  const router = useRouter();

  const template = TEXT_PROMPTS.find((p) => p.id === templateId) ?? TEXT_PROMPTS[0];
  const smartSuggestions = getSmartPromptSuggestions(profile, "text");
  const memorySignals = getMemorySignals(profile).slice(0, 4);

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
      track("generation_created", { kind: "text", template: template.id });
      toast.success("تم التوليد ✨");
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
              <div className="mt-3">
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">اقتراحات سريعة:</p>
                <div className="flex flex-wrap gap-1.5">
                  {getSuggestionsFor(templateId).map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTopic(s)}
                      className="rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-[11px] text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {smartSuggestions.length > 0 && (
                <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-xs font-bold text-primary">اقتراحات مبنية على ذاكرة متجرك</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {smartSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setTopic(suggestion)}
                        className="rounded-full border border-primary/20 bg-background px-2.5 py-1 text-[11px] text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
          {memorySignals.length > 0 && (
            <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-4">
              <p className="text-xs font-bold text-muted-foreground">ما الذي يفترض أن ينعكس من الذاكرة هنا؟</p>
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
        kind="نص"
        reason={quotaDialog.reason}
      />
    </DashboardShell>
  );
}
