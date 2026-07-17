import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword, createSession, getSessionUser } from "../auth";
import { prisma } from "../prisma";

describe("password", () => {
  it("hash e verifica", async () => {
    const h = await hashPassword("abc12345");
    expect(await verifyPassword("abc12345", h)).toBe(true);
    expect(await verifyPassword("errada00", h)).toBe(false);
  });
});

describe("sessions", () => {
  it("cria sessão válida e resolve o usuário", async () => {
    const user = await prisma.adminUser.upsert({
      where: { email: "t@t.co" },
      update: {},
      create: { email: "t@t.co", passwordHash: await hashPassword("abc12345") }
    });
    const { token } = await createSession(user.id);
    const resolved = await getSessionUser(token);
    expect(resolved?.email).toBe("t@t.co");
  });
  it("sessão expirada retorna null", async () => {
    const user = await prisma.adminUser.findUniqueOrThrow({ where: { email: "t@t.co" } });
    const { token } = await createSession(user.id);
    await prisma.session.update({ where: { token }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await getSessionUser(token)).toBeNull();
  });
  it("token desconhecido/undefined retorna null", async () => {
    expect(await getSessionUser("nao-existe")).toBeNull();
    expect(await getSessionUser(undefined)).toBeNull();
  });
});
