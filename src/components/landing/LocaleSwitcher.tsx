"use client";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LABELS: Record<string, string> = { "pt-BR": "PT", en: "EN", es: "ES", ru: "RU" };

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const change = (next: string) => {
    router.replace(pathname, { locale: next });
  };
  return (
    <select aria-label="Idioma" value={locale} onChange={e => change(e.target.value)}
      className="rounded-xl border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 [color-scheme:light] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:[color-scheme:dark]">
      {routing.locales.map(l => (
        <option key={l} value={l} className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
          {LABELS[l]}
        </option>
      ))}
    </select>
  );
}
