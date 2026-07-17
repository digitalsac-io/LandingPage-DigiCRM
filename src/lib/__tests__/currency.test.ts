import { describe, expect, it, vi } from "vitest";
import { convertPrice, getRates, clearRatesCache, FALLBACK_RATES } from "../currency";

describe("currency", () => {
  it("locale→moeda: pt-BR mantém BRL; en=USD; es=EUR; ru=RUB", () => {
    const rates = { USD: 0.2, EUR: 0.1, RUB: 20 };
    expect(convertPrice(100, "pt-BR", rates)).toEqual({ currency: "BRL", value: 100 });
    expect(convertPrice(100, "en", rates)).toEqual({ currency: "USD", value: 20 });
    expect(convertPrice(100, "es", rates)).toEqual({ currency: "EUR", value: 10 });
    expect(convertPrice(100, "ru", rates)).toEqual({ currency: "RUB", value: 2000 });
  });
  it("getRates usa fallback quando API falha e cacheia sucesso por 1h", async () => {
    clearRatesCache();
    const bad = vi.fn(async () => { throw new Error("net"); }) as unknown as typeof fetch;
    expect(await getRates(bad, 0)).toEqual(FALLBACK_RATES);
    const good = vi.fn(async () =>
      new Response(JSON.stringify({ rates: { USD: 0.19, EUR: 0.17, RUB: 17 } }), { status: 200 })
    ) as unknown as typeof fetch;
    clearRatesCache();
    expect((await getRates(good, 0)).USD).toBe(0.19);
    await getRates(good, 3_000_000);
    expect(good).toHaveBeenCalledTimes(1);
  });
  it("getRates cacheia fallback em resposta non-ok para evitar re-fetch", async () => {
    clearRatesCache();
    const notOk = vi.fn(async () =>
      new Response(JSON.stringify({}), { status: 500 })
    ) as unknown as typeof fetch;
    expect(await getRates(notOk, 0)).toEqual(FALLBACK_RATES);
    expect(notOk).toHaveBeenCalledTimes(1);
    // Segunda chamada dentro de 1h deve retornar cache, sem re-fetch
    expect(await getRates(notOk, 3_000_000)).toEqual(FALLBACK_RATES);
    expect(notOk).toHaveBeenCalledTimes(1);
  });
});
