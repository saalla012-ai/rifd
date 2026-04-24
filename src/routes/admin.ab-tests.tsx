/**
 * Admin A/B Test Results — لوحة بسيطة لعرض نتائج تجارب A/B.
 * محمية بفحص دور admin (RLS على ab_test_events يسمح للأدمن فقط بالقراءة).
 */
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AdminGuard } from "@/components/admin-guard";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Users, MousePointerClick, Wand2 } from "lucide-react";

export const Route = createFileRoute("/admin/ab-tests")({
  head: () => ({ meta: [{ title: "نتائج اختبارات A/B — رِفد" }] }),
  component: () => (
    <AdminGuard loadingLabel="جاري تحميل نتائج التجارب…">
      <AbTestsPage />
    </AdminGuard>
  ),
});

type Row = {
  experiment: string;
  variant: "A" | "B";
  event_type: "view" | "cta_click" | "demo_try" | "submit";
  session_id: string;
};

type Stats = {
  views: number;
  cta_clicks: number;
  demo_tries: number;
  brief_starts: number;
  unique_sessions: number;
  cta_rate: number;
  brief_start_rate: number;
  demo_rate: number;
};

function calcStats(rows: Row[]): Stats {
  const sessions = new Set(rows.map((r) => r.session_id));
  const views = rows.filter((r) => r.event_type === "view").length;
  const cta_clicks = rows.filter((r) => r.event_type === "cta_click").length;
  const demo_tries = rows.filter((r) => r.event_type === "demo_try").length;
  const brief_starts = rows.filter((r) => r.event_type === "submit").length;
  return {
    views,
    cta_clicks,
    demo_tries,
    brief_starts,
    unique_sessions: sessions.size,
    cta_rate: views > 0 ? (cta_clicks / views) * 100 : 0,
    brief_start_rate: views > 0 ? (brief_starts / views) * 100 : 0,
    demo_rate: views > 0 ? (demo_tries / views) * 100 : 0,
  };
}

function AbTestsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [a, setA] = useState<Stats | null>(null);
  const [b, setB] = useState<Stats | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/auth", search: { redirect: "/admin/ab-tests" } });
      return;
    }
    let active = true;
    (async () => {
      // تحقق من دور admin قبل أي قراءة
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!active) return;
      if (!roleRow) {
        navigate({ to: "/dashboard" });
        return;
      }
      setIsAdmin(true);
      const { data, error } = await supabase
        .from("ab_test_events")
        .select("experiment, variant, event_type, session_id")
        .eq("experiment", "hero_hook")
        .limit(10000);
      if (!active) return;
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      const rows = (data ?? []) as Row[];
      setA(calcStats(rows.filter((r) => r.variant === "A")));
      setB(calcStats(rows.filter((r) => r.variant === "B")));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [authLoading, user, navigate]);

  if (authLoading || (!isAdmin && loading)) {
    return (
      <DashboardShell>
        <div className="mx-auto flex max-w-6xl items-center gap-2 p-6 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          جاري التحقق…
        </div>
      </DashboardShell>
    );
  }
  if (!isAdmin) return null;

  const winner =
    a && b
      ? b.cta_rate > a.cta_rate
        ? "B"
        : a.cta_rate > b.cta_rate
          ? "A"
          : null
      : null;

  const briefWinner =
    a && b
      ? b.brief_start_rate > a.brief_start_rate
        ? "B"
        : a.brief_start_rate > b.brief_start_rate
          ? "A"
          : null
      : null;

  return (
    <DashboardShell>
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-3xl font-extrabold">نتائج A/B Test</h1>
          <p className="mt-1 text-muted-foreground">
            اختبار العنوان الترويجي في الصفحة الرئيسية (hero_hook)
          </p>
        </div>

        {loading && <p className="text-muted-foreground">جاري التحميل...</p>}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6 text-destructive">خطأ: {error}</CardContent>
          </Card>
        )}

        {!loading && !error && a && b && (
          <>
            {winner && (
              <Card className="border-success/40 bg-success/5">
                <CardContent className="flex items-center gap-3 pt-6">
                  <TrendingUp className="h-6 w-6 text-success" />
                  <div>
                    <p className="font-bold">
                       الفائز حالياً في النقر: Variant {winner}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      نسبة نقرات أعلى على CTA الأساسي
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

             {briefWinner && (
               <Card className="border-primary/40 bg-primary/5">
                 <CardContent className="flex items-center gap-3 pt-6">
                   <Wand2 className="h-6 w-6 text-primary" />
                   <div>
                     <p className="font-bold">الفائز في بدء إنشاء الـBrief: Variant {briefWinner}</p>
                     <p className="text-sm text-muted-foreground">هذا هو المعيار الأهم لأنّه يقيس بداية الإنشاء الفعلية</p>
                   </div>
                 </CardContent>
               </Card>
             )}

            <div className="grid gap-4 md:grid-cols-2">
              <VariantCard
                title="Variant A — بدل ما يضيع يومك على المحتوى"
                hint="Pain-led: يبدأ بالألم ثم يعد بأن الباقي على رِفد"
                stats={a}
                isWinner={briefWinner === "A"}
              />
              <VariantCard
                title="Variant B — لا تعيد شرح متجرك كل مرة"
                hint="Fatigue-led: يبيع تقليل التكرار ثم الوعد بسرعة التنفيذ"
                stats={b}
                isWinner={briefWinner === "B"}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">قراءة سريعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                 <p>• <strong>cta_rate</strong> = نقرات CTA الرئيسي ÷ المشاهدات</p>
                 <p>• <strong>brief_start_rate</strong> = بدايات إنشاء الـBrief الفعلية ÷ المشاهدات</p>
                <p>• <strong>demo_rate</strong> = تجارب الـDemo ÷ المشاهدات</p>
                <p>• الحد الأدنى للثقة الإحصائية: <strong>~100 مشاهدة لكل variant</strong></p>
                <p>• كل زائر يُعيَّن له variant ثابت (localStorage) — لا يرى الاثنين</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function VariantCard({
  title,
  hint,
  stats,
  isWinner,
}: {
  title: string;
  hint: string;
  stats: Stats;
  isWinner: boolean;
}) {
  return (
    <Card className={isWinner ? "border-success/50 shadow-elegant" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {isWinner && <Badge className="bg-success text-success-foreground">🏆 فائز</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Metric icon={<Users className="h-4 w-4" />} label="جلسات فريدة" value={stats.unique_sessions} />
        <Metric icon={<Users className="h-4 w-4" />} label="مشاهدات" value={stats.views} />
        <Metric icon={<MousePointerClick className="h-4 w-4" />} label="نقرات CTA" value={stats.cta_clicks} suffix={` (${stats.cta_rate.toFixed(1)}%)`} highlight />
        <Metric icon={<Wand2 className="h-4 w-4" />} label="بدء إنشاء Brief" value={stats.brief_starts} suffix={` (${stats.brief_start_rate.toFixed(1)}%)`} highlight />
        <Metric icon={<Wand2 className="h-4 w-4" />} label="تجارب Demo" value={stats.demo_tries} suffix={` (${stats.demo_rate.toFixed(1)}%)`} />
      </CardContent>
    </Card>
  );
}

function Metric({
  icon,
  label,
  value,
  suffix,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between rounded-lg border border-border p-3 ${highlight ? "bg-primary/5" : ""}`}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`font-bold ${highlight ? "text-primary" : ""}`}>
        {value.toLocaleString("ar-SA")}
        {suffix && <span className="text-xs font-normal text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}
