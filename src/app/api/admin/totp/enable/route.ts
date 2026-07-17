import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyTotp } from "@/lib/totp";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { code } = await req.json().catch(() => ({})) as { code?: string };
  const user = await prisma.adminUser.findUniqueOrThrow({ where: { id: admin.id } });

  if (!verifyTotp(user.totpSecret, String(code ?? ""), Date.now())) {
    return NextResponse.json({ success: false, code: "totp_invalid" }, { status: 400 });
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { totpEnabled: true }
  });

  return NextResponse.json({ success: true });
}
