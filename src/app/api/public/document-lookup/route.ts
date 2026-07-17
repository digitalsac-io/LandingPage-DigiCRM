import { NextRequest, NextResponse } from "next/server";
import { isValidDocument } from "@/lib/validators";
import { createMemoryRateLimiter } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/ip";
import { getSiteConfig } from "@/lib/config";
import { lookupDocument } from "@/lib/documentLookup";

const lookupRateLimiter = createMemoryRateLimiter(20, 60_000);

export async function GET(req: NextRequest) {
  const doc = req.nextUrl.searchParams.get("doc") ?? "";

  if (!doc || !isValidDocument(doc)) {
    return NextResponse.json({ error: "invalid_document" }, { status: 400 });
  }

  const ip = getClientIp(req);
  if (!lookupRateLimiter.allow(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const config = await getSiteConfig();
  const result = await lookupDocument(doc, config.cpfApiKey);

  return NextResponse.json({ name: result?.name ?? null });
}
