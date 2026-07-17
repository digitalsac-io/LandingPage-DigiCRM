import { test, expect } from "@playwright/test";

// With localePrefix:"as-needed", the default locale (pt-BR) has no path prefix.
// The middleware may pick up the browser's Accept-Language (en) and rewrite to /en.
// We set the NEXT_LOCALE cookie to pin the locale for each test.

const LOCALES = [
  { path: "/", lang: "pt-BR" },
  { path: "/en", lang: "en" },
  { path: "/es", lang: "es" },
  { path: "/ru", lang: "ru" }
];

for (const { path, lang } of LOCALES) {
  test(`home renderiza em ${lang}`, async ({ page }) => {
    // Pin locale via cookie so middleware doesn't redirect based on Accept-Language
    await page.context().addCookies([{
      name: "NEXT_LOCALE",
      value: lang,
      domain: "localhost",
      path: "/"
    }]);
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await expect(page.locator("h1")).toBeVisible();
  });
}

test("toggle de tema alterna a classe dark", async ({ page }) => {
  await page.context().addCookies([{
    name: "NEXT_LOCALE",
    value: "pt-BR",
    domain: "localhost",
    path: "/"
  }]);
  await page.goto("/");
  const btn = page.getByRole("button", { name: "Tema" });
  await btn.click();
  const before = await page.locator("html").getAttribute("class");
  await btn.click();
  const after = await page.locator("html").getAttribute("class");
  expect(before).not.toEqual(after);
});
