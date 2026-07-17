import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSiteConfig } from "@/lib/config";
import { fetchPlans, type PlanView } from "@/lib/backend";
import { convertPrice, getRates } from "@/lib/currency";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SignupForm } from "@/components/signup/SignupForm";
import type { PlanCardData } from "@/components/landing/PlanCard";
import type { CaptchaProvider } from "@/lib/captcha";

export const dynamic = "force-dynamic";

function formatMoney(value: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
}

export default async function Cadastro({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ plan?: string }>;
}) {
  const { locale } = await params;
  const { plan } = await searchParams;
  setRequestLocale(locale);
  const [t, tPlans, config] = await Promise.all([
    getTranslations("landing.signup"),
    getTranslations("landing.plans"),
    getSiteConfig()
  ]);

  let plans: PlanView[] = [];
  try {
    if (config.backendUrl) plans = await fetchPlans(config.backendUrl);
  } catch { /* cards vazios: form mostra erro ao carregar */ }
  const rates = config.currencyConversion ? await getRates() : null;

  const sortedPlans = [...plans].sort((a, b) => {
    const fa = a.id === config.featuredPlanId ? 0 : 1;
    const fb = b.id === config.featuredPlanId ? 0 : 1;
    return fa - fb || a.price - b.price; // destaque primeiro, depois preço crescente
  });
  const cards: PlanCardData[] = sortedPlans.map(p => {
    const brl = formatMoney(p.price, "BRL", "pt-BR");
    let approxLabel: string | undefined;
    if (rates && locale !== "pt-BR") {
      const { currency, value } = convertPrice(p.price, locale, rates);
      approxLabel = `${tPlans("approx")} ${formatMoney(value, currency, locale)}`;
    }
    const recurrenceKey = `recurrences.${p.recurrence}`;
    const lines = [
      `${p.users} ${tPlans("users")}`,
      `${p.channels} ${tPlans("channels")}`
    ];
    return {
      id: p.id,
      name: p.name,
      priceLabel: brl,
      approxLabel,
      recurrenceLabel: `/${tPlans.has(recurrenceKey as never) ? tPlans(recurrenceKey as never) : p.recurrence.toLowerCase()}`,
      trialLabel: p.trial ? tPlans("trialBadge", { days: p.trialDays }) : undefined,
      featured: config.featuredPlanId === p.id,
      lines,
      moduleLabels: p.modules.map(m => tPlans.has(`moduleNames.${m}` as never) ? tPlans(`moduleNames.${m}` as never) : m)
    };
  });

  const prefix = locale === "pt-BR" ? "" : `/${locale}`;
  return (
    <>
      <Navbar locale={locale} />
      <main className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="mb-10 text-center text-3xl font-bold md:text-4xl">{t("title")}</h1>
        {cards.length === 0 ? (
          <p className="text-center text-zinc-500">{tPlans("loadError")}</p>
        ) : (
          <SignupForm
            cards={cards}
            preselected={plan ?? ""}
            captcha={{ provider: config.captchaProvider as CaptchaProvider, siteKey: config.captchaSiteKey }}
            appUrl={config.appUrl}
            termsHref={`${prefix}/termos`}
            cardT={{ modulesIncluded: tPlans("modulesIncluded"), select: tPlans("select"), featured: tPlans("featured") }}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
