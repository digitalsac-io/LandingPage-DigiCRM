-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SiteConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "siteUrl" TEXT NOT NULL DEFAULT '',
    "backendUrl" TEXT NOT NULL DEFAULT '',
    "appUrl" TEXT NOT NULL DEFAULT '',
    "termsUrl" TEXT NOT NULL DEFAULT '',
    "termsHtml" TEXT NOT NULL DEFAULT '',
    "logoLight" TEXT NOT NULL DEFAULT '',
    "logoDark" TEXT NOT NULL DEFAULT '',
    "favicon" TEXT NOT NULL DEFAULT '',
    "ogImage" TEXT NOT NULL DEFAULT '',
    "primaryColor" TEXT NOT NULL DEFAULT '#4f46e5',
    "accentColor" TEXT NOT NULL DEFAULT '#06b6d4',
    "captchaProvider" TEXT NOT NULL DEFAULT 'none',
    "captchaSiteKey" TEXT NOT NULL DEFAULT '',
    "captchaSecret" TEXT NOT NULL DEFAULT '',
    "cpfApiKey" TEXT NOT NULL DEFAULT '',
    "signupPerHour" INTEGER NOT NULL DEFAULT 5,
    "signupPerDay" INTEGER NOT NULL DEFAULT 20,
    "blockDisposable" BOOLEAN NOT NULL DEFAULT true,
    "currencyConversion" BOOLEAN NOT NULL DEFAULT false,
    "featuredPlanId" TEXT NOT NULL DEFAULT '',
    "plansColumns" INTEGER NOT NULL DEFAULT 3,
    "whatsapp" TEXT NOT NULL DEFAULT '',
    "whatsSubjects" TEXT NOT NULL DEFAULT '',
    "customScripts" TEXT NOT NULL DEFAULT '',
    "heroImage" TEXT NOT NULL DEFAULT '',
    "sectionsJson" TEXT NOT NULL DEFAULT '{}',
    "socialJson" TEXT NOT NULL DEFAULT '{}',
    "seoJson" TEXT NOT NULL DEFAULT '{}',
    "planExtrasJson" TEXT NOT NULL DEFAULT '{}',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SiteConfig" ("accentColor", "appUrl", "backendUrl", "blockDisposable", "captchaProvider", "captchaSecret", "captchaSiteKey", "cpfApiKey", "currencyConversion", "customScripts", "favicon", "featuredPlanId", "heroImage", "id", "logoDark", "logoLight", "ogImage", "plansColumns", "primaryColor", "sectionsJson", "seoJson", "signupPerDay", "signupPerHour", "siteUrl", "socialJson", "termsHtml", "termsUrl", "updatedAt", "whatsSubjects", "whatsapp") SELECT "accentColor", "appUrl", "backendUrl", "blockDisposable", "captchaProvider", "captchaSecret", "captchaSiteKey", "cpfApiKey", "currencyConversion", "customScripts", "favicon", "featuredPlanId", "heroImage", "id", "logoDark", "logoLight", "ogImage", "plansColumns", "primaryColor", "sectionsJson", "seoJson", "signupPerDay", "signupPerHour", "siteUrl", "socialJson", "termsHtml", "termsUrl", "updatedAt", "whatsSubjects", "whatsapp" FROM "SiteConfig";
DROP TABLE "SiteConfig";
ALTER TABLE "new_SiteConfig" RENAME TO "SiteConfig";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
