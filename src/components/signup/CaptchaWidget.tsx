"use client";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    hcaptcha?: { render: (el: HTMLElement, opts: object) => string };
    turnstile?: { render: (el: HTMLElement, opts: object) => string };
  }
}

const SCRIPTS = {
  hcaptcha: "https://js.hcaptcha.com/1/api.js?render=explicit",
  turnstile: "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
};

export function CaptchaWidget({ provider, siteKey, onToken }: {
  provider: "none" | "hcaptcha" | "turnstile";
  siteKey: string;
  onToken: (token: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);

  useEffect(() => {
    if (provider === "none" || !siteKey || rendered.current) return;
    const render = () => {
      if (!ref.current || rendered.current) return;
      const api = provider === "hcaptcha" ? window.hcaptcha : window.turnstile;
      if (!api) return;
      rendered.current = true;
      api.render(ref.current, {
        sitekey: siteKey,
        callback: (token: string) => onToken(token),
        "expired-callback": () => onToken("")
      });
    };
    const existing = document.querySelector(`script[src="${SCRIPTS[provider]}"]`);
    if (existing) {
      render();
      const id = setInterval(() => { render(); if (rendered.current) clearInterval(id); }, 300);
      return () => clearInterval(id);
    }
    const script = document.createElement("script");
    script.src = SCRIPTS[provider];
    script.async = true;
    script.onload = render;
    document.head.appendChild(script);
  }, [provider, siteKey, onToken]);

  if (provider === "none" || !siteKey) return null;
  return <div ref={ref} className="my-4" />;
}
