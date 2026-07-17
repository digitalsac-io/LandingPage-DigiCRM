/**
 * Docker entrypoint seed script — CommonJS, no tsx required.
 * Uses @prisma/adapter-better-sqlite3 (v7 adapter pattern) + bcryptjs.
 * Idempotent: only creates admin if none exists; always upserts SiteConfig.
 */
"use strict";

const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const bcrypt = require("bcryptjs");

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  return "file:" + path.join(process.cwd(), "data", "landing.db");
}

async function main() {
  const url = getDatabaseUrl();
  const adapter = new PrismaBetterSqlite3({ url });
  const prisma = new PrismaClient({ adapter });

  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (email && password) {
      const count = await prisma.adminUser.count();
      if (count === 0) {
        await prisma.adminUser.create({
          data: { email, passwordHash: await bcrypt.hash(password, 10) }
        });
        console.log("admin seeded:", email);
      } else {
        console.log("admin already exists, skipping seed.");
      }
    } else {
      console.log("ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping admin seed.");
    }

    await prisma.siteConfig.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 }
    });
    console.log("SiteConfig ready.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(err => {
  console.error("seed failed:", err);
  process.exit(1);
});
