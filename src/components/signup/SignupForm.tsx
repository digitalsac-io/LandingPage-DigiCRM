"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button, Card, Input, Label } from "@/components/ui";
import { isStrongPassword } from "@/lib/validators";
import { CaptchaWidget } from "./CaptchaWidget";
import type { PlanCardData } from "@/components/landing/PlanCard";

function maskDocument(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
  }
  return d.replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function maskPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 13);
  return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{4})$/, "$1-$2");
}

type Props = {
  cards: PlanCardData[];
  preselected: string;
  captcha: { provider: "none" | "hcaptcha" | "turnstile"; siteKey: string };
  appUrl: string;
  termsHref: string;
  cardT: { modulesIncluded: string; select: string; featured: string };
};

export function SignupForm({ cards, preselected, captcha, appUrl, termsHref, cardT }: Props) {
  const t = useTranslations("landing.signup");
  const tErr = useTranslations("landing.errors");
  const locale = useLocale();
  const honeypotRef = useRef<HTMLInputElement>(null);
  const [planId, setPlanId] = useState(preselected || cards[0]?.id || "");
  const [form, setForm] = useState({ name: "", email: "", phone: "", document: "", password: "" });
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [formToken, setFormToken] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/public/form-token").then(r => r.json()).then(d => setFormToken(d.token)).catch(() => {});
  }, []);

  const onToken = useCallback((token: string) => setCaptchaToken(token), []);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = k === "document" ? maskDocument(e.target.value) : k === "phone" ? maskPhone(e.target.value) : e.target.value;
    setForm(f => ({ ...f, [k]: v }));
  };

  const passwordStrong = isStrongPassword(form.password);
  const passwordWeak = form.password.length > 0 && !passwordStrong;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("sending");
    const res = await fetch("/api/public/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, planId, locale, formToken, captchaToken, website: honeypotRef.current?.value ?? "" })
    }).catch(() => null);
    const body = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok && body.success) {
      setStatus("success");
      return;
    }
    setStatus("idle");
    const code = (body.code as string) || "generic";
    setError(tErr.has(code as never) ? tErr(code as never) : tErr("generic"));
  }

  if (status === "success") {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <h2 className="text-2xl font-bold text-brand">{t("successTitle")}</h2>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">{t("successText")}</p>
        {appUrl && (
          <a href={appUrl} className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition bg-brand text-white hover:bg-brand-dark">
            {t("goToApp")}
          </a>
        )}
      </Card>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
      <div>
        <h2 className="mb-4 text-xl font-semibold">{t("choosePlan")}</h2>
        <div role="radiogroup" aria-label={t("choosePlan")} className="flex flex-col gap-4">
          {cards.map(card => (
            <div
              key={card.id}
              role="radio"
              aria-checked={planId === card.id}
              tabIndex={0}
              onClick={() => setPlanId(card.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setPlanId(card.id);
                }
              }}
              className={`relative cursor-pointer rounded-2xl border bg-white p-4 text-left transition dark:bg-zinc-900 ${
                planId === card.id
                  ? "border-brand ring-2 ring-brand/30"
                  : "border-zinc-200 hover:border-brand/50 dark:border-zinc-800"
              }`}
            >
              {card.featured && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-0.5 text-xs font-semibold text-white">
                  {cardT.featured}
                </span>
              )}
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{card.name}</span>
                    {card.trialLabel && (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">{card.trialLabel}</span>
                    )}
                  </div>
                  <div className="mt-1 truncate text-xs text-zinc-500">{card.lines.join(" · ")}</div>
                  {card.extraItems.length > 0 && (
                    <div className="mt-0.5 flex flex-wrap gap-x-1.5 text-xs text-zinc-500">
                      {card.extraItems.filter(x => !x.negative).map(x => x.text).join(" · ")}
                      {card.extraItems.some(x => x.negative) && card.extraItems.some(x => !x.negative) && " · "}
                      {card.extraItems.filter(x => x.negative).map(x => `✕ ${x.text}`).join(" · ")}
                    </div>
                  )}
                  {card.moduleLabels.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {card.moduleLabels.map(m => (
                        <span key={m} className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand">{m}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-xl font-extrabold">{card.priceLabel}</span>
                  <span className="text-xs text-zinc-500">{card.recurrenceLabel}</span>
                  {card.approxLabel && <div className="text-[10px] text-zinc-500">{card.approxLabel}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <h2 className="text-xl font-semibold">{t("yourData")}</h2>
        {/* honeypot: invisível p/ humanos */}
        <input ref={honeypotRef} type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <div><Label htmlFor="name">{t("name")}</Label><Input id="name" required value={form.name} onChange={set("name")} /></div>
        <div><Label htmlFor="email">{t("email")}</Label><Input id="email" type="email" required value={form.email} onChange={set("email")} /></div>
        <div><Label htmlFor="phone">{t("phone")}</Label><Input id="phone" required value={form.phone} onChange={set("phone")} /></div>
        <div><Label htmlFor="document">{t("document")}</Label><Input id="document" required value={form.document} onChange={set("document")} onBlur={() => {
          const digits = form.document.replace(/\D/g, "");
          if ((digits.length !== 11 && digits.length !== 14) || form.name) return;
          fetch(`/api/public/document-lookup?doc=${digits}`)
            .then(r => r.ok ? r.json() : null)
            .then(j => { if (j?.name) setForm(f => f.name ? f : { ...f, name: j.name }); })
            .catch(() => {});
        }} /></div>
        <div>
          <Label htmlFor="password">{t("password")}</Label>
          <Input id="password" type="password" required minLength={8} value={form.password} onChange={set("password")}
            aria-invalid={passwordWeak}
            className={passwordWeak ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : undefined} />
          <p className={`mt-1 text-xs ${passwordWeak ? "text-red-600 dark:text-red-400" : "text-zinc-500"}`}>{t("passwordHint")}</p>
        </div>
        <div>
          <Label htmlFor="passwordConfirm">{t("passwordConfirm")}</Label>
          <Input id="passwordConfirm" type="password" required minLength={8} value={passwordConfirm}
            disabled={!passwordStrong}
            onChange={e => setPasswordConfirm(e.target.value)}
            className="disabled:cursor-not-allowed disabled:opacity-50"
            aria-invalid={passwordConfirm.length > 0 && passwordConfirm !== form.password} />
          {passwordStrong && passwordConfirm.length > 0 && passwordConfirm !== form.password && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{tErr("password_mismatch")}</p>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} required />
          <a href={termsHref} target="_blank" rel="noopener noreferrer" className="underline hover:text-brand">{t("acceptTerms")}</a>
        </label>
        <CaptchaWidget provider={captcha.provider} siteKey={captcha.siteKey} onToken={onToken} />
        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
        <Button type="submit" className="w-full"
          disabled={!accepted || status === "sending" || !passwordStrong || form.password !== passwordConfirm || (captcha.provider !== "none" && !!captcha.siteKey && !captchaToken)}>
          {status === "sending" ? t("submitting") : t("submit")}
        </Button>
      </form>
    </div>
  );
}
