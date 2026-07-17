# WhatsApp Admin Subjects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add admin-configurable WhatsApp subjects to the landing widget, allowing admins to define zero, one, or many subjects that control the subject UI shown to visitors.

**Architecture:** Add `whatsSubjects String @default("")` to the Prisma `SiteConfig` model, expose it through the existing admin config API unchanged, add a textarea field in `IntegrationsPanel` below the WhatsApp number field, and update `WhatsAppFloat` to accept `subjects: string[]` passed from the locale layout which splits the raw string on newlines.

**Tech Stack:** Next.js 15 App Router, Prisma + SQLite, React hooks, next-intl, TypeScript, Vitest.

## Global Constraints

- All changes inside `landing/` only
- Dev server on port 8086 — do NOT restart it; live checks may 500 after migration until controller restarts
- Verify statically: `npx tsc --noEmit`, `npm test`, `npm run build`
- Verify DB column: `node -e "const {DatabaseSync}=require('node:sqlite');const db=new DatabaseSync('prisma/dev.db');console.log(db.prepare('PRAGMA table_info(SiteConfig)').all())"`
- Commit message ends with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
- No new i18n keys; existing `landing.whats.subject` and `landing.whats.subjectLabel` keys are reused

---

### Task 1: Schema migration — add `whatsSubjects` column

**Files:**
- Modify: `prisma/schema.prisma` (add field to SiteConfig)
- Create: `prisma/migrations/<timestamp>_add_whats_subjects/migration.sql` (auto-generated)

**Interfaces:**
- Produces: `SiteConfig.whatsSubjects: String` available via Prisma client in all downstream files

- [ ] **Step 1: Edit schema.prisma — add field after `whatsapp`**

In `/home/deploy/DigitalSac/landing/prisma/schema.prisma`, after line `whatsapp String @default("")`, add:

```prisma
  whatsSubjects      String   @default("")
```

- [ ] **Step 2: Run migration**

```bash
cd /home/deploy/DigitalSac/landing && npx prisma migrate dev --name add_whats_subjects
```

Expected output: `Your database is now in sync with your schema.`

- [ ] **Step 3: Regenerate Prisma client**

```bash
cd /home/deploy/DigitalSac/landing && npx prisma generate
```

Expected output: `Generated Prisma Client...`

- [ ] **Step 4: Verify column exists**

```bash
cd /home/deploy/DigitalSac/landing && node -e "const {DatabaseSync}=require('node:sqlite');const db=new DatabaseSync('prisma/dev.db');const rows=db.prepare('PRAGMA table_info(SiteConfig)').all();console.log(rows.map(r=>r.name).join(', '))"
```

Expected: output includes `whatsSubjects`

- [ ] **Step 5: Run tests (all should still pass)**

```bash
cd /home/deploy/DigitalSac/landing && npm test
```

Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
cd /home/deploy/DigitalSac/landing && git add prisma/schema.prisma prisma/migrations/ && git commit -m "$(cat <<'EOF'
feat(landing): add whatsSubjects column to SiteConfig schema

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Admin UI — textarea in IntegrationsPanel

**Files:**
- Modify: `src/app/admin/AdminPanels.tsx` (add state + textarea in IntegrationsPanel)

**Interfaces:**
- Consumes: `config.whatsSubjects: unknown` (read from existing config load; cast to string)
- Produces: `whatsSubjects` string included in the `save()` payload sent to `PUT /api/admin/config`

No new test needed (UI-only; config API is already tested elsewhere; static type-check covers correctness).

- [ ] **Step 1: Add `whatsSubjects` state in IntegrationsPanel**

In `/home/deploy/DigitalSac/landing/src/app/admin/AdminPanels.tsx`, inside `IntegrationsPanel`, after the line:

```ts
  const [whatsapp, setWhatsapp] = useState(String(config.whatsapp ?? ""));
```

Add:

```ts
  const [whatsSubjects, setWhatsSubjects] = useState(String(config.whatsSubjects ?? ""));
```

- [ ] **Step 2: Include `whatsSubjects` in the save payload**

Still in `IntegrationsPanel`, find the `save()` function's `onSave({...})` call:

```ts
    await onSave({
      backendUrl, appUrl, siteUrl, termsUrl, termsHtml, whatsapp, cpfApiKey, customScripts,
      social: { instagram, facebook, linkedin, youtube, x }
    });
```

Replace with:

```ts
    await onSave({
      backendUrl, appUrl, siteUrl, termsUrl, termsHtml, whatsapp, whatsSubjects, cpfApiKey, customScripts,
      social: { instagram, facebook, linkedin, youtube, x }
    });
```

- [ ] **Step 3: Add textarea below the WhatsApp number field**

Find the WhatsApp number `<div>` in the JSX:

```tsx
      <div className="mb-4"><Label>WhatsApp (com DDI, ex: 5511999999999)</Label><Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} /></div>
```

After it, add:

```tsx
      <div className="mb-4">
        <Label>Assuntos do WhatsApp (um por linha)</Label>
        <textarea
          rows={3}
          value={whatsSubjects}
          onChange={e => setWhatsSubjects(e.target.value)}
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="Ex.: Suporte técnico&#10;Comercial&#10;Financeiro"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Um assunto: vai fixo na mensagem. Vários: o visitante escolhe. Vazio: sem campo de assunto.
        </p>
      </div>
```

- [ ] **Step 4: Type-check**

```bash
cd /home/deploy/DigitalSac/landing && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
cd /home/deploy/DigitalSac/landing && git add src/app/admin/AdminPanels.tsx && git commit -m "$(cat <<'EOF'
feat(landing): add whatsSubjects textarea to IntegrationsPanel

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Widget — subject-aware WhatsAppFloat + layout wiring

**Files:**
- Modify: `src/components/landing/WhatsAppFloat.tsx` (accept `subjects` prop; conditional UI; revised message)
- Modify: `src/app/[locale]/layout.tsx` (parse `config.whatsSubjects` and pass to component)

**Interfaces:**
- Consumes: `subjects: string[]` prop — array of trimmed, non-empty strings derived from `config.whatsSubjects`
- Produces: WhatsApp message with or without subject chunk depending on `subjects.length`

Message format (with subjects): `` `${t("greeting")} ${nome}. ${t("subjectLabel")}: ${assunto} — ${t("origin")}: ${document.title} (${location.pathname})` ``

Message format (no subjects): `` `${t("greeting")} ${nome}. ${t("origin")}: ${document.title} (${location.pathname})` ``

No unit test for client component needed (no pure logic to isolate; TSC covers types).

- [ ] **Step 1: Rewrite WhatsAppFloat to accept `subjects` prop**

Replace the entire contents of `/home/deploy/DigitalSac/landing/src/components/landing/WhatsAppFloat.tsx` with:

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, Input, Label, Button } from "@/components/ui";

const WaIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    width={28}
    height={28}
    fill="white"
    aria-hidden="true"
  >
    <path d="M16 2C8.268 2 2 8.268 2 16c0 2.49.648 4.83 1.781 6.863L2 30l7.336-1.742A13.94 13.94 0 0 0 16 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.6a11.56 11.56 0 0 1-5.898-1.613l-.422-.252-4.352 1.033 1.063-4.244-.277-.438A11.56 11.56 0 0 1 4.4 16C4.4 9.592 9.592 4.4 16 4.4S27.6 9.592 27.6 16 22.408 27.6 16 27.6zm6.35-8.668c-.348-.174-2.06-1.016-2.38-1.133-.32-.117-.553-.174-.786.174-.232.348-.9 1.133-1.104 1.365-.203.232-.406.26-.754.086-.348-.174-1.47-.541-2.8-1.727-1.034-.922-1.732-2.061-1.934-2.409-.203-.348-.022-.537.153-.71.156-.156.348-.406.522-.609.174-.203.232-.348.348-.58.116-.232.058-.435-.029-.609-.087-.174-.786-1.897-1.076-2.597-.283-.682-.572-.59-.786-.6l-.667-.012a1.28 1.28 0 0 0-.928.435c-.32.348-1.22 1.19-1.22 2.904s1.25 3.369 1.424 3.601c.174.232 2.46 3.756 5.96 5.267.832.36 1.482.574 1.988.735.835.266 1.596.228 2.197.138.67-.1 2.06-.843 2.35-1.657.29-.813.29-1.51.203-1.657-.085-.145-.32-.232-.667-.406z" />
  </svg>
);

export default function WhatsAppFloat({ number, subjects }: { number: string; subjects: string[] }) {
  const t = useTranslations("landing.whats");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState(subjects[0] ?? "");

  // When subjects change (e.g. hot-reload), keep selected in sync
  const assunto = subjects.length === 0 ? "" : subjects.length === 1 ? subjects[0] : selected;

  function handleStart() {
    const subjectChunk = assunto ? ` ${t("subjectLabel")}: ${assunto} —` : "";
    const msg = `${t("greeting")} ${name}.${subjectChunk} ${t("origin")}: ${document.title} (${location.pathname})`;
    const url = `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener");
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {/* Popup card */}
      <div
        className={[
          "w-80 max-w-[calc(100vw-2.5rem)] transition-all duration-200 origin-bottom-right",
          open
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
        ].join(" ")}
        aria-hidden={!open}
      >
        <Card className="p-4 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-sm">{t("title")}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar"
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 text-lg leading-none"
            >
              ×
            </button>
          </div>

          {/* Fields */}
          <div className="space-y-3 mb-4">
            <div>
              <Label htmlFor="wa-name">{t("name")}</Label>
              <Input
                id="wa-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t("name")}
                autoComplete="name"
              />
            </div>

            {/* subject UI: none | read-only label | select */}
            {subjects.length === 1 && (
              <p className="text-sm text-zinc-500">{subjects[0]}</p>
            )}
            {subjects.length > 1 && (
              <div>
                <Label htmlFor="wa-subject">{t("subject")}</Label>
                <select
                  id="wa-subject"
                  value={selected}
                  onChange={e => setSelected(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-zinc-700 dark:bg-zinc-900"
                >
                  {subjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <Button
            className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white"
            disabled={!name.trim()}
            onClick={handleStart}
          >
            {t("start")}
          </Button>
        </Card>
      </div>

      {/* Float button */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label="WhatsApp"
        aria-expanded={open}
        className="bg-[#25D366] hover:scale-105 transition shadow-lg rounded-full p-3.5"
      >
        <WaIcon />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Update locale layout to pass subjects prop**

In `/home/deploy/DigitalSac/landing/src/app/[locale]/layout.tsx`, find:

```tsx
            {config.whatsapp && <WhatsAppFloat number={config.whatsapp.replace(/\D/g, "")} />}
```

Replace with:

```tsx
            {config.whatsapp && (
              <WhatsAppFloat
                number={config.whatsapp.replace(/\D/g, "")}
                subjects={(config.whatsSubjects ?? "").split("\n").map((s: string) => s.trim()).filter(Boolean)}
              />
            )}
```

- [ ] **Step 3: Type-check**

```bash
cd /home/deploy/DigitalSac/landing && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Run all tests**

```bash
cd /home/deploy/DigitalSac/landing && npm test
```

Expected: all tests pass

- [ ] **Step 5: Build**

```bash
cd /home/deploy/DigitalSac/landing && npm run build
```

Expected: `✓ Compiled successfully` (or equivalent Next.js success output)

- [ ] **Step 6: Commit**

```bash
cd /home/deploy/DigitalSac/landing && git add src/components/landing/WhatsAppFloat.tsx src/app/\[locale\]/layout.tsx && git commit -m "$(cat <<'EOF'
feat(landing): subject-aware WhatsAppFloat — zero/one/many subjects from admin config

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Write report

**Files:**
- Create: `/home/deploy/DigitalSac/.superpowers/sdd/whatssubjects-report.md`

- [ ] **Step 1: Write report**

Write a ≤15-line status report at `/home/deploy/DigitalSac/.superpowers/sdd/whatssubjects-report.md` covering: Status, commit SHA + subject, one-line verification result, concerns.
