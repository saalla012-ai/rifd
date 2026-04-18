import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { currentRiyadhMonth } from "@/lib/usage-month";

export const Route = createFileRoute("/dashboard/usage")({
  head: () => ({ meta: [{ title: "الاستخدام — رِفد" }] }),
  component: UsagePage,
});

const LIMITS = {
  free: { text: 5, image: 2 },
  pro: { text: 1000, image: 60 },
  business: { text: 5000, image: 300 },
};

function currentMonth() {
  return currentRiyadhMonth();
}

function UsagePage() {
  const { user, profile } = useAuth();
  const [usage, setUsage] = useState<{ text_count: number; image_count: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // user.id (string) دائم، بينما كائن user يتغيّر مرجعه عند كل auth event.
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("usage_logs")
        .select("text_count, image_count")
        .eq("user_id", userId)
        .eq("month", currentMonth())
        .maybeSingle();
      if (cancelled) return;
      setUsage(data ?? { text_count: 0, image_count: 0 });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const plan = (profile?.plan ?? "free") as keyof typeof LIMITS;
  const limits = LIMITS[plan];

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </DashboardShell>
    );
  }

  const textPct = Math.min(100, ((usage?.text_count ?? 0) / Math.max(1, limits.text)) * 100);
  const imgPct = limits.image === 0 ? 0 : Math.min(100, ((usage?.image_count ?? 0) / limits.image) * 100);

  return (
    <DashboardShell>
      <h1 className="text-2xl font-extrabold">الاستخدام هذا الشهر</h1>
      <p className="mt-1 text-sm text-muted-foreground">باقتك الحالية: <strong>{plan}</strong></p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex justify-between text-sm">
            <span className="font-bold">توليدات نصية</span>
            <span>{usage?.text_count ?? 0} / {limits.text}</span>
          </div>
          <Progress value={textPct} className="mt-3" />
          <p className="mt-2 text-xs text-muted-foreground">يتجدد في 1 من الشهر القادم</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex justify-between text-sm">
            <span className="font-bold">توليدات صور</span>
            <span>{usage?.image_count ?? 0} / {limits.image}</span>
          </div>
          <Progress value={imgPct} className="mt-3" />
          <p className="mt-2 text-xs text-muted-foreground">يتجدد بداية الشهر القادم</p>
        </div>
      </div>
    </DashboardShell>
  );
}
