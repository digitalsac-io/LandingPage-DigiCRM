import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStrongPassword } from "@/lib/validators";

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { current, next } = await req.json();
  const user = await prisma.adminUser.findUniqueOrThrow({ where: { id: admin.id } });
  if (!(await verifyPassword(String(current ?? ""), user.passwordHash))) {
    return NextResponse.json({ success: false, code: "wrong_password" }, { status: 400 });
  }
  if (!isStrongPassword(String(next ?? ""))) {
    return NextResponse.json({ success: false, code: "weak_password" }, { status: 400 });
  }
  await prisma.adminUser.update({ where: { id: admin.id }, data: { passwordHash: await hashPassword(next) } });
  await prisma.session.deleteMany({ where: { userId: admin.id } });
  return NextResponse.json({ success: true });
}
