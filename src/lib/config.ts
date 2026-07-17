import type { SiteConfig } from "@prisma/client";
import { prisma } from "./prisma";

export type Sections = { features: boolean; plans: boolean; faq: boolean; cta: boolean };
export type SeoEntry = { title: string; description: string };

export type SiteConfigParsed = Omit<SiteConfig, "sectionsJson" | "socialJson" | "seoJson"> & {
  sections: Sections;
  social: Record<string, string>;
  seo: Record<string, SeoEntry>;
};

const DEFAULT_SECTIONS: Sections = { features: true, plans: true, faq: true, cta: true };

function safeParse<T>(json: string, fallback: T): T {
  try { return { ...fallback, ...(JSON.parse(json) as T) }; } catch { return fallback; }
}

export async function getSiteConfig(): Promise<SiteConfigParsed> {
  const row = await prisma.siteConfig.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  const { sectionsJson, socialJson, seoJson, ...rest } = row;
  return {
    ...rest,
    sections: safeParse(sectionsJson, DEFAULT_SECTIONS),
    social: safeParse(socialJson, {}),
    seo: safeParse(seoJson, {})
  };
}

export type SiteConfigPatch = Partial<
  Omit<SiteConfigParsed, "id" | "updatedAt">
>;

export async function updateSiteConfig(patch: SiteConfigPatch): Promise<void> {
  const { sections, social, seo, ...rest } = patch;
  await prisma.siteConfig.update({
    where: { id: 1 },
    data: {
      ...rest,
      ...(sections ? { sectionsJson: JSON.stringify(sections) } : {}),
      ...(social ? { socialJson: JSON.stringify(social) } : {}),
      ...(seo ? { seoJson: JSON.stringify(seo) } : {})
    }
  });
}
