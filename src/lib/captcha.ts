export type CaptchaProvider = "none" | "hcaptcha" | "turnstile";

const ENDPOINTS: Record<Exclude<CaptchaProvider, "none">, string> = {
  hcaptcha: "https://hcaptcha.com/siteverify",
  turnstile: "https://challenges.cloudflare.com/turnstile/v0/siteverify"
};

export async function verifyCaptcha(
  provider: CaptchaProvider,
  secret: string,
  token: string,
  remoteIp?: string,
  fetchImpl: typeof fetch = fetch
): Promise<boolean> {
  if (provider === "none") return true;
  if (!token || !secret) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetchImpl(ENDPOINTS[provider], {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString()
    });
    if (!res.ok) return false;
    const json = (await res.json()) as { success?: boolean };
    return json.success === true;
  } catch {
    return false;
  }
}
