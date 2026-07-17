"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 w-9" />;
  const dark = resolvedTheme === "dark";
  return (
    <button aria-label="Tema" onClick={() => setTheme(dark ? "light" : "dark")}
      className="rounded-xl p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
