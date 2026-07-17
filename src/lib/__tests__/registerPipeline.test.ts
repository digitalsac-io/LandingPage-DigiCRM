import { describe, expect, it, vi } from "vitest";
import { runRegisterPipeline, type PipelineDeps, type PipelineInput } from "../registerPipeline";
import { signFormToken } from "../security";

const SECRET = "s3cret";
const NOW = new Date(100_000);

function makeInput(over: Partial<PipelineInput> = {}): PipelineInput {
  return {
    ip: "1.1.1.1", honeypot: "", formToken: signFormToken(NOW.getTime() - 5000, SECRET),
    captchaToken: "tok", planId: "1", name: "Empresa X", phone: "+55 62 99999-8888",
    email: "a@b.co", document: "529.982.247-25", password: "abc12345", locale: "pt-BR",
    ...over
  };
}

function makeDeps(over: Partial<PipelineDeps> = {}): PipelineDeps {
  return {
    secret: SECRET,
    limits: { perHour: 5, perDay: 20 },
    captcha: { provider: "none", secret: "" },
    blockDisposable: true,
    store: { countSince: vi.fn(async () => 0) },
    record: vi.fn(async () => {}),
    verifyCaptchaFn: vi.fn(async () => true),
    registerFn: vi.fn(async () => ({ ok: true as const })),
    now: NOW,
    ...over
  };
}

describe("runRegisterPipeline", () => {
  it("fluxo feliz: 200, registra attempt success e chama registerFn com dados normalizados", async () => {
    const deps = makeDeps();
    const r = await runRegisterPipeline(makeInput(), deps);
    expect(r).toEqual({ status: 200, body: { success: true } });
    expect(deps.registerFn).toHaveBeenCalledWith(expect.objectContaining({
      phone: "5562999998888", document: "52998224725", email: "a@b.co"
    }));
    expect(deps.record).toHaveBeenCalledWith("1.1.1.1", "a@b.co", "success");
  });
  it("honeypot: 200 fake, nada encaminhado", async () => {
    const deps = makeDeps();
    const r = await runRegisterPipeline(makeInput({ honeypot: "spam" }), deps);
    expect(r.status).toBe(200);
    expect(deps.registerFn).not.toHaveBeenCalled();
    expect(deps.record).toHaveBeenCalledWith("1.1.1.1", "a@b.co", "blocked_honeypot");
  });
  it("rate limit: 429 antes de captcha", async () => {
    const deps = makeDeps({ store: { countSince: vi.fn(async () => 99) } });
    const r = await runRegisterPipeline(makeInput(), deps);
    expect(r.status).toBe(429);
    expect(r.body.code).toBe("rate_limited");
    expect(deps.verifyCaptchaFn).not.toHaveBeenCalled();
  });
  it("form token muito novo: 400 too_fast", async () => {
    const r = await runRegisterPipeline(
      makeInput({ formToken: signFormToken(NOW.getTime() - 1000, SECRET) }),
      makeDeps()
    );
    expect(r).toMatchObject({ status: 400, body: { code: "too_fast" } });
  });
  it("captcha reprovado: 400 captcha_failed", async () => {
    const deps = makeDeps({ captcha: { provider: "hcaptcha", secret: "x" }, verifyCaptchaFn: vi.fn(async () => false) });
    const r = await runRegisterPipeline(makeInput(), deps);
    expect(r).toMatchObject({ status: 400, body: { code: "captcha_failed" } });
  });
  it("validações: documento, email, telefone, senha, nome, plano", async () => {
    for (const [over, code] of [
      [{ document: "111.111.111-11" }, "invalid_document"],
      [{ email: "ruim" }, "invalid_email"],
      [{ phone: "123" }, "invalid_phone"],
      [{ password: "curta" }, "invalid_password"],
      [{ name: " " }, "invalid_name"],
      [{ planId: "" }, "invalid_plan"]
    ] as const) {
      const deps = makeDeps();
      const r = await runRegisterPipeline(makeInput(over), deps);
      expect(r).toMatchObject({ status: 400, body: { code } });
      expect(deps.record).toHaveBeenCalledWith("1.1.1.1", expect.any(String), "invalid");
    }
  });
  it("descartável bloqueado quando blockDisposable=true", async () => {
    const r = await runRegisterPipeline(makeInput({ email: "x@mailinator.com" }), makeDeps());
    expect(r).toMatchObject({ status: 400, body: { code: "disposable_email" } });
  });
  it("erro do backend vira código próprio e attempt backend_error", async () => {
    const deps = makeDeps({ registerFn: vi.fn(async () => ({ ok: false as const, code: "email_exists" as const })) });
    const r = await runRegisterPipeline(makeInput(), deps);
    expect(r).toMatchObject({ status: 409, body: { code: "email_exists" } });
    expect(deps.record).toHaveBeenCalledWith("1.1.1.1", "a@b.co", "backend_error");
  });
});
