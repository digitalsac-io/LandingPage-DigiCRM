import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSiteConfig, updateSiteConfig, type SiteConfigPatch } from "@/lib/config";
import { clearPlansCache } from "@/lib/backend";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const config = await getSiteConfig();
  return NextResponse.json({ ...config, captchaSecret: config.captchaSecret ? "***" : "", cpfApiKey: config.cpfApiKey ? "***" : "" });
}

export async function PUT(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const patch = (await req.json()) as SiteConfigPatch & { captchaSecret?: string; cpfApiKey?: string };
  if (patch.captchaSecret === undefined || patch.captchaSecret === "***") {
    delete patch.captchaSecret;
  }
  if (patch.cpfApiKey === undefined || patch.cpfApiKey === "***") {
    delete patch.cpfApiKey;
  }
  delete (patch as Record<string, unknown>).id;
  delete (patch as Record<string, unknown>).updatedAt;
  await updateSiteConfig(patch);
  clearPlansCache();
  return NextResponse.json({ success: true });
}
