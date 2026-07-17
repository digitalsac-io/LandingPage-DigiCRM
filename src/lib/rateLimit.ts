import { prisma } from "./prisma";

export type AttemptStore = {
  countSince(ip: string, since: Date): Promise<number>;
};

export const prismaAttemptStore: AttemptStore = {
  countSince(ip, since) {
    return prisma.signupAttempt.count({ where: { ip, createdAt: { gte: since } } });
  }
};

export async function checkSignupAllowed(
  store: AttemptStore,
  ip: string,
  limits: { perHour: number; perDay: number },
  now: Date
): Promise<boolean> {
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const [lastHour, lastDay] = await Promise.all([
    store.countSince(ip, hourAgo),
    store.countSince(ip, dayAgo)
  ]);
  return lastHour < limits.perHour && lastDay < limits.perDay;
}

export function createMemoryRateLimiter(max: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return {
    allow(key: string, now: number = Date.now()): boolean {
      const list = (hits.get(key) ?? []).filter(t => now - t < windowMs);
      if (list.length >= max) {
        hits.set(key, list);
        return false;
      }
      list.push(now);
      hits.set(key, list);
      return true;
    }
  };
}

export const loginRateLimiter = createMemoryRateLimiter(5, 15 * 60 * 1000);
