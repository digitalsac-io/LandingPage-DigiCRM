"use client";
import { useState } from "react";
import { Menu, X } from "lucide-react";

type Item = { href: string; label: string };

export function MobileMenu({ links, loginUrl, loginLabel }: {
  links: Item[];
  loginUrl?: string;
  loginLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className="rounded-xl p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      {open && (
        <nav className="absolute left-0 right-0 top-16 border-b border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-col px-4 py-2 text-sm">
            {links.map(l => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-zinc-100 py-3 hover:text-brand last:border-0 dark:border-zinc-800/60"
              >
                {l.label}
              </a>
            ))}
            {loginUrl && (
              <a href={loginUrl} className="py-3 font-medium hover:text-brand">{loginLabel}</a>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
