import { getTranslations } from "next-intl/server";
import { getSiteConfig } from "@/lib/config";
import { fetchPlans, type PlanView } from "@/lib/backend";
import { convertPrice, getRates } from "@/lib/currency";
import { PlanCard, type PlanCardData } from "./PlanCard";

function formatMoney(value: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
}

export async function Plans({ locale }: { locale: string }) {
  const t = await getTranslations("landing.plans");
  const config = await getSiteConfig();
  let plans: PlanView[] = [];
  let failed = false;
  try {
    plans = config.backendUrl ? await fetchPlans(config.backendUrl) : [];
    if (!config.backendUrl) failed = true;
  } catch {
    failed = true;
  }
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
      approxLabel = `${t("approx")} ${formatMoney(value, currency, locale)}`;
    }
    const lines = [
      `${p.users} ${t("users")}`,
      `${p.channels} ${t("channels")}`,
      ...(p.contractedSpace ? [`${p.contractedSpace} ${t("storage")}`] : []),
      ...(p.maxContacts ? [`${p.maxContacts.toLocaleString(locale)} ${t("contacts")}`] : [])
    ];
    const recurrenceKey = `recurrences.${p.recurrence}`;
    return {
      id: p.id, name: p.name, priceLabel: brl, approxLabel,
      recurrenceLabel: `/${t.has(recurrenceKey as never) ? t(recurrenceKey as never) : p.recurrence.toLowerCase()}`,
      trialLabel: p.trial ? t("trialBadge", { days: p.trialDays }) : undefined,
      featured: config.featuredPlanId === p.id,
      lines,
      moduleLabels: p.modules.map(m => t.has(`moduleNames.${m}` as never) ? t(`moduleNames.${m}` as never) : m)
    };
  });

  const GRID: Record<number, string> = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4"
  };
  const rawCols = Number(config.plansColumns);
  const cols = (rawCols === 2 || rawCols === 3 || rawCols === 4) ? rawCols : 3;
  const gridCols = GRID[cols];

  return (
    <section id="plans" className="bg-zinc-50 py-20 dark:bg-zinc-900/40">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-3xl font-bold md:text-4xl">{t("title")}</h2>
        <p className="mt-3 text-center text-zinc-600 dark:text-zinc-400">{t("subtitle")}</p>
        {failed || cards.length === 0 ? (
          <p className="mt-12 text-center text-zinc-500">{t("loadError")}</p>
        ) : (
          <div className={`mt-12 grid items-start gap-6 ${gridCols}`}>
            {cards.map(card => (
              <PlanCard key={card.id} plan={card} href={`/cadastro?plan=${card.id}`}
                t={{ modulesIncluded: t("modulesIncluded"), select: t("select"), featured: t("featured") }}
                compact={cols >= 4} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
