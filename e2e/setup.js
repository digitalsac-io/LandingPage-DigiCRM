/**
 * E2E setup: point SiteConfig.backendUrl to the local mock backend (port 4999).
 * Run before: npm run e2e
 * Requires better-sqlite3 (devDependency).
 */
const path = require("path");
const Database = require("better-sqlite3");

const dbPath = path.join(__dirname, "..", "data", "landing.db");

let db;
try {
  db = new Database(dbPath);
} catch (err) {
  console.error("[e2e/setup] Could not open database at", dbPath);
  console.error("[e2e/setup] Run: npx prisma migrate dev  — to create it first.");
  process.exit(1);
}

db.prepare("UPDATE SiteConfig SET backendUrl='http://127.0.0.1:4999' WHERE id=1").run();
console.log("[e2e/setup] SiteConfig.backendUrl set to http://127.0.0.1:4999");
db.close();
