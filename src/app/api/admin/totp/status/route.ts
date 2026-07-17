import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.adminUser.findUniqueOrThrow({ where: { id: admin.id } });
  return NextResponse.json({ enabled: user.totpEnabled });
}
