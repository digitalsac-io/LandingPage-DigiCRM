import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTotpSecret, buildOtpauthUrl } from "@/lib/totp";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const secret = generateTotpSecret();
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { totpSecret: secret }
  });

  const otpauthUrl = buildOtpauthUrl(secret, admin.email);
  return NextResponse.json({ otpauthUrl, secret });
}
