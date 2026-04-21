import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, RefreshCw, ArrowLeft, Shield, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

type ScanRow = {
  id: string;
  scan_type: string;
  status: "clean" | "dirty" | "error";
  total_matches: number;
  details: any;
  error_message: string | null;
  scanned_at: string;
};

export const Route = createFileRoute("/admin/domain-scan")({
  component: DomainScanPage,
});

function DomainScanPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<ScanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!data) {
        navigate({ to: "/dashboard" });
        return;
      }
      setIsAdmin(true);
      await loadRows();
    })();
  }, [user, authLoading]);

  async function loadRows() {
    setLoading(true);
    const { data, error } = await supabase
      .from("domain_scan_log")
      .select("*")
      .order("scanned_at", { ascending: false })
      .limit(30);
    if (error) toast.error(error.message);
    else setRows((data ?? []) as ScanRow[]);
    setLoading(false);
  }

  async function runScanNow() {
    setRunning(true);
    try {
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch("/hooks/domain-scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(
          json.status === "clean"
            ? "✅ نظيف — لا توجد بقايا"
            : `⚠️ ${json.totalMatches} تطابق`
        );
        await loadRows();
      } else {
        toast.error(json.error || "فشل الفحص");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  if (authLoading || !isAdmin) {
    return (
      <DashboardShell profile={profile}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </DashboardShell>
    );
  }

  const lastScan = rows[0];

  return (
    <DashboardShell profile={profile}>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <Link
            to="/admin/audit"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            العودة للوحة الإدارة
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Shield className="h-6 w-6" />
            فحص النطاقات القديمة
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            مراقبة يومية لأي ظهور لـ <code>rifd.club</code> أو <code>rifd.tech</code> في القاعدة أو الموقع المنشور
          </p>
        </div>
        <Button onClick={runScanNow} disabled={running}>
          {running ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          فحص فوري
        </Button>
      </div>

      {lastScan && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {lastScan.status === "clean" ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  آخر فحص: نظيف
                </>
              ) : lastScan.status === "dirty" ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  آخر فحص: {lastScan.total_matches} تطابق
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  آخر فحص: خطأ
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {new Date(lastScan.scanned_at).toLocaleString("ar-SA")}
            </p>
            {lastScan.status === "dirty" && (
              <pre className="mt-3 overflow-auto rounded bg-muted p-3 text-xs">
                {JSON.stringify(lastScan.details, null, 2)}
              </pre>
            )}
            {lastScan.error_message && (
              <p className="mt-2 text-sm text-destructive">{lastScan.error_message}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>سجل الفحوصات (آخر 30)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد فحوصات بعد. اضغط "فحص فوري".</p>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded border p-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        r.status === "clean"
                          ? "secondary"
                          : r.status === "dirty"
                            ? "destructive"
                            : "outline"
                      }
                    >
                      {r.status === "clean" ? "نظيف" : r.status === "dirty" ? "تطابقات" : "خطأ"}
                    </Badge>
                    <span className="text-muted-foreground">
                      {new Date(r.scanned_at).toLocaleString("ar-SA")}
                    </span>
                  </div>
                  <span className="font-mono text-xs">
                    {r.total_matches} match{r.total_matches !== 1 ? "es" : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
