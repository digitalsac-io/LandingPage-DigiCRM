import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { routing } from "@/i18n/routing";
import { getSiteConfig } from "@/lib/config";
import { darken } from "@/lib/colors";
import WhatsAppFloat from "@/components/landing/WhatsAppFloat";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const config = await getSiteConfig();
  const seo = config.seo[locale] ?? { title: "", description: "" };
  return {
    title: seo.title || "DigitalSac",
    description: seo.description || "",
    icons: config.favicon ? [{ rel: "icon", url: config.favicon }] : undefined,
    openGraph: config.ogImage ? { images: [config.ogImage] } : undefined
  };
}

export default async function LocaleLayout({
  children, params
}: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const config = await getSiteConfig();
  const brandVars = `:root{--brand:${config.primaryColor};--brand-dark:${darken(config.primaryColor, 0.2)};--accent-c:${config.accentColor};}`;
  return (
    <html lang={locale} suppressHydrationWarning>
      <head><style dangerouslySetInnerHTML={{ __html: brandVars }} /></head>
      <body className="bg-white text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider>
            {children}
            {config.whatsapp && (
              <WhatsAppFloat
                number={config.whatsapp.replace(/\D/g, "")}
                subjects={(config.whatsSubjects ?? "").split("\n").map((s: string) => s.trim()).filter(Boolean)}
              />
            )}
          </NextIntlClientProvider>
        </ThemeProvider>
        {/* conteúdo admin-only (mesmo modelo de confiança do termsHtml); scripts executam porque vêm no HTML SSR inicial */}
        {config.customScripts && <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: config.customScripts }} />}
      </body>
    </html>
  );
}
