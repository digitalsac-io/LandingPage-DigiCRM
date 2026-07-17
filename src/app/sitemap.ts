import type { MetadataRoute } from "next";
import { getSiteConfig } from "@/lib/config";
import { routing } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { siteUrl } = await getSiteConfig();
  if (!siteUrl) return [];
  const base = siteUrl.replace(/\/$/, "");
  return routing.locales.flatMap(locale => {
    const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
    return ["", "/cadastro", "/termos"].map(path => ({
      url: `${base}${prefix}${path}`,
      changeFrequency: "weekly" as const
    }));
  });
}
