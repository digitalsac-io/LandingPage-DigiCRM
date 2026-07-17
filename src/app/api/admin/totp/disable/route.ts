import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyTotp } from "@/lib/totp";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { code, password } = await req.json().catch(() => ({})) as { code?: string; password?: string };
  const user = await prisma.adminUser.findUniqueOrThrow({ where: { id: admin.id } });

  const validTotp = typeof code === "string" && verifyTotp(user.totpSecret, code, Date.now());
  const validPassword = typeof password === "string" && password.length > 0 && await verifyPassword(password, user.passwordHash);

  if (!validTotp && !validPassword) {
    return NextResponse.json({ success: false, code: "totp_invalid" }, { status: 400 });
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { totpEnabled: false, totpSecret: "" }
  });

  return NextResponse.json({ success: true });
}
