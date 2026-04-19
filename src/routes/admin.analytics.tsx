import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { Loader2, Users, Sparkles, DollarSign, TrendingUp, RefreshCw, ArrowLeft } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getAdminAnalytics, type AdminAnalytics } from "@/server/admin-analytics";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "تحليلات الأدمن — رِفد" }] }),
  component: AdminAnalyticsPage,
});

const COLORS = ["#1a5d3e", "#d4a017", "#0ea5e9", "#a855f7", "#ef4444", "#10b981"];

function fmtUSD(n: number): string {
  return `$${n.toFixed(4)}`;
}

function AdminAnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("سجّل الدخول أولاً");
      const result = await getAdminAnalytics({
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر التحميل");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      void navigate({ to: "/auth" });
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button onClick={load} variant="outline" size="sm" className="mt-4">
            <RefreshCw className="h-4 w-4" /> حاول مجدداً
          </Button>
        </div>
      </DashboardShell>
    );
  }

  if (!data) return null;

  return (
    <DashboardShell>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">تحليلات الأدمن</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            نظرة عامة على المنصة لشهر <span className="font-mono">{data.month}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-3.5 w-3.5" /> تحديث
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/subscriptions">الاشتراكات <ArrowLeft className="h-3.5 w-3.5" /></Link>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "إجمالي المستخدمين", value: data.totals.users.toLocaleString("ar-SA"), icon: Users, color: "text-primary" },
          { label: "أكملوا onboarding", value: data.totals.onboarded_users.toLocaleString("ar-SA"), icon: TrendingUp, color: "text-success" },
          { label: "مشتركين نشطين", value: data.totals.active_subscribers.toLocaleString("ar-SA"), icon: Sparkles, color: "text-gold" },
          { label: "توليدات هذا الشهر", value: data.totals.generations_this_month.toLocaleString("ar-SA"), icon: Sparkles, color: "text-primary" },
          { label: "كلفة هذا الشهر", value: fmtUSD(data.totals.cost_usd_this_month), icon: DollarSign, color: "text-warning" },
          { label: "متوسط كلفة/مستخدم نشط", value: fmtUSD(data.totals.avg_cost_per_active_user), icon: DollarSign, color: "text-muted-foreground" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <div className="mt-2 text-2xl font-extrabold">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Funnel */}
      <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-soft">
        <h3 className="text-base font-bold">قمع التحويل</h3>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {[
            { label: "سجّل", value: data.funnel.signed_up, base: data.funnel.signed_up },
            { label: "أكمل onboarding", value: data.funnel.onboarded, base: data.funnel.signed_up },
            { label: "أوّل توليدة", value: data.funnel.first_generation, base: data.funnel.signed_up },
            { label: "اشترك", value: data.funnel.paid, base: data.funnel.signed_up },
          ].map((step, i) => {
            const pct = step.base > 0 ? Math.round((step.value / step.base) * 100) : 0;
            return (
              <div key={i} className="rounded-lg bg-secondary/50 p-3 text-center">
                <div className="text-xs text-muted-foreground">{step.label}</div>
                <div className="mt-1 text-xl font-extrabold">{step.value.toLocaleString("ar-SA")}</div>
                <div className="text-xs text-primary">{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily generations chart */}
      <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-soft">
        <h3 className="text-base font-bold">التوليدات اليومية (آخر 30 يوم)</h3>
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.daily_generations}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="text" stroke="#1a5d3e" name="نص" strokeWidth={2} />
              <Line type="monotone" dataKey="image" stroke="#d4a017" name="صور" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* By model */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h3 className="text-base font-bold">الكلفة حسب النموذج</h3>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.by_model}
                  dataKey="cost_usd"
                  nameKey="model"
                  outerRadius={90}
                  label={(p) => {
                    const name = String((p as { name?: unknown }).name ?? "");
                    const value = Number((p as { value?: unknown }).value ?? 0);
                    return `${name.split("/").pop()}: $${value.toFixed(4)}`;
                  }}
                >
                  {data.by_model.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => fmtUSD(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost bar by model */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h3 className="text-base font-bold">عدد التوليدات حسب النموذج</h3>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.by_model}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="model"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v: string) => v.split("/").pop() ?? v}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1a5d3e" name="عدد التوليدات" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top users */}
      <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-soft">
        <h3 className="text-base font-bold">أعلى 10 مستخدمين كلفةً (هذا الشهر)</h3>
        {data.top_users.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">لا يوجد توليدات هذا الشهر بعد.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-right text-sm">
              <thead className="border-b border-border text-xs text-muted-foreground">
                <tr>
                  <th className="py-2 font-medium">المستخدم</th>
                  <th className="py-2 font-medium">الباقة</th>
                  <th className="py-2 font-medium">توليدات</th>
                  <th className="py-2 font-medium">توكنز</th>
                  <th className="py-2 font-medium">كلفة USD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.top_users.map((u) => (
                  <tr key={u.user_id}>
                    <td className="py-2">
                      <div className="font-medium">{u.store_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{u.email ?? u.user_id.slice(0, 8)}</div>
                    </td>
                    <td className="py-2 font-mono text-xs">{u.plan}</td>
                    <td className="py-2">{u.generations.toLocaleString("ar-SA")}</td>
                    <td className="py-2">{u.total_tokens.toLocaleString("ar-SA")}</td>
                    <td className="py-2 font-mono">{fmtUSD(u.cost_usd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
