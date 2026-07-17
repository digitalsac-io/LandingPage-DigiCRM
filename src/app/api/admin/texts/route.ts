import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMergedMessages } from "@/lib/texts";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const locale = req.nextUrl.searchParams.get("locale") ?? "pt-BR";
  const [messages, overrides] = await Promise.all([
    getMergedMessages(locale),
    prisma.sectionText.findMany({ where: { locale } })
  ]);
  return NextResponse.json({ messages: messages.landing, overrides });
}

export async function PUT(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { rows } = (await req.json()) as { rows: Array<{ section: string; locale: string; key: string; value: string }> };
  for (const row of rows) {
    const where = { section_locale_key: { section: row.section, locale: row.locale, key: row.key } };
    if (row.value === "") {
      await prisma.sectionText.deleteMany({ where: { section: row.section, locale: row.locale, key: row.key } });
    } else {
      await prisma.sectionText.upsert({ where, update: { value: row.value }, create: row });
    }
  }
  return NextResponse.json({ success: true });
}
