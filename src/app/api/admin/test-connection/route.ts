import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { fetchPlans, clearPlansCache } from "@/lib/backend";

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { backendUrl } = await req.json();
  try {
    clearPlansCache();
    const plans = await fetchPlans(String(backendUrl ?? ""));
    return NextResponse.json({ ok: true, count: plans.length });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "erro" });
  }
}
