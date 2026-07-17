/**
 * Mock backend server for E2E tests — listens on port 4999.
 * Simulates the DigitalSac backend returning a single test plan.
 * Run with: node e2e/mock-backend.js
 */
const http = require("http");

// Raw backend plan format — normalizePlan() maps activecampaign→campaign, activekanban→kanban, etc.
const PLAN = {
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

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");

  if (req.url === "/api/proxy/plans") {
    res.writeHead(200);
    res.end(JSON.stringify({ plans: [PLAN] }));
    return;
  }

  if (req.url === "/api/proxy/register") {
    res.writeHead(200);
    res.end(JSON.stringify({ success: true }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "not found" }));
});

const PORT = 4999;
server.listen(PORT, "127.0.0.1", () => {
  console.log(`[mock-backend] listening on http://127.0.0.1:${PORT}`);
});
