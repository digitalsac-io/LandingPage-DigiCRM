export type PlanView = {
  id: string; name: string; price: number; recurrence: string;
  users: number; channels: number; contractedSpace: number; maxContacts: number;
  trial: boolean; trialDays: number; modules: string[];
};

export type RegisterPayload = {
  planId: string; name: string; phone: string; email: string;
  document: string; password: string; locale: string;
};

export type RegisterErrorCode = "email_exists" | "document_exists" | "backend_down" | "generic";

export class BackendUnavailableError extends Error {}

const MODULE_FLAGS: Array<[string, string]> = [
  ["activeia", "ia"],
  ["activecampaign", "campaign"],
  ["activecampaignwaba", "campaignWaba"],
  ["activecampaignsms", "campaignSms"],
  ["activetypebot", "typebot"],
  ["activescheduler", "scheduler"],
  ["activekanban", "kanban"],
  ["activecampaigndigicalls", "digicalls"],
  ["activeinternalchat", "internalChat"]
];

const truthy = (v: unknown) => v === true || v === 1 || v === "1" || v === "true";
const toNum = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export function normalizePlan(raw: Record<string, unknown>): PlanView {
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    price: toNum(raw.price),
    recurrence: String(raw.recurrence ?? "MENSAL"),
    users: toNum(raw.users),
    channels: toNum(raw.channels),
    contractedSpace: toNum(raw.contractedSpace),
    maxContacts: toNum(raw.maxContacts),
    trial: truthy(raw.trial),
    trialDays: toNum(raw.trialDays),
    modules: MODULE_FLAGS.filter(([flag]) => truthy(raw[flag])).map(([, name]) => name)
  };
}

let plansCache: { url: string; at: number; plans: PlanView[] } | null = null;

export function clearPlansCache() {
  plansCache = null;
}

export async function fetchPlans(
  backendUrl: string,
  fetchImpl: typeof fetch = fetch,
  nowMs: number = Date.now()
): Promise<PlanView[]> {
  if (plansCache && plansCache.url === backendUrl && nowMs - plansCache.at < 60_000) {
    return plansCache.plans;
  }
  let res: Response;
  try {
    res = await fetchImpl(`${backendUrl.replace(/\/$/, "")}/api/proxy/plans`);
  } catch {
    throw new BackendUnavailableError("backend unreachable");
  }
  if (!res.ok) throw new BackendUnavailableError(`HTTP ${res.status}`);
  const json = (await res.json()) as { plans?: Array<Record<string, unknown>> };
  const plans = (json.plans ?? [])
    .filter(p => !truthy(p.isHidden))
    .map(normalizePlan);
  plansCache = { url: backendUrl, at: nowMs, plans };
  return plans;
}

export function mapBackendError(status: number, message: string): RegisterErrorCode {
  if (status >= 500) return "backend_down";
  const m = message.toLowerCase();
  if (m.includes("mail")) return "email_exists";
  if (m.includes("document") || m.includes("cpf") || m.includes("cnpj") || m.includes("vat")) {
    return "document_exists";
  }
  return "generic";
}

export async function registerClient(
  backendUrl: string,
  payload: RegisterPayload,
  fetchImpl: typeof fetch = fetch
): Promise<{ ok: true } | { ok: false; code: RegisterErrorCode }> {
  let res: Response;
  try {
    res = await fetchImpl(`${backendUrl.replace(/\/$/, "")}/api/proxy/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch {
    return { ok: false, code: "backend_down" };
  }
  let body: { success?: boolean; message?: string } = {};
  try {
    body = await res.json();
  } catch {
    /* corpo não-JSON */
  }
  if (res.ok && body.success) return { ok: true };
  return { ok: false, code: mapBackendError(res.status, body.message ?? "") };
}
