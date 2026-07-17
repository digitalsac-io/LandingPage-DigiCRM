import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import { getDatabaseUrl } from "../src/lib/dbUrl";

const adapter = new PrismaBetterSqlite3({ url: getDatabaseUrl() });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error("ADMIN_EMAIL e ADMIN_PASSWORD são obrigatórios");

  const count = await prisma.adminUser.count();
  if (count === 0) {
    await prisma.adminUser.create({
      data: { email, passwordHash: await bcrypt.hash(password, 10) }
    });
    console.log(`Admin criado: ${email}`);
  } else {
    console.log("Admin já existe, seed ignorado.");
  }

  await prisma.siteConfig.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}

main().finally(() => prisma.$disconnect());
