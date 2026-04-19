import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Star, Copy, Trash2, Image as ImageIcon, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/library")({
  head: () => ({ meta: [{ title: "مكتبتي — رِفد" }] }),
  component: LibraryPage,
});

type Generation = {
  id: string;
  type: "text" | "image" | "image_enhance";
  prompt: string;
  result: string | null;
  template: string | null;
  is_favorite: boolean;
  created_at: string;
  metadata: { template_title?: string } | null;
};

function LibraryPage() {
  // اختبار error boundary: زر ?boom=1 على الرابط لرمي خطأ متعمّد
  if (typeof window !== "undefined" && window.location.search.includes("boom=1")) {
    throw new Error("اختبار error boundary — هذا خطأ متعمّد");
  }
  const { user } = useAuth();
  const [items, setItems] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "text" | "image" | "fav">("all");

  useEffect(() => {
    if (!user) return;
    void load();
  }, [user]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("generations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) toast.error(error.message);
    setItems((data as Generation[] | null) ?? []);
    setLoading(false);
  };

  const toggleFav = async (id: string, current: boolean) => {
    setItems((s) => s.map((i) => (i.id === id ? { ...i, is_favorite: !current } : i)));
    const { error } = await supabase
      .from("generations")
      .update({ is_favorite: !current })
      .eq("id", id);
    if (error) {
      setItems((s) => s.map((i) => (i.id === id ? { ...i, is_favorite: current } : i)));
      toast.error("فشل التحديث");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("متأكد من الحذف؟")) return;
    const prev = items;
    setItems((s) => s.filter((i) => i.id !== id));
    const { error } = await supabase.from("generations").delete().eq("id", id);
    if (error) {
      setItems(prev);
      toast.error("فشل الحذف");
    } else {
      toast.success("تم الحذف");
    }
  };

  const filtered = items.filter((i) => {
    if (filter === "all") return true;
    if (filter === "fav") return i.is_favorite;
    if (filter === "text") return i.type === "text";
    if (filter === "image") return i.type === "image" || i.type === "image_enhance";
    return true;
  });

  return (
    <DashboardShell>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">مكتبتي</h1>
          <p className="mt-1 text-sm text-muted-foreground">المفضلة وكل توليداتك السابقة</p>
        </div>
        <div className="text-xs text-muted-foreground">{items.length} توليدة</div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {[
          { id: "all", label: "الكل" },
          { id: "text", label: "نصوص" },
          { id: "image", label: "صور" },
          { id: "fav", label: "المفضلة ⭐" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as typeof filter)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              filter === f.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground hover:bg-accent"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          ما عندك توليدات بعد. ابدأ من{" "}
          <Link to="/dashboard/generate-text" className="text-primary hover:underline">توليد نص</Link>{" "}
          أو{" "}
          <Link to="/dashboard/generate-image" className="text-primary hover:underline">توليد صور</Link>.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((g) => (
            <article key={g.id} className="rounded-xl border border-border bg-card p-4 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {g.type === "text" ? <FileText className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                  <span>{g.metadata?.template_title ?? g.template ?? (g.type === "text" ? "نص" : "صورة")}</span>
                </div>
                <button onClick={() => toggleFav(g.id, g.is_favorite)} aria-label="مفضلة">
                  <Star className={cn("h-4 w-4", g.is_favorite ? "fill-gold text-gold" : "text-muted-foreground")} />
                </button>
              </div>
              <div className="mt-3">
                {g.type === "text" ? (
                  <pre className="line-clamp-6 whitespace-pre-wrap text-right font-sans text-xs leading-relaxed text-foreground">
                    {g.result ?? ""}
                  </pre>
                ) : g.result ? (
                  <img src={g.result} alt={g.prompt} className="aspect-square w-full rounded-lg object-cover" />
                ) : null}
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
                <span className="text-[10px] text-muted-foreground">
                  {new Date(g.created_at).toLocaleDateString("ar-SA")}
                </span>
                <div className="flex gap-1">
                  {g.type === "text" && g.result && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { navigator.clipboard.writeText(g.result!); toast.success("تم النسخ"); }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => remove(g.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
