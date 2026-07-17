import { isValidDocument, isValidEmail, normalizePhone, isStrongPassword } from "./validators";
import { verifyFormToken, isHoneypotFilled, isDisposableEmail } from "./security";
import { checkSignupAllowed, type AttemptStore } from "./rateLimit";
import type { CaptchaProvider } from "./captcha";
import type { RegisterPayload, RegisterErrorCode } from "./backend";

export type PipelineInput = {
  ip: string; honeypot: string; formToken: string; captchaToken: string;
  planId: string; name: string; phone: string; email: string;
  document: string; password: string; locale: string;
};

export type PipelineDeps = {
  secret: string;
  limits: { perHour: number; perDay: number };
  captcha: { provider: CaptchaProvider; secret: string };
  blockDisposable: boolean;
  store: AttemptStore;
  record: (ip: string, email: string, result: string) => Promise<void>;
  verifyCaptchaFn: (provider: CaptchaProvider, secret: string, token: string, ip?: string) => Promise<boolean>;
  registerFn: (payload: RegisterPayload) => Promise<{ ok: true } | { ok: false; code: RegisterErrorCode }>;
  now: Date;
};

export type PipelineResult = { status: number; body: { success: boolean; code?: string } };

const fail = (status: number, code: string): PipelineResult => ({ status, body: { success: false, code } });

export async function runRegisterPipeline(input: PipelineInput, deps: PipelineDeps): Promise<PipelineResult> {
  const email = input.email.trim().toLowerCase();

  if (isHoneypotFilled(input.honeypot)) {
    await deps.record(input.ip, email, "blocked_honeypot");
    return { status: 200, body: { success: true } }; // resposta fake p/ não educar o bot
  }

  if (!(await checkSignupAllowed(deps.store, input.ip, deps.limits, deps.now))) {
    await deps.record(input.ip, email, "blocked_rate");
    return fail(429, "rate_limited");
  }

  if (!verifyFormToken(input.formToken, deps.now.getTime(), deps.secret)) {
    await deps.record(input.ip, email, "blocked_too_fast");
    return fail(400, "too_fast");
  }

  if (!(await deps.verifyCaptchaFn(deps.captcha.provider, deps.captcha.secret, input.captchaToken, input.ip))) {
    await deps.record(input.ip, email, "blocked_captcha");
    return fail(400, "captcha_failed");
  }

  const invalid = async (code: string): Promise<PipelineResult> => {
    await deps.record(input.ip, email, "invalid");
    return fail(400, code);
  };

  if (!input.planId.trim()) return invalid("invalid_plan");
  if (!input.name.trim()) return invalid("invalid_name");
  if (!isValidEmail(email)) return invalid("invalid_email");
  const phone = normalizePhone(input.phone);
  if (!phone) return invalid("invalid_phone");
  if (!isValidDocument(input.document)) return invalid("invalid_document");
  if (!isStrongPassword(input.password)) return invalid("invalid_password");

  if (deps.blockDisposable && isDisposableEmail(email)) {
    await deps.record(input.ip, email, "blocked_disposable");
    return fail(400, "disposable_email");
  }

  const result = await deps.registerFn({
    planId: input.planId.trim(),
    name: input.name.trim(),
    phone,
    email,
    document: input.document.replace(/\D/g, ""),
    password: input.password,
    locale: input.locale
  });

  if (result.ok) {
    await deps.record(input.ip, email, "success");
    return { status: 200, body: { success: true } };
  }
  await deps.record(input.ip, email, "backend_error");
  const status = result.code === "backend_down" ? 503 : result.code === "generic" ? 400 : 409;
  return fail(status, result.code);
}
