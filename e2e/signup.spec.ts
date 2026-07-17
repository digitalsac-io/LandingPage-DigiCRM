import { test, expect } from "@playwright/test";

// Raw backend plan format — normalizePlan() maps activecampaign→campaign, activekanban→kanban, etc.
const PLAN_RAW = {
  id: "1",
  name: "Pro",
  price: 199.9,
  recurrence: "MENSAL",
  users: 5,
  channels: 3,
  contractedSpace: 10,
  maxContacts: 5000,
  trial: true,
  trialDays: 7,
  activecampaign: true,
  activekanban: true
};

test("fluxo de cadastro completo (API pública mockada)", async ({ page }) => {
  // Pin locale to pt-BR so labels match Portuguese i18n strings.
  // Without this, the browser's Accept-Language triggers a redirect to /en/cadastro.
  await page.context().addCookies([{
    name: "NEXT_LOCALE",
    value: "pt-BR",
    domain: "localhost",
    path: "/"
  }]);

  // The SSR fetches plans from backendUrl (mock-backend.js running on :4999, configured by e2e/setup.js).
  // page.route below intercepts the browser-side /api/public/register for deterministic response.
  await page.route("**/api/public/register", route =>
    route.fulfill({ json: { success: true } }));

  await page.goto("/cadastro");

  // With a single plan returned by the mock, it is auto-selected; no manual radio click needed.
  await page.getByLabel("Nome da empresa").fill("Empresa Teste");
  await page.getByLabel("E-mail").fill("teste@empresa.com.br");
  await page.getByLabel("WhatsApp/Telefone").fill("62999998888");
  await page.getByLabel("CPF ou CNPJ").fill("52998224725");
  await page.getByLabel("Senha").fill("abc12345");
  await page.getByRole("checkbox").check();
  await page.getByRole("main").getByRole("button", { name: "Criar conta" }).click();
  await expect(page.getByText("Conta criada com sucesso!")).toBeVisible({ timeout: 10_000 });
});
