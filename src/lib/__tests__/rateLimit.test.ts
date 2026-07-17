import { describe, expect, it } from "vitest";
import { checkSignupAllowed, createMemoryRateLimiter, type AttemptStore } from "../rateLimit";

function fakeStore(hourCount: number, dayCount: number): AttemptStore {
  return {
    async countSince(_ip, since) {
      const ageMs = Date.now() - since.getTime();
      return ageMs <= 61 * 60 * 1000 ? hourCount : dayCount;
    }
  };
}

describe("checkSignupAllowed", () => {
  const limits = { perHour: 5, perDay: 20 };
  it("permite abaixo dos limites", async () => {
    expect(await checkSignupAllowed(fakeStore(4, 19), "1.1.1.1", limits, new Date())).toBe(true);
  });
  it("bloqueia ao atingir limite por hora", async () => {
    expect(await checkSignupAllowed(fakeStore(5, 19), "1.1.1.1", limits, new Date())).toBe(false);
  });
  it("bloqueia ao atingir limite por dia", async () => {
    expect(await checkSignupAllowed(fakeStore(0, 20), "1.1.1.1", limits, new Date())).toBe(false);
  });
});

describe("createMemoryRateLimiter", () => {
  it("permite N e bloqueia N+1 na janela; libera após a janela", () => {
    const rl = createMemoryRateLimiter(3, 1000);
    expect(rl.allow("ip", 0)).toBe(true);
    expect(rl.allow("ip", 10)).toBe(true);
    expect(rl.allow("ip", 20)).toBe(true);
    expect(rl.allow("ip", 30)).toBe(false);
    expect(rl.allow("ip", 1100)).toBe(true);
    expect(rl.allow("outro", 30)).toBe(true);
  });
});
