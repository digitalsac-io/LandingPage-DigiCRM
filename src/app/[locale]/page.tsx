import { setRequestLocale } from "next-intl/server";
import { getSiteConfig } from "@/lib/config";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Plans } from "@/components/landing/Plans";
import { Faq } from "@/components/landing/Faq";
import { Cta } from "@/components/landing/Cta";
import { Footer } from "@/components/landing/Footer";

export const dynamic = "force-dynamic"; // config/planos mudam em runtime

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const config = await getSiteConfig();
  return (
    <>
      <Navbar locale={locale} />
      <main>
        <Hero />
        {config.sections.features && <Features />}
        {config.sections.plans && <Plans locale={locale} />}
        {config.sections.faq && <Faq locale={locale} />}
        {config.sections.cta && <Cta />}
      </main>
      <Footer />
    </>
  );
}
