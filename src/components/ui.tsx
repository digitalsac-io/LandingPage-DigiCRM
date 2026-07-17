import { cn } from "@/lib/cn";
import * as React from "react";

export function Button({
  variant = "solid", className, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "outline" | "ghost" }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    solid: "bg-brand text-white hover:bg-brand-dark",
    outline: "border border-zinc-300 dark:border-zinc-700 hover:border-brand hover:text-brand",
    ghost: "hover:bg-zinc-100 dark:hover:bg-zinc-800"
  };
  return <button className={cn(base, variants[variant], className)} {...props} />;
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900", className)} {...props} />;
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-zinc-700 dark:bg-zinc-900", className)} {...props} />;
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1 block text-sm font-medium", className)} {...props} />;
}

export function Toggle({ checked, onChange, label, className }: { checked: boolean; onChange: (v: boolean) => void; label?: string; className?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={cn("flex items-center gap-2", className)}>
      <span className={cn("h-6 w-11 rounded-full p-0.5 transition", checked ? "bg-brand" : "bg-zinc-300 dark:bg-zinc-700")}>
        <span className={cn("block h-5 w-5 rounded-full bg-white transition", checked && "translate-x-5")} />
      </span>
      {label && <span className="text-sm">{label}</span>}
    </button>
  );
}
