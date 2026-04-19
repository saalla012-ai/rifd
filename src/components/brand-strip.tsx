import { ShoppingCart, Store, Package, Sparkles } from "lucide-react";

/**
 * شريط "متوافق مع" — نص قانوني آمن (بدون شعارات حقيقية لأي طرف ثالث).
 */
export function BrandStrip() {
  const items = [
    { icon: Store, label: "سلة" },
    { icon: ShoppingCart, label: "زد" },
    { icon: Package, label: "شوبيفاي" },
    { icon: Sparkles, label: "أي متجر سعودي" },
  ];
  return (
    <section aria-label="منصات متوافقة" className="border-y border-border/60 bg-secondary/30">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-5 sm:flex-row sm:justify-center sm:gap-6">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          صُمّم لمتاجر:
        </span>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
          {items.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground/80"
            >
              <item.icon className="h-3.5 w-3.5 text-primary" />
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
