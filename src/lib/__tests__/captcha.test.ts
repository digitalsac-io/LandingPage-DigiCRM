import { describe, expect, it, vi } from "vitest";
import { verifyCaptcha } from "../captcha";

const okFetch = (url: string) =>
  vi.fn(async (input: RequestInfo | URL) => {
    expect(String(input)).toBe(url);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }) as unknown as typeof fetch;

describe("verifyCaptcha", () => {
  it("provider none sempre passa", async () => {
    expect(await verifyCaptcha("none", "", "")).toBe(true);
  });
  it("hcaptcha chama siteverify e retorna success", async () => {
    const f = okFetch("https://hcaptcha.com/siteverify");
    expect(await verifyCaptcha("hcaptcha", "sec", "tok", "1.1.1.1", f)).toBe(true);
  });
  it("turnstile chama o endpoint da cloudflare", async () => {
    const f = okFetch("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    expect(await verifyCaptcha("turnstile", "sec", "tok", undefined, f)).toBe(true);
  });
  it("retorna false com success=false, HTTP != 200 ou erro de rede", async () => {
    const failJson = vi.fn(async () => new Response(JSON.stringify({ success: false }), { status: 200 })) as unknown as typeof fetch;
    const fail500 = vi.fn(async () => new Response("err", { status: 500 })) as unknown as typeof fetch;
    const failNet = vi.fn(async () => { throw new Error("net"); }) as unknown as typeof fetch;
    expect(await verifyCaptcha("hcaptcha", "s", "t", undefined, failJson)).toBe(false);
    expect(await verifyCaptcha("hcaptcha", "s", "t", undefined, fail500)).toBe(false);
    expect(await verifyCaptcha("turnstile", "s", "t", undefined, failNet)).toBe(false);
  });
  it("token vazio com provider ativo falha sem chamar rede", async () => {
    const f = vi.fn() as unknown as typeof fetch;
    expect(await verifyCaptcha("hcaptcha", "s", "", undefined, f)).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });
});
