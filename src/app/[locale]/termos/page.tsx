import { setRequestLocale } from "next-intl/server";
import { getSiteConfig } from "@/lib/config";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const dynamic = "force-dynamic";

export default async function Termos({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const config = await getSiteConfig();
  return (
    <>
      <Navbar locale={locale} />
      <main className="mx-auto max-w-3xl px-4 py-16">
        {config.termsUrl ? (
          <iframe src={config.termsUrl} className="h-[75vh] w-full rounded-xl border border-zinc-200 dark:border-zinc-800" />
        ) : (
          <article className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: config.termsHtml || "<p>—</p>" }} />
        )}
      </main>
      <Footer />
    </>
  );
}
