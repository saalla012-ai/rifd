import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";

export const Route = createFileRoute("/dashboard/library")({
  head: () => ({ meta: [{ title: "مكتبتي — رِفد" }] }),
  component: () => (
    <DashboardShell>
      <h1 className="text-2xl font-extrabold">مكتبتي</h1>
      <p className="mt-1 text-sm text-muted-foreground">المفضلة وكل توليداتك السابقة</p>
      <div className="mt-6 rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        ما عندك توليدات بعد. ابدأ من <span className="text-primary">توليد نص</span> أو <span className="text-primary">توليد صور</span>.
      </div>
    </DashboardShell>
  ),
});
