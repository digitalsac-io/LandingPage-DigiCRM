import { createHmac, timingSafeEqual } from "crypto";

const hmacHex = (payload: string, secret: string) =>
  createHmac("sha256", secret).update(payload).digest("hex");

export function signFormToken(nowMs: number, secret: string): string {
  return `${nowMs}.${hmacHex(String(nowMs), secret)}`;
}

export function verifyFormToken(
  token: string,
  nowMs: number,
  secret: string,
  minAgeMs = 3000,
  maxAgeMs = 3600000
): boolean {
  const [tsRaw, sig] = token.split(".");
  if (!tsRaw || !sig) return false;
  const ts = Number(tsRaw);
  if (!Number.isFinite(ts)) return false;
  const expected = hmacHex(tsRaw, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const age = nowMs - ts;
  return age >= minAgeMs && age <= maxAgeMs;
}

export function isHoneypotFilled(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com",
  "temp-mail.org", "yopmail.com", "trashmail.com", "sharklasers.com",
  "getnada.com", "dispostable.com", "maildrop.cc", "fakeinbox.com",
  "throwawaymail.com", "mintemail.com", "mytemp.email", "mohmal.com",
  "tempail.com", "emailondeck.com", "spamgourmet.com", "mailnesia.com"
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase().trim();
  return !!domain && DISPOSABLE_DOMAINS.has(domain);
}
