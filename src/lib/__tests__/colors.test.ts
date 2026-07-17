import { describe, expect, it } from "vitest";
import { darken } from "../colors";

describe("darken", () => {
  it("escurece cada canal proporcionalmente", () => {
    expect(darken("#ffffff", 0.5)).toBe("#808080");
    expect(darken("#4f46e5", 0)).toBe("#4f46e5");
  });
  it("aceita hex de 3 dígitos e input inválido devolve fallback", () => {
    expect(darken("#fff", 0.5)).toBe("#808080");
    expect(darken("lixo", 0.5)).toBe("#000000");
  });
});
