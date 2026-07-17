import { describe, expect, it } from "vitest";
import { signFormToken, verifyFormToken, isHoneypotFilled, isDisposableEmail } from "../security";

const SECRET = "test-secret";

describe("form token", () => {
  it("aceita token com idade entre min e max", () => {
    const t = signFormToken(1000, SECRET);
    expect(verifyFormToken(t, 5001, SECRET)).toBe(true);
  });
  it("rejeita envio rápido demais (< 3s)", () => {
    const t = signFormToken(1000, SECRET);
    expect(verifyFormToken(t, 2000, SECRET)).toBe(false);
  });
  it("rejeita token expirado (> 1h)", () => {
    const t = signFormToken(0, SECRET);
    expect(verifyFormToken(t, 3600001 + 3000, SECRET)).toBe(false);
  });
  it("rejeita assinatura adulterada e formato inválido", () => {
    const t = signFormToken(1000, SECRET);
    expect(verifyFormToken(`9${t.slice(1)}`, 9000, SECRET)).toBe(false);
    expect(verifyFormToken("lixo", 9000, SECRET)).toBe(false);
    expect(verifyFormToken(t, 9000, "outro-secret")).toBe(false);
  });
});

describe("honeypot / disposable", () => {
  it("honeypot preenchido bloqueia", () => {
    expect(isHoneypotFilled("")).toBe(false);
    expect(isHoneypotFilled(undefined)).toBe(false);
    expect(isHoneypotFilled("http://spam")).toBe(true);
  });
  it("detecta domínio descartável", () => {
    expect(isDisposableEmail("x@mailinator.com")).toBe(true);
    expect(isDisposableEmail("x@GUERRILLAMAIL.com")).toBe(true);
    expect(isDisposableEmail("x@gmail.com")).toBe(false);
  });
});
