import { getSiteConfig } from "@/lib/config";
import { fetchPlans, BackendUnavailableError } from "@/lib/backend";

export async function GET() {
  const config = await getSiteConfig();
  if (!config.backendUrl) {
    return Response.json({ plans: [], code: "not_configured" }, { status: 503 });
  }
  try {
    const plans = await fetchPlans(config.backendUrl);
    return Response.json({ plans });
  } catch (err) {
    if (err instanceof BackendUnavailableError) {
      return Response.json({ plans: [], code: "backend_down" }, { status: 503 });
    }
    throw err;
  }
}
