export const FALLBACK_RATES: Record<string, number> = { USD: 0.18, EUR: 0.165, RUB: 16.5 };
const LOCALE_CURRENCY: Record<string, string> = { "pt-BR": "BRL", en: "USD", es: "EUR", ru: "RUB" };

let ratesCache: { at: number; rates: Record<string, number> } | null = null;

export function clearRatesCache() {
  ratesCache = null;
}

export async function getRates(
  fetchImpl: typeof fetch = fetch,
  nowMs: number = Date.now()
): Promise<Record<string, number>> {
  if (ratesCache && nowMs - ratesCache.at < 60 * 60 * 1000) return ratesCache.rates;
  try {
    const res = await fetchImpl("https://open.er-api.com/v6/latest/BRL");
    if (!res.ok) {
      ratesCache = { at: nowMs, rates: FALLBACK_RATES };
      return FALLBACK_RATES;
    }
    const json = (await res.json()) as { rates?: Record<string, number> };
    const rates = {
      USD: json.rates?.USD ?? FALLBACK_RATES.USD,
      EUR: json.rates?.EUR ?? FALLBACK_RATES.EUR,
      RUB: json.rates?.RUB ?? FALLBACK_RATES.RUB
    };
    ratesCache = { at: nowMs, rates };
    return rates;
  } catch {
    ratesCache = { at: nowMs, rates: FALLBACK_RATES };
    return FALLBACK_RATES;
  }
}

export function convertPrice(
  priceBrl: number,
  locale: string,
  rates: Record<string, number>
): { currency: string; value: number } {
  const currency = LOCALE_CURRENCY[locale] ?? "BRL";
  if (currency === "BRL") return { currency, value: priceBrl };
  return { currency, value: Math.round(priceBrl * (rates[currency] ?? 1) * 100) / 100 };
}
