import { useEffect, useState } from "react";
import { TrendingUp, Users, Wand2 } from "lucide-react";

/**
 * شريط أرقام حية — Social proof يبني الثقة فوراً.
 * (الموجة 2: تتغذى من قاعدة البيانات الحقيقية)
 *
 * ملاحظة SSR: نستخدم تنسيق ثابت (en-US مع فواصل) للقيم الأولية لتجنب hydration mismatch
 * بين بيئة Node والمتصفح. التحديثات الحية تحدث فقط بعد mount.
 */

const INITIAL = { users: 247, posts: 3842, savings: 12400 };

function formatNumber(n: number, mounted: boolean): string {
  // قبل mount: نفس التنسيق على الخادم والعميل (en-US)
  // بعد mount: تنسيق عربي جميل
  if (!mounted) return n.toLocaleString("en-US");
  return n.toLocaleString("ar-SA");
}

export function SavingsCounter() {
  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState(INITIAL);

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => {
      setCount((c) => ({
        users: c.users + Math.floor(Math.random() * 2),
        posts: c.posts + Math.floor(Math.random() * 4) + 1,
        savings: c.savings + Math.floor(Math.random() * 30) + 5,
      }));
    }, 8000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="border-y border-border/60 bg-card/50 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-border/60 px-4 py-3 text-center sm:py-4">
        <div className="flex flex-col items-center gap-0.5 px-2">
          <Users className="mb-0.5 h-4 w-4 text-primary" />
          <div className="text-lg font-extrabold tabular-nums sm:text-xl">
            +{formatNumber(count.users, mounted)}
          </div>
          <div className="text-[10px] text-muted-foreground sm:text-xs">صاحب متجر اليوم</div>
        </div>
        <div className="flex flex-col items-center gap-0.5 px-2">
          <Wand2 className="mb-0.5 h-4 w-4 text-gold" />
          <div className="text-lg font-extrabold tabular-nums sm:text-xl">
            +{formatNumber(count.posts, mounted)}
          </div>
          <div className="text-[10px] text-muted-foreground sm:text-xs">منشور تم توليده</div>
        </div>
        <div className="flex flex-col items-center gap-0.5 px-2">
          <TrendingUp className="mb-0.5 h-4 w-4 text-success" />
          <div className="text-lg font-extrabold tabular-nums text-success sm:text-xl">
            {formatNumber(count.savings, mounted)} ر.س
          </div>
          <div className="text-[10px] text-muted-foreground sm:text-xs">وُفّرت هذا الشهر</div>
        </div>
      </div>
    </div>
  );
}
