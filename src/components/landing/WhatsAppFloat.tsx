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

  const assunto = subjects.length === 0 ? "" : subjects.length === 1 ? subjects[0] : selected;

  function handleStart() {
    const subjectChunk = assunto ? ` ${t("subjectLabel")}: ${assunto} —` : "";
    const msg = `${t("greeting")} ${name}.${subjectChunk} ${t("origin")}: ${document.title} (${location.pathname})`;
    const url = `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener");
  }

  return (
    // pointer-events-none no wrapper: a área invisível não pode bloquear cliques no conteúdo abaixo
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
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
        className="pointer-events-auto bg-[#25D366] hover:scale-105 transition shadow-lg rounded-full p-3.5"
      >
        <WaIcon />
      </button>
    </div>
  );
}
