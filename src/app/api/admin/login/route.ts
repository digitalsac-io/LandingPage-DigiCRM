import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { loginRateLimiter } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/ip";
import { verifyTotp } from "@/lib/totp";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!loginRateLimiter.allow(ip)) {
    return NextResponse.json({ success: false, code: "rate_limited" }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  const { email, password, totp } = body as { email?: unknown; password?: unknown; totp?: unknown };
  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ success: false, code: "invalid" }, { status: 400 });
  }
  const user = await prisma.adminUser.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ success: false, code: "invalid_credentials" }, { status: 401 });
  }
  if (user.totpEnabled) {
    if (!totp) {
      return NextResponse.json({ success: false, code: "totp_required" }, { status: 401 });
    }
    if (!verifyTotp(user.totpSecret, String(totp), Date.now())) {
      return NextResponse.json({ success: false, code: "totp_invalid" }, { status: 401 });
    }
  }
  const { token, expiresAt } = await createSession(user.id);
  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  return res;
}
