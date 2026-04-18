import { useEffect, useState } from "react";
import { TrendingUp, Users, Wand2 } from "lucide-react";

/**
 * شريط أرقام حية — Social proof يبني الثقة فوراً.
 * (الموجة 2: تتغذى من قاعدة البيانات الحقيقية)
 */
export function SavingsCounter() {
  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState({ users: 247, posts: 3842, savings: 12400 });

  useEffect(() => {
    setMounted(true);
    // محاكاة عداد حي يزداد ببطء
    const id = setInterval(() => {
      setCount((c) => ({
        users: c.users + Math.floor(Math.random() * 2),
        posts: c.posts + Math.floor(Math.random() * 4) + 1,
        savings: c.savings + Math.floor(Math.random() * 30) + 5,
      }));
    }, 8000);
    return () => clearInterval(id);
  }, []);

  if (!mounted) return null;

  return (
    <div className="border-y border-border/60 bg-card/50 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-border/60 px-4 py-3 text-center sm:py-4">
        <div className="flex flex-col items-center gap-0.5 px-2">
          <Users className="mb-0.5 h-4 w-4 text-primary" />
          <div className="text-lg font-extrabold tabular-nums sm:text-xl">
            +{count.users.toLocaleString("ar-SA")}
          </div>
          <div className="text-[10px] text-muted-foreground sm:text-xs">صاحب متجر اليوم</div>
        </div>
        <div className="flex flex-col items-center gap-0.5 px-2">
          <Wand2 className="mb-0.5 h-4 w-4 text-gold" />
          <div className="text-lg font-extrabold tabular-nums sm:text-xl">
            +{count.posts.toLocaleString("ar-SA")}
          </div>
          <div className="text-[10px] text-muted-foreground sm:text-xs">منشور تم توليده</div>
        </div>
        <div className="flex flex-col items-center gap-0.5 px-2">
          <TrendingUp className="mb-0.5 h-4 w-4 text-success" />
          <div className="text-lg font-extrabold tabular-nums text-success sm:text-xl">
            {count.savings.toLocaleString("ar-SA")} ر.س
          </div>
          <div className="text-[10px] text-muted-foreground sm:text-xs">وُفّرت هذا الشهر</div>
        </div>
      </div>
    </div>
  );
}
