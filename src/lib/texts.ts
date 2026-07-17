import { prisma } from "./prisma";

export type Messages = { landing: Record<string, Record<string, string>> } & Record<string, unknown>;

export function mergeTexts(
  base: Messages,
  rows: Array<{ section: string; key: string; value: string }>
): Messages {
  const landing: Record<string, Record<string, string>> = {};
  for (const [section, keys] of Object.entries(base.landing)) landing[section] = { ...keys };
  for (const row of rows) {
    landing[row.section] = { ...(landing[row.section] ?? {}), [row.key]: row.value };
  }
  return { ...base, landing };
}

export async function getMergedMessages(locale: string): Promise<Messages> {
  const base = (await import(`../../messages/${locale}.json`)).default as Messages;
  const rows = await prisma.sectionText.findMany({
    where: { locale },
    select: { section: true, key: true, value: true }
  });
  return mergeTexts(base, rows);
}
