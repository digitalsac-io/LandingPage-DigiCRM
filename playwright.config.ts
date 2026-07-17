import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: { baseURL: "http://localhost:3005" },
  webServer: [
    {
      command: "npm run dev",
      url: "http://localhost:3005/healthz",
      reuseExistingServer: true,
      timeout: 60_000
    },
    {
      command: "node e2e/setup.js && node e2e/mock-backend.js",
      url: "http://127.0.0.1:4999/api/proxy/plans",
      reuseExistingServer: true,
      timeout: 30_000
    }
  ]
});
