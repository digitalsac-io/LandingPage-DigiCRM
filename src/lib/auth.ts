import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { prisma } from "./prisma";

export const SESSION_COOKIE = "landing_admin";
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSession(userId: number): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.session.create({ data: { token, userId, expiresAt } });
  return { token, expiresAt };
}

export async function getSessionUser(token: string | undefined): Promise<{ id: number; email: string } | null> {
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { token }, include: { user: true } });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { token } }).catch(() => {});
    return null;
  }
  return { id: session.user.id, email: session.user.email };
}

export function requireAdmin(req: NextRequest) {
  return getSessionUser(req.cookies.get(SESSION_COOKIE)?.value);
}

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  };
}
