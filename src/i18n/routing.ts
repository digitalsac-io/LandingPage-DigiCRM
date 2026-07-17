import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["pt-BR", "en", "es", "ru"],
  defaultLocale: "pt-BR",
  localePrefix: "as-needed"
});
