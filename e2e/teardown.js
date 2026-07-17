/**
 * E2E teardown: reset SiteConfig.backendUrl and delete test SignupAttempts.
 * Run after: npm run e2e
 */
const path = require("path");
const Database = require("better-sqlite3");

const dbPath = path.join(__dirname, "..", "data", "landing.db");

let db;
try {
  db = new Database(dbPath);
} catch (err) {
  console.error("[e2e/teardown] Could not open database at", dbPath);
  process.exit(1);
}

db.prepare("UPDATE SiteConfig SET backendUrl='' WHERE id=1").run();
console.log("[e2e/teardown] SiteConfig.backendUrl reset.");

try {
  const result = db.prepare("DELETE FROM SignupAttempt WHERE email='teste@empresa.com.br'").run();
  console.log("[e2e/teardown] Deleted", result.changes, "test SignupAttempt(s).");
} catch (err) {
  console.log("[e2e/teardown] SignupAttempt cleanup skipped:", err.message);
}

db.close();
