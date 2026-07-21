import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

// Serve os arquivos gravados pelo /api/admin/upload (logos, favicon, OG image).
// Eles ficam em UPLOAD_DIR (fora de public/), então precisam de um handler próprio.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const dir = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
  const target = path.resolve(dir, ...segments);

  // impede path traversal para fora do UPLOAD_DIR
  if (target !== dir && !target.startsWith(dir + path.sep)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  try {
    const info = await stat(target);
    if (!info.isFile()) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const data = await readFile(target);
    const ext = path.extname(target).toLowerCase();
    const type = TYPES[ext] ?? "application/octet-stream";
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": type,
        "Content-Length": String(info.size),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
