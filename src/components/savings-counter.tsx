import { useEffect, useState } from "react";
import { TrendingUp, Users, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * عداد الأرقام الحية — يقرأ من قاعدة البيانات الحقيقية.
 * - لو عدد المستخدمين النشطين <50: يُخفي العداد ويعرض رسالة "كن من الأوائل"
 * - لو الأرقام كافية: يعرض users / posts / savings
 *
 * ملاحظة SSR: لا shroud ولا hydration mismatch لأن القراءة بعد mount.
 */

const RIYAL_PER_POST = 27; // تقدير محافظ لتكلفة منشور احترافي
const MIN_USERS_TO_SHOW = 50;

function formatNumber(n: number): string {
  return n.toLocaleString("ar-SA");
}

export function SavingsCounter() {
  const [stats, setStats] = useState<{
    users: number;
    posts: number;
    savings: number;
  } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const since = new Date();
        since.setDate(since.getDate() - 30);

        // عدد المنشورات في آخر 30 يوم
        const postsRes = await supabase
          .from("generations")
          .select("user_id", { count: "exact", head: false })
          .gte("created_at", since.toISOString())
          .limit(5000);

        if (cancelled) return;

        const totalPosts = postsRes.count ?? 0;
        const uniqueUsers = new Set(
          (postsRes.data ?? []).map((r: { user_id: string }) => r.user_id)
        ).size;
        const savings = totalPosts * RIYAL_PER_POST;

        setStats({ users: uniqueUsers, posts: totalPosts, savings });
      } catch {
        // تجاهل بصمت — fallback يعرض الرسالة
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // قبل التحميل: skeleton خفيف
  if (!loaded) {
    return (
      <div className="border-y border-border/60 bg-card/50 backdrop-blur">
        <div className="mx-auto h-[68px] max-w-7xl px-4" aria-hidden />
      </div>
    );
  }

  // أرقام غير كافية: لا نعرض أرقام مزيفة
  if (!stats || stats.users < MIN_USERS_TO_SHOW) {
    return (
      <div className="border-y border-border/60 bg-gradient-to-l from-primary/5 via-card/50 to-gold/5">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center">
          <p className="text-sm font-bold sm:text-base">
            ⭐ <span className="text-gradient-primary">كن من أوائل أصحاب المتاجر</span> الذين
            يستخدمون رِفد —{" "}
            <span className="text-muted-foreground">انضم قبل ارتفاع الأسعار</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-y border-border/60 bg-card/50 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-border/60 px-4 py-3 text-center sm:py-4">
        <div className="flex flex-col items-center gap-0.5 px-2">
          <Users className="mb-0.5 h-4 w-4 text-primary" />
          <div className="text-lg font-extrabold tabular-nums sm:text-xl">
            +{formatNumber(stats.users)}
          </div>
          <div className="text-[10px] text-muted-foreground sm:text-xs">صاحب متجر نشط</div>
        </div>
        <div className="flex flex-col items-center gap-0.5 px-2">
          <Wand2 className="mb-0.5 h-4 w-4 text-gold" />
          <div className="text-lg font-extrabold tabular-nums sm:text-xl">
            +{formatNumber(stats.posts)}
          </div>
          <div className="text-[10px] text-muted-foreground sm:text-xs">منشور تم توليده</div>
        </div>
        <div className="flex flex-col items-center gap-0.5 px-2">
          <TrendingUp className="mb-0.5 h-4 w-4 text-success" />
          <div className="text-lg font-extrabold tabular-nums text-success sm:text-xl">
            {formatNumber(stats.savings)} ر.س
          </div>
          <div className="text-[10px] text-muted-foreground sm:text-xs">
            وُفّرت في 30 يوم
          </div>
        </div>
      </div>
    </div>
  );
}
