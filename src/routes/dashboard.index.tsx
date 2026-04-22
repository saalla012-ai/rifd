import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Wand2, Image as ImageIcon, ImagePlus, Sparkles, TrendingUp, Clock, Star, FileText, ArrowLeft, Phone, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { currentRiyadhMonth } from "@/lib/usage-month";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "لوحة التحكم — رِفد" }] }),
  component: DashboardPage,
});

const LIMITS = {
  free: { text: 5, image: 2, label: "مجاني" },
  pro: { text: 1000, image: 60, label: "احترافي" },
  business: { text: 5000, image: 300, label: "أعمال" },
};

function currentMonth() {
  return currentRiyadhMonth();
}

type RecentItem = {
  id: string;
  type: "text" | "image" | "image_enhance";
  prompt: string;
  created_at: string;
  metadata: { template_title?: string } | null;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `قبل ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `قبل ${h} س`;
  const d = Math.floor(h / 24);
  return `قبل ${d} يوم`;
}

function DashboardPage() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<{ text: number; image: number; favs: number } | null>(null);
  const [recent, setRecent] = useState<RecentItem[]>([]);

  // نستخدم user.id (string) كـdependency بدل كائن user (يتغيّر مرجعه عند كل auth event)
  // لتفادي تكرار الاستعلامات على usage_logs و generations عند re-renders.
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const month = currentMonth();
      const [usageRes, favsRes, recentRes] = await Promise.all([
        supabase
          .from("usage_logs")
          .select("text_count, image_count")
          .eq("user_id", userId)
          .eq("month", month)
          .maybeSingle(),
        supabase
          .from("generations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("is_favorite", true),
        supabase
          .from("generations")
          .select("id, type, prompt, created_at, metadata")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      if (cancelled) return;
      setStats({
        text: usageRes.data?.text_count ?? 0,
        image: usageRes.data?.image_count ?? 0,
        favs: favsRes.count ?? 0,
      });
      setRecent((recentRes.data as RecentItem[] | null) ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const plan = (profile?.plan ?? "free") as keyof typeof LIMITS;
  const limits = LIMITS[plan];

  const profileFields = [
    profile?.store_name,
    profile?.product_type,
    profile?.audience,
    profile?.tone,
    profile?.brand_color,
    profile?.brand_personality,
    profile?.unique_selling_point,
    profile?.shipping_policy,
    profile?.exchange_policy,
    profile?.cta_style,
  ];
  const filled = profileFields.filter(Boolean).length;
  const completionPct = Math.round((filled / profileFields.length) * 100);

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold">
          مرحباً {profile?.full_name ?? profile?.store_name ?? ""} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          هذي نظرة سريعة على نشاطك في رِفد
        </p>
        {(profile?.store_name || profile?.whatsapp) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {profile?.store_name && (
              <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 text-xs font-bold">
                <Sparkles className="h-3 w-3 text-primary" />
                {profile.store_name}
              </Badge>
            )}
            {profile?.whatsapp ? (
              <Badge variant="outline" className="gap-1.5 px-2.5 py-1 text-xs">
                <Phone className="h-3 w-3 text-success" />
                <span dir="ltr" className="font-mono">{profile.whatsapp}</span>
                <Link
                  to="/dashboard/settings"
                  aria-label="تعديل رقم الواتساب"
                  className="ms-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="h-3 w-3" />
                </Link>
              </Badge>
            ) : (
              <Link
                to="/dashboard/settings"
                className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-xs font-bold text-warning transition-colors hover:bg-warning/20"
              >
                <Phone className="h-3 w-3" />
                أضف رقم واتساب
              </Link>
            )}
          </div>
        )}
      </div>

      {/* بطاقات الأدوات الرئيسية */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            to: "/dashboard/generate-text" as const,
            title: "توليد نص",
            desc: "منشورات، أوصاف منتجات، إعلانات",
            icon: Wand2,
            tone: "from-primary/20 via-primary/5 to-transparent",
            iconBg: "bg-primary/15 text-primary",
            cta: "ابدأ الكتابة",
          },
          {
            to: "/dashboard/generate-image" as const,
            title: "توليد صور",
            desc: "بوسترات وصور منتجات بالـAI",
            icon: ImageIcon,
            tone: "from-gold/25 via-gold/5 to-transparent",
            iconBg: "bg-gold/15 text-gold",
            cta: "أنشئ صورة",
          },
          {
            to: "/dashboard/edit-image" as const,
            title: "تعديل صور",
            desc: "ارفع صورتك وعدّلها بالذكاء",
            icon: ImagePlus,
            tone: "from-success/25 via-success/5 to-transparent",
            iconBg: "bg-success/15 text-success",
            cta: "عدّل صورة",
            badge: "جديد",
          },
        ].map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className={`group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${card.tone} bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant`}
          >
            {card.badge && (
              <span className="absolute top-3 left-3 rounded-full bg-success px-2 py-0.5 text-[10px] font-bold text-success-foreground">
                {card.badge}
              </span>
            )}
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-lg font-extrabold">{card.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{card.desc}</p>
            <div className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary transition-transform group-hover:-translate-x-1">
              {card.cta} <ArrowLeft className="h-4 w-4" />
            </div>
          </Link>
        ))}
      </div>

      {/* إحصائيات */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "توليدات نصية (هذا الشهر)", value: `${stats?.text ?? 0} / ${limits.text}`, icon: Wand2, color: "text-primary" },
          { label: "توليدات صور (هذا الشهر)", value: `${stats?.image ?? 0} / ${limits.image}`, icon: ImageIcon, color: "text-gold" },
          { label: "المفضلة", value: `${stats?.favs ?? 0}`, icon: Star, color: "text-warning" },
          { label: "الباقة", value: limits.label, icon: Sparkles, color: "text-success" },
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

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-soft">
          <h3 className="text-base font-bold">إجراءات سريعة ⚡</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              { to: "/dashboard/generate-text" as const, label: "📱 منشور إنستقرام" },
              { to: "/dashboard/generate-text" as const, label: "🛍️ وصف منتج" },
              { to: "/dashboard/generate-image" as const, label: "🎨 بوستر إعلاني" },
              { to: "/dashboard/generate-image" as const, label: "📸 صورة منتج" },
            ].map((q, i) => (
              <Button key={i} asChild variant="outline" className="justify-start">
                <Link to={q.to}>{q.label}</Link>
              </Button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h3 className="text-base font-bold">حصة الصور</h3>
          <Progress value={limits.image === 0 ? 0 : ((stats?.image ?? 0) / limits.image) * 100} className="mt-3" />
          <p className="mt-2 text-xs text-muted-foreground">
            {stats?.image ?? 0} من {limits.image} صورة هذا الشهر
          </p>
          <Button asChild size="sm" variant="link" className="mt-2 h-auto p-0 text-primary">
            <Link to="/dashboard/usage">عرض التفاصيل ←</Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold">آخر التوليدات</h3>
          <Button asChild variant="ghost" size="sm" className="text-primary">
            <Link to="/dashboard/library">عرض الكل ←</Link>
          </Button>
        </div>
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            ما عندك توليدات بعد. ابدأ من <Link to="/dashboard/generate-text" className="text-primary">توليد نص</Link>.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  {r.type === "text" ? <FileText className="h-3 w-3 shrink-0 text-primary" /> : <ImageIcon className="h-3 w-3 shrink-0 text-gold" />}
                  <span className="truncate font-medium">{r.metadata?.template_title ?? r.prompt.slice(0, 50)}</span>
                </span>
                <span className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {timeAgo(r.created_at)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {completionPct < 100 && (
        <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 font-bold">
                <TrendingUp className="h-4 w-4 text-primary" /> ملف متجرك مكتمل بنسبة {completionPct}%
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                أكمل ذاكرة متجرك 2.0 للحصول على نتائج أذكى وأكثر تراكمية في كل توليدة لاحقة
              </p>
            </div>
            <Button asChild size="sm">
              <Link to="/dashboard/store-profile">إكمال</Link>
            </Button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
