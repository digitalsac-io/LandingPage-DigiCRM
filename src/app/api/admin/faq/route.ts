import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const locale = req.nextUrl.searchParams.get("locale") ?? "pt-BR";
  return NextResponse.json({ items: await prisma.faqItem.findMany({ where: { locale }, orderBy: { order: "asc" } }) });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { locale, question, answer, order } = await req.json();
  const item = await prisma.faqItem.create({ data: { locale, question, answer, order: order ?? 0 } });
  return NextResponse.json({ item });
}

export async function PUT(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id, question, answer, order } = await req.json();
  const item = await prisma.faqItem.update({ where: { id }, data: { question, answer, order } });
  return NextResponse.json({ item });
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const id = Number(req.nextUrl.searchParams.get("id"));
  await prisma.faqItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
