import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  normalizePlan, fetchPlans, registerClient, mapBackendError,
  clearPlansCache, BackendUnavailableError
} from "../backend";

const RAW = {
  id: 7, name: "Pro", price: "199.90", recurrence: "MENSAL", users: 5, channels: 3,
  contractedSpace: 10, maxContacts: 5000, trial: true, trialDays: 7, isHidden: false,
  activecampaign: true, activekanban: 1, activescheduler: "true", activeia: false,
  activecampaignwaba: 0, activecampaignsms: null, activetypebot: undefined,
  activecampaigndigicalls: "1", activeinternalchat: false
};

beforeEach(() => clearPlansCache());

describe("normalizePlan", () => {
  it("normaliza tipos e extrai módulos truthy", () => {
    const p = normalizePlan(RAW);
    expect(p).toMatchObject({ id: "7", name: "Pro", price: 199.9, recurrence: "MENSAL", trial: true, trialDays: 7 });
    expect(p.modules.sort()).toEqual(["campaign", "digicalls", "kanban", "scheduler"]);
  });
});

describe("fetchPlans", () => {
  it("busca, filtra isHidden e cacheia por 60s", async () => {
    const f = vi.fn(async () =>
      new Response(JSON.stringify({ plans: [RAW, { ...RAW, id: 8, isHidden: true }] }), { status: 200 })
    ) as unknown as typeof fetch;
    const a = await fetchPlans("http://b", f, 0);
    const b = await fetchPlans("http://b", f, 59_000);
    expect(a).toHaveLength(1);
    expect(b).toHaveLength(1);
    expect(f).toHaveBeenCalledTimes(1);
    await fetchPlans("http://b", f, 61_000);
    expect(f).toHaveBeenCalledTimes(2);
  });
  it("lança BackendUnavailableError em rede/HTTP ruim", async () => {
    const f = vi.fn(async () => { throw new Error("net"); }) as unknown as typeof fetch;
    await expect(fetchPlans("http://b", f, 0)).rejects.toBeInstanceOf(BackendUnavailableError);
  });
});

describe("registerClient / mapBackendError", () => {
  it("sucesso 200 com success=true", async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 })) as unknown as typeof fetch;
    expect(await registerClient("http://b", { planId: "1", name: "X", phone: "556299999999", email: "a@b.co", document: "52998224725", password: "abc12345", locale: "pt-BR" }, f)).toEqual({ ok: true });
  });
  it("mapeia mensagens de duplicidade", () => {
    expect(mapBackendError(400, "E-mail já cadastrado")).toBe("email_exists");
    expect(mapBackendError(400, "document already exists")).toBe("document_exists");
    expect(mapBackendError(400, "CPF/CNPJ ja existe")).toBe("document_exists");
    expect(mapBackendError(400, "outro erro")).toBe("generic");
    expect(mapBackendError(503, "qualquer")).toBe("backend_down");
  });
});
