import "dotenv/config";
import path from "path";
import { defineConfig } from "prisma/config";

// Resolve DATABASE_URL, falling back to the conventional path.
// This mirrors getDatabaseUrl() from src/lib/dbUrl.ts but is duplicated here
// because tsx may not always resolve project-relative src imports when Prisma
// CLI loads this config before the rest of the app is initialised.
const databaseUrl =
  process.env.DATABASE_URL ??
  "file:" + path.join(process.cwd(), "data", "landing.db");

export default defineConfig({
  datasource: {
    url: databaseUrl,
  },
});
