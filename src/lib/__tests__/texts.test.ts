import { describe, expect, it } from "vitest";
import { mergeTexts } from "../texts";

describe("mergeTexts", () => {
  const base = { landing: { hero: { title: "Padrão", subtitle: "Sub" }, faq: { title: "FAQ" } } };
  it("sobrescreve apenas as chaves vindas do DB", () => {
    const out = mergeTexts(base, [{ section: "hero", key: "title", value: "Custom" }]);
    expect(out.landing.hero.title).toBe("Custom");
    expect(out.landing.hero.subtitle).toBe("Sub");
    expect(out.landing.faq.title).toBe("FAQ");
  });
  it("ignora seção desconhecida sem quebrar", () => {
    const out = mergeTexts(base, [{ section: "nada", key: "x", value: "y" }]);
    expect((out.landing as Record<string, unknown>).nada).toEqual({ x: "y" });
  });
  it("não muta o objeto base", () => {
    mergeTexts(base, [{ section: "hero", key: "title", value: "Z" }]);
    expect(base.landing.hero.title).toBe("Padrão");
  });
});
