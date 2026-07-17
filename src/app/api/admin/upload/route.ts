import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/auth";

const ALLOWED = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico"]);
const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "no_file" }, { status: 400 });
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED.has(ext)) return NextResponse.json({ error: "bad_type" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "too_large" }, { status: 400 });
  const slug = path.basename(file.name, ext).toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 40);
  const name = `${Date.now()}-${slug}${ext}`;
  const dir = process.env.UPLOAD_DIR ?? "./uploads";
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/${name}` });
}
