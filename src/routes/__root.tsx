import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/sonner";
import { CookieBanner } from "@/components/cookie-banner";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">٤٠٤</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">الصفحة غير موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          الصفحة اللي تدوّر عليها مو موجودة أو تم نقلها.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "رِفد للتقنية — محتوى وصور وحملات لمتجرك السعودي" },
      {
        name: "description",
        content:
          "حوّل متجرك السعودي إلى آلة محتوى وحملات ذكية. 50+ قالب جاهز للنصوص والصور بالعامية السعودية مع تحديثات شهرية من رِفد للتقنية.",
      },
      { name: "author", content: "رِفد للتقنية" },
      { name: "theme-color", content: "#1a5d3e" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "ar_SA" },
      { property: "og:site_name", content: "رِفد للتقنية" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "رِفد للتقنية — محتوى وصور وحملات لمتجرك السعودي" },
      { name: "twitter:title", content: "رِفد للتقنية — محتوى وصور وحملات لمتجرك السعودي" },
      {
        property: "og:description",
        content: "50+ قالب ومخرجات محتوى وصور وحملات مناسبة للسوق السعودي مع تحديثات شهرية مستمرة.",
      },
      {
        name: "twitter:description",
        content: "50+ قالب ومخرجات محتوى وصور وحملات مناسبة للسوق السعودي مع تحديثات شهرية مستمرة.",
      },
      { property: "og:image", content: "https://rifd.site/og-image.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "رِفد للتقنية — محتوى وصور وحملات لمتجرك السعودي" },
      { name: "twitter:image", content: "https://rifd.site/og-image.jpg" },
      { name: "twitter:image:alt", content: "رِفد للتقنية — محتوى وصور وحملات لمتجرك السعودي" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "canonical", href: "https://rifd.site/" },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster richColors position="top-center" />
      <CookieBanner />
    </AuthProvider>
  );
}
