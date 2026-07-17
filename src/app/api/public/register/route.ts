import { NextRequest } from "next/server";
import { getSiteConfig } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { prismaAttemptStore } from "@/lib/rateLimit";
import { verifyCaptcha, type CaptchaProvider } from "@/lib/captcha";
import { registerClient } from "@/lib/backend";
import { runRegisterPipeline, type PipelineInput } from "@/lib/registerPipeline";
import { getClientIp } from "@/lib/ip";

let _warnedSecret = false;
function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    if (!_warnedSecret) {
      _warnedSecret = true;
      console.warn("[landing] SESSION_SECRET não definido — usando dev-secret (inseguro)");
    }
    return "dev-secret";
  }
  return s;
}

export async function POST(req: NextRequest) {
  const config = await getSiteConfig();
  if (!config.backendUrl) {
    return Response.json({ success: false, code: "not_configured" }, { status: 503 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ success: false, code: "generic" }, { status: 400 });
  }
  const s = (k: string) => String(body[k] ?? "");
  const input: PipelineInput = {
    ip: getClientIp(req),
    honeypot: s("website"),
    formToken: s("formToken"),
    captchaToken: s("captchaToken"),
    planId: s("planId"),
    name: s("name"),
    phone: s("phone"),
    email: s("email"),
    document: s("document"),
    password: s("password"),
    locale: s("locale") || "pt-BR"
  };
  const result = await runRegisterPipeline(input, {
    secret: getSecret(),
    limits: { perHour: config.signupPerHour, perDay: config.signupPerDay },
    captcha: { provider: config.captchaProvider as CaptchaProvider, secret: config.captchaSecret },
    blockDisposable: config.blockDisposable,
    store: prismaAttemptStore,
    record: async (ip, email, res) => {
      await prisma.signupAttempt.create({ data: { ip, email, result: res } });
    },
    verifyCaptchaFn: verifyCaptcha,
    registerFn: payload => registerClient(config.backendUrl, payload),
    now: new Date()
  });
  return Response.json(result.body, { status: result.status });
}
