import { describe, expect, it } from "vitest";
import type { PlanCardData } from "@/components/landing/PlanCard";

// Pure unit tests for the parse/serialise logic — no DB needed.
// We extract the helpers inline to avoid importing prisma.

type Sections = { features: boolean; plans: boolean; faq: boolean; cta: boolean };

const DEFAULT_SECTIONS: Sections = { features: true, plans: true, faq: true, cta: true };

function safeParse<T>(json: string, fallback: T): T {
  try { return { ...fallback, ...(JSON.parse(json) as T) }; } catch { return fallback; }
}

describe("config safeParse", () => {
  it("planExtras: parses valid JSON", () => {
    const raw = JSON.stringify({ "plan-1": ["10 canais", "-Não inclui backup"] });
    const result = safeParse<Record<string, string[]>>(raw, {});
    expect(result["plan-1"]).toEqual(["10 canais", "-Não inclui backup"]);
  });

  it("planExtras: returns empty object on invalid JSON", () => {
    expect(safeParse<Record<string, string[]>>("not-json", {})).toEqual({});
  });

  it("planExtras: returns empty object on empty JSON object", () => {
    expect(safeParse<Record<string, string[]>>("{}", {})).toEqual({});
  });

  it("sections: fallback merges with defaults", () => {
    const result = safeParse<Sections>('{"plans":false}', DEFAULT_SECTIONS);
    expect(result.features).toBe(true);
    expect(result.plans).toBe(false);
  });
});

describe("PlanCardData.extraItems type", () => {
  it("accepts array of extra items", () => {
    const card: PlanCardData = {
      id: "p1", name: "Básico", priceLabel: "R$ 99", recurrenceLabel: "/mês",
      featured: false, lines: ["5 usuários"], moduleLabels: [],
      extraItems: [
        { text: "10 canais DigiCalls", negative: false },
        { text: "Não inclui backup", negative: true }
      ]
    };
    expect(card.extraItems[0].negative).toBe(false);
    expect(card.extraItems[1].negative).toBe(true);
  });
});
