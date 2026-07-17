-- CreateTable
CREATE TABLE "SiteConfig" (
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
    "signupPerHour" INTEGER NOT NULL DEFAULT 5,
    "signupPerDay" INTEGER NOT NULL DEFAULT 20,
    "blockDisposable" BOOLEAN NOT NULL DEFAULT true,
    "currencyConversion" BOOLEAN NOT NULL DEFAULT false,
    "featuredPlanId" TEXT NOT NULL DEFAULT '',
    "whatsapp" TEXT NOT NULL DEFAULT '',
    "sectionsJson" TEXT NOT NULL DEFAULT '{}',
    "socialJson" TEXT NOT NULL DEFAULT '{}',
    "seoJson" TEXT NOT NULL DEFAULT '{}',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SectionText" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "section" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "FaqItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "locale" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Session" (
    "token" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AdminUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SignupAttempt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ip" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "result" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "SectionText_section_locale_key_key" ON "SectionText"("section", "locale", "key");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "SignupAttempt_ip_createdAt_idx" ON "SignupAttempt"("ip", "createdAt");
