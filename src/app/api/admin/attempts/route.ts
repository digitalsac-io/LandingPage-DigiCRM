import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 100), 500);
  const attempts = await prisma.signupAttempt.findMany({ orderBy: { createdAt: "desc" }, take: limit });
  return NextResponse.json({ attempts });
}
