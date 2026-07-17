"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button, Card, Input, Label, Toggle } from "@/components/ui";

const TABS = ["Branding", "Conteúdo", "Planos", "Integrações", "Segurança", "SEO", "Senha"] as const;
const LOCALES = ["pt-BR", "en", "es", "ru"];

const TEXT_KEYS: Record<string, string[]> = {
  hero: ["title", "subtitle", "cta", "ctaSecondary"],
  features: ["title", "subtitle"],
  plans: ["title", "subtitle"],
  cta: ["title", "subtitle", "button"]
};

type Config = Record<string, unknown> & {
  sections: Record<string, boolean>;
  social: Record<string, string>;
  seo: Record<string, { title: string; description: string }>;
};

// ─── UploadInput ────────────────────────────────────────────────────────────
function UploadInput({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setErr(body.error === "bad_type" ? "Tipo não permitido." : body.error === "too_large" ? "Arquivo muito grande (max 2MB)." : "Erro no upload.");
      } else {
        const { url } = await res.json() as { url: string };
        onChange(url);
      }
    } catch {
      setErr("Erro de rede.");
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div className="mb-4">
      <Label>{label}</Label>
      <div className="flex items-center gap-3 mt-1">
        {value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label} className="h-10 w-auto rounded border border-zinc-200 object-contain bg-zinc-50" />
        )}
        <input ref={ref} type="file" accept=".png,.jpg,.jpeg,.webp,.svg,.ico" className="hidden" onChange={handleFile} />
        <Button type="button" variant="outline" onClick={() => ref.current?.click()} disabled={uploading}>
          {uploading ? "Enviando…" : "Escolher arquivo"}
        </Button>
        {value && <span className="text-xs text-zinc-500 truncate max-w-[200px]">{value}</span>}
      </div>
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}

// ─── BrandingPanel ───────────────────────────────────────────────────────────
function BrandingPanel({ config, onSave }: { config: Config; onSave: (p: Record<string, unknown>) => Promise<void> }) {
  const [logoLight, setLogoLight] = useState(String(config.logoLight ?? ""));
  const [logoDark, setLogoDark] = useState(String(config.logoDark ?? ""));
  const [favicon, setFavicon] = useState(String(config.favicon ?? ""));
  const [ogImage, setOgImage] = useState(String(config.ogImage ?? ""));
  const [heroImage, setHeroImage] = useState(String(config.heroImage ?? ""));
  const [primaryColor, setPrimaryColor] = useState(String(config.primaryColor ?? "#4f46e5"));
  const [accentColor, setAccentColor] = useState(String(config.accentColor ?? "#06b6d4"));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await onSave({ logoLight, logoDark, favicon, ogImage, heroImage, primaryColor, accentColor });
    setSaving(false);
  }

  return (
    <Card>
      <h2 className="mb-6 text-lg font-bold">Branding</h2>
      <UploadInput label="Logo (fundo claro)" value={logoLight} onChange={setLogoLight} />
      <UploadInput label="Logo (fundo escuro)" value={logoDark} onChange={setLogoDark} />
      <UploadInput label="Favicon" value={favicon} onChange={setFavicon} />
      <UploadInput label="Imagem OG (compartilhamento social)" value={ogImage} onChange={setOgImage} />
      <UploadInput label="Imagem de fundo do topo (hero) — vazio usa o gradiente padrão" value={heroImage} onChange={setHeroImage} />

      <div className="mb-4">
        <Label>Cor primária</Label>
        <div className="flex items-center gap-3 mt-1">
          <input
            type="color"
            value={primaryColor}
            onChange={e => setPrimaryColor(e.target.value)}
            className="h-10 w-16 cursor-pointer rounded border border-zinc-300"
          />
          <div className="h-10 w-24 rounded-xl border border-zinc-200" style={{ background: primaryColor }} />
          <span className="text-sm text-zinc-600">{primaryColor}</span>
        </div>
      </div>

      <div className="mb-6">
        <Label>Cor de destaque (accent)</Label>
        <div className="flex items-center gap-3 mt-1">
          <input
            type="color"
            value={accentColor}
            onChange={e => setAccentColor(e.target.value)}
            className="h-10 w-16 cursor-pointer rounded border border-zinc-300"
          />
          <div className="h-10 w-24 rounded-xl border border-zinc-200" style={{ background: accentColor }} />
          <span className="text-sm text-zinc-600">{accentColor}</span>
        </div>
      </div>

      <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar branding"}</Button>
    </Card>
  );
}

// ─── ContentPanel ────────────────────────────────────────────────────────────
type TextRow = { section: string; locale: string; key: string; value: string };
type FaqItem = { id: number; locale: string; question: string; answer: string; order: number };

function ContentPanel({ config, onSave }: { config: Config; onSave: (p: Record<string, unknown>) => Promise<void> }) {
  const [locale, setLocale] = useState("pt-BR");
  const [messages, setMessages] = useState<Record<string, Record<string, string>>>({});
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [newFaq, setNewFaq] = useState({ question: "", answer: "", order: 0 });
  const [savingTexts, setSavingTexts] = useState(false);
  const [sections, setSections] = useState({ ...config.sections });
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const loadTexts = useCallback(async (loc: string) => {
    const res = await fetch(`/api/admin/texts?locale=${loc}`);
    if (res.ok) {
      const data = await res.json() as { messages: Record<string, Record<string, string>> };
      setMessages(data.messages ?? {});
      setEdits({});
    }
  }, []);

  const loadFaq = useCallback(async (loc: string) => {
    const res = await fetch(`/api/admin/faq?locale=${loc}`);
    if (res.ok) {
      const data = await res.json() as { items: FaqItem[] };
      setFaqItems(data.items ?? []);
    }
  }, []);

  useEffect(() => {
    loadTexts(locale);
    loadFaq(locale);
  }, [locale, loadTexts, loadFaq]);

  function getVal(section: string, key: string): string {
    const editKey = `${section}.${key}`;
    if (editKey in edits) return edits[editKey];
    return messages[section]?.[key] ?? "";
  }

  function setVal(section: string, key: string, value: string) {
    setEdits(prev => ({ ...prev, [`${section}.${key}`]: value }));
  }

  async function saveTexts() {
    setSavingTexts(true);
    const rows: TextRow[] = [];
    for (const [section, keys] of Object.entries(TEXT_KEYS)) {
      for (const key of keys) {
        const editKey = `${section}.${key}`;
        if (editKey in edits) {
          rows.push({ section, locale, key, value: edits[editKey] });
        }
      }
    }
    const res = await fetch("/api/admin/texts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows })
    });
    setSavingTexts(false);
    if (res.status === 401) { window.location.href = "/admin/login"; return; }
    if (res.ok) {
      setFeedback({ ok: true, msg: "Salvo!" });
      loadTexts(locale);
    } else {
      setFeedback({ ok: false, msg: "Erro ao salvar. Tente novamente." });
    }
    setTimeout(() => setFeedback(null), 2000);
  }

  async function addFaq() {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) return;
    const res = await fetch("/api/admin/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale, ...newFaq })
    });
    if (res.status === 401) { window.location.href = "/admin/login"; return; }
    if (res.ok) {
      setFeedback({ ok: true, msg: "Salvo!" });
      setNewFaq({ question: "", answer: "", order: 0 });
      loadFaq(locale);
    } else {
      setFeedback({ ok: false, msg: "Erro ao salvar. Tente novamente." });
    }
    setTimeout(() => setFeedback(null), 2000);
  }

  async function updateFaq(item: FaqItem) {
    const res = await fetch("/api/admin/faq", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, question: item.question, answer: item.answer, order: item.order })
    });
    if (res.status === 401) { window.location.href = "/admin/login"; return; }
    if (res.ok) {
      setFeedback({ ok: true, msg: "Salvo!" });
      loadFaq(locale);
    } else {
      setFeedback({ ok: false, msg: "Erro ao salvar. Tente novamente." });
    }
    setTimeout(() => setFeedback(null), 2000);
  }

  async function deleteFaq(id: number) {
    const res = await fetch(`/api/admin/faq?id=${id}`, { method: "DELETE" });
    if (res.status === 401) { window.location.href = "/admin/login"; return; }
    if (res.ok) {
      setFeedback({ ok: true, msg: "Salvo!" });
      loadFaq(locale);
    } else {
      setFeedback({ ok: false, msg: "Erro ao salvar. Tente novamente." });
    }
    setTimeout(() => setFeedback(null), 2000);
  }

  async function saveSections() {
    await onSave({ sections });
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <div className={`rounded-xl px-4 py-2 text-sm ${feedback.ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{feedback.msg}</div>
      )}
      {/* Locale selector */}
      <Card>
        <div className="mb-4 flex items-center gap-3">
          <Label className="mb-0">Locale:</Label>
          {LOCALES.map(loc => (
            <button
              key={loc}
              onClick={() => setLocale(loc)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${locale === loc ? "bg-brand text-white" : "border border-zinc-300 hover:border-brand hover:text-brand"}`}
            >
              {loc}
            </button>
          ))}
        </div>

        <h2 className="mb-4 text-lg font-bold">Textos — {locale}</h2>
        {Object.entries(TEXT_KEYS).map(([section, keys]) => (
          <div key={section} className="mb-6">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">{section}</h3>
            {keys.map(key => (
              <div key={key} className="mb-3">
                <Label>{key}</Label>
                <textarea
                  rows={2}
                  value={getVal(section, key)}
                  onChange={e => setVal(section, key, e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-zinc-700 dark:bg-zinc-900"
                  placeholder="(vazio = usar padrão do arquivo de mensagens)"
                />
              </div>
            ))}
          </div>
        ))}
        <Button onClick={saveTexts} disabled={savingTexts}>{savingTexts ? "Salvando…" : "Salvar textos"}</Button>
      </Card>

      {/* FAQ */}
      <Card>
        <h2 className="mb-4 text-lg font-bold">FAQ — {locale}</h2>
        <div className="mb-4 space-y-4">
          {faqItems.map(item => (
            <div key={item.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
              <div className="mb-2">
                <Label>Pergunta</Label>
                <Input
                  value={item.question}
                  onChange={e => setFaqItems(prev => prev.map(i => i.id === item.id ? { ...i, question: e.target.value } : i))}
                />
              </div>
              <div className="mb-2">
                <Label>Resposta</Label>
                <textarea
                  rows={3}
                  value={item.answer}
                  onChange={e => setFaqItems(prev => prev.map(i => i.id === item.id ? { ...i, answer: e.target.value } : i))}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label className="mb-0">Ordem:</Label>
                  <Input
                    type="number"
                    value={item.order}
                    onChange={e => setFaqItems(prev => prev.map(i => i.id === item.id ? { ...i, order: Number(e.target.value) } : i))}
                    className="w-20"
                  />
                </div>
                <Button variant="outline" onClick={() => updateFaq(item)}>Salvar</Button>
                <Button variant="ghost" onClick={() => deleteFaq(item.id)} className="text-red-600 hover:text-red-700">Remover</Button>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-dashed border-zinc-300 p-4 dark:border-zinc-600">
          <h3 className="mb-3 text-sm font-semibold">Adicionar pergunta</h3>
          <div className="mb-2">
            <Label>Pergunta</Label>
            <Input value={newFaq.question} onChange={e => setNewFaq(p => ({ ...p, question: e.target.value }))} />
          </div>
          <div className="mb-2">
            <Label>Resposta</Label>
            <textarea
              rows={3}
              value={newFaq.answer}
              onChange={e => setNewFaq(p => ({ ...p, answer: e.target.value }))}
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div className="mb-3 flex items-center gap-2">
            <Label className="mb-0">Ordem:</Label>
            <Input type="number" value={newFaq.order} onChange={e => setNewFaq(p => ({ ...p, order: Number(e.target.value) }))} className="w-20" />
          </div>
          <Button onClick={addFaq}>Adicionar</Button>
        </div>
      </Card>

      {/* Section toggles */}
      <Card>
        <h2 className="mb-4 text-lg font-bold">Seções visíveis</h2>
        <div className="space-y-3">
          {(["features", "plans", "faq", "cta"] as const).map(key => (
            <Toggle
              key={key}
              checked={!!sections[key]}
              onChange={v => setSections(prev => ({ ...prev, [key]: v }))}
              label={key.charAt(0).toUpperCase() + key.slice(1)}
            />
          ))}
        </div>
        <div className="mt-4">
          <Button onClick={saveSections}>Salvar seções</Button>
        </div>
      </Card>
    </div>
  );
}

// ─── PlansPanel ──────────────────────────────────────────────────────────────
function PlansPanel({ config, onSave }: { config: Config; onSave: (p: Record<string, unknown>) => Promise<void> }) {
  const [featuredPlanId, setFeaturedPlanId] = useState(String(config.featuredPlanId ?? ""));
  const [currencyConversion, setCurrencyConversion] = useState(Boolean(config.currencyConversion ?? false));
  const [plansColumns, setPlansColumns] = useState(Number(config.plansColumns ?? 3));
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<Array<{ id: string; name: string; price: number }>>([]);
  const [plansError, setPlansError] = useState(false);

  useEffect(() => {
    fetch("/api/public/plans")
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(j => setPlans(j.plans ?? []))
      .catch(() => setPlansError(true));
  }, []);

  async function save() {
    setSaving(true);
    await onSave({ featuredPlanId, currencyConversion, plansColumns: Number(plansColumns) });
    setSaving(false);
  }

  return (
    <Card>
      <h2 className="mb-6 text-lg font-bold">Planos</h2>
      <div className="mb-4">
        <Label>Plano em destaque</Label>
        <select
          value={featuredPlanId}
          onChange={e => setFeaturedPlanId(e.target.value)}
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">Nenhum</option>
          {plans.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} — R$ {Number(p.price).toFixed(2)}
            </option>
          ))}
          {featuredPlanId && !plans.some(p => p.id === featuredPlanId) && (
            <option value={featuredPlanId}>(plano atual: id {featuredPlanId})</option>
          )}
        </select>
        <p className="mt-1 text-xs text-zinc-500">
          {plansError
            ? "Não foi possível carregar os planos do backend — configure a URL do backend em Integrações."
            : `O plano escolhido ganha o selo “Mais popular” na página.`}
        </p>
      </div>
      <div className="mb-4">
        <Label>Cards por linha</Label>
        <select
          value={plansColumns}
          onChange={e => setPlansColumns(Number(e.target.value))}
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
        </select>
        <p className="mt-1 text-xs text-zinc-500">Com 4 por linha os cards ficam compactos automaticamente.</p>
      </div>
      <div className="mb-6">
        <Toggle
          checked={currencyConversion}
          onChange={setCurrencyConversion}
          label="Habilitar conversão de moeda automática"
        />
      </div>
      <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar planos"}</Button>
    </Card>
  );
}

// ─── IntegrationsPanel ───────────────────────────────────────────────────────
function IntegrationsPanel({ config, onSave }: { config: Config; onSave: (p: Record<string, unknown>) => Promise<void> }) {
  const social = (config.social ?? {}) as Record<string, string>;
  const [backendUrl, setBackendUrl] = useState(String(config.backendUrl ?? ""));
  const [appUrl, setAppUrl] = useState(String(config.appUrl ?? ""));
  const [siteUrl, setSiteUrl] = useState(String(config.siteUrl ?? ""));
  const [termsUrl, setTermsUrl] = useState(String(config.termsUrl ?? ""));
  const [termsHtml, setTermsHtml] = useState(String(config.termsHtml ?? ""));
  const [whatsapp, setWhatsapp] = useState(String(config.whatsapp ?? ""));
  const [whatsSubjects, setWhatsSubjects] = useState(String(config.whatsSubjects ?? ""));
  const [customScripts, setCustomScripts] = useState(String(config.customScripts ?? ""));
  const [cpfApiKey, setCpfApiKey] = useState(String(config.cpfApiKey ?? ""));
  const [instagram, setInstagram] = useState(social.instagram ?? "");
  const [facebook, setFacebook] = useState(social.facebook ?? "");
  const [linkedin, setLinkedin] = useState(social.linkedin ?? "");
  const [youtube, setYoutube] = useState(social.youtube ?? "");
  const [x, setX] = useState(social.x ?? "");
  const [testResult, setTestResult] = useState<{ ok: boolean; count?: number; error?: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    const res = await fetch("/api/admin/test-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ backendUrl })
    });
    setTestResult(await res.json() as { ok: boolean; count?: number; error?: string });
    setTesting(false);
  }

  async function save() {
    setSaving(true);
    await onSave({
      backendUrl, appUrl, siteUrl, termsUrl, termsHtml, whatsapp, whatsSubjects, cpfApiKey, customScripts,
      social: { instagram, facebook, linkedin, youtube, x }
    });
    setSaving(false);
  }

  return (
    <Card>
      <h2 className="mb-6 text-lg font-bold">Integrações</h2>
      <div className="mb-4">
        <Label>URL do backend</Label>
        <div className="flex gap-2">
          <Input value={backendUrl} onChange={e => setBackendUrl(e.target.value)} placeholder="https://api.seusite.com.br" />
          <Button type="button" variant="outline" onClick={testConnection} disabled={testing || !backendUrl}>
            {testing ? "Testando…" : "Testar"}
          </Button>
        </div>
        {testResult && (
          <p className={`mt-2 text-sm ${testResult.ok ? "text-green-700" : "text-red-600"}`}>
            {testResult.ok ? `Conexão OK — ${testResult.count} plano(s) encontrado(s)` : `Erro: ${testResult.error}`}
          </p>
        )}
      </div>
      <div className="mb-4"><Label>URL do app (login)</Label><Input value={appUrl} onChange={e => setAppUrl(e.target.value)} placeholder="https://app.seusite.com.br" /></div>
      <div className="mb-4"><Label>URL do site</Label><Input value={siteUrl} onChange={e => setSiteUrl(e.target.value)} placeholder="https://www.seusite.com.br" /></div>
      <div className="mb-4"><Label>URL dos termos de uso</Label><Input value={termsUrl} onChange={e => setTermsUrl(e.target.value)} placeholder="https://www.seusite.com.br/termos" /></div>
      <div className="mb-4">
        <Label>HTML dos termos (embutido)</Label>
        <textarea
          rows={8}
          value={termsHtml}
          onChange={e => setTermsHtml(e.target.value)}
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-zinc-700 dark:bg-zinc-900 font-mono"
          placeholder="<p>Conteúdo dos termos…</p>"
        />
      </div>
      <div className="mb-4"><Label>WhatsApp (com DDI, ex: 5511999999999)</Label><Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} /></div>
      <div className="mb-4">
        <Label>Assuntos do WhatsApp (um por linha)</Label>
        <textarea
          rows={3}
          value={whatsSubjects}
          onChange={e => setWhatsSubjects(e.target.value)}
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-zinc-700 dark:bg-zinc-900"
          placeholder={"Ex.: Suporte técnico\nComercial\nFinanceiro"}
        />
        <p className="mt-1 text-xs text-zinc-500">
          Um assunto: vai fixo na mensagem. Vários: o visitante escolhe. Vazio: sem campo de assunto.
        </p>
      </div>
      <div className="mb-4">
        <Label>Código personalizado (injetado no fim da página — ex.: webchat, pixel, analytics)</Label>
        <textarea
          rows={6}
          value={customScripts}
          onChange={e => setCustomScripts(e.target.value)}
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-zinc-700 dark:bg-zinc-900 font-mono"
          placeholder="<script>/* seu código aqui */</script>"
        />
      </div>
      <div className="mb-4">
        <Label>API key consulta CPF (apicpf.com)</Label>
        <Input
          type="password"
          value={cpfApiKey}
          onChange={e => setCpfApiKey(e.target.value)}
          placeholder={cpfApiKey === "***" ? "••• mantido atual •••" : ""}
        />
        <p className="mt-1 text-xs text-zinc-500">Deixe "***" para manter; em branco apaga. CNPJ não precisa de chave.</p>
      </div>

      <h3 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-zinc-500">Redes sociais</h3>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div><Label>Instagram</Label><Input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@usuario" /></div>
        <div><Label>Facebook</Label><Input value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="https://facebook.com/..." /></div>
        <div><Label>LinkedIn</Label><Input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/..." /></div>
        <div><Label>YouTube</Label><Input value={youtube} onChange={e => setYoutube(e.target.value)} placeholder="https://youtube.com/..." /></div>
        <div><Label>X (Twitter)</Label><Input value={x} onChange={e => setX(e.target.value)} placeholder="@usuario" /></div>
      </div>
      <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar integrações"}</Button>
    </Card>
  );
}

// ─── SecurityPanel ───────────────────────────────────────────────────────────
type Attempt = { id: number; createdAt: string; ip: string; email: string; result: string };

function SecurityPanel({ config, onSave }: { config: Config; onSave: (p: Record<string, unknown>) => Promise<void> }) {
  const [captchaProvider, setCaptchaProvider] = useState(String(config.captchaProvider ?? "none"));
  const [captchaSiteKey, setCaptchaSiteKey] = useState(String(config.captchaSiteKey ?? ""));
  const [captchaSecret, setCaptchaSecret] = useState(String(config.captchaSecret ?? ""));
  const [signupPerHour, setSignupPerHour] = useState(Number(config.signupPerHour ?? 5));
  const [signupPerDay, setSignupPerDay] = useState(Number(config.signupPerDay ?? 20));
  const [blockDisposable, setBlockDisposable] = useState(Boolean(config.blockDisposable ?? false));
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/attempts?limit=100")
      .then(r => r.json())
      .then((data: { attempts?: Attempt[] }) => setAttempts(data.attempts ?? []))
      .catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    await onSave({ captchaProvider, captchaSiteKey, captchaSecret, signupPerHour, signupPerDay, blockDisposable });
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-6 text-lg font-bold">Segurança</h2>
        <div className="mb-4">
          <Label>Provedor de CAPTCHA</Label>
          <select
            value={captchaProvider}
            onChange={e => setCaptchaProvider(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="none">Nenhum</option>
            <option value="hcaptcha">hCaptcha</option>
            <option value="turnstile">Cloudflare Turnstile</option>
          </select>
        </div>
        {captchaProvider !== "none" && (
          <>
            <div className="mb-4"><Label>Site Key (pública)</Label><Input value={captchaSiteKey} onChange={e => setCaptchaSiteKey(e.target.value)} /></div>
            <div className="mb-4">
              <Label>Secret Key (privada)</Label>
              <Input
                type="password"
                value={captchaSecret}
                onChange={e => setCaptchaSecret(e.target.value)}
                placeholder={captchaSecret === "***" ? "••• mantido atual •••" : ""}
              />
              <p className="mt-1 text-xs text-zinc-500">Deixe "***" para manter o valor atual; em branco apaga o secret.</p>
            </div>
          </>
        )}
        <div className="mb-4">
          <Label>Máx. cadastros por hora (por IP)</Label>
          <Input type="number" min={1} max={100} value={signupPerHour} onChange={e => setSignupPerHour(Number(e.target.value))} className="w-32" />
        </div>
        <div className="mb-4">
          <Label>Máx. cadastros por dia (por IP)</Label>
          <Input type="number" min={1} max={1000} value={signupPerDay} onChange={e => setSignupPerDay(Number(e.target.value))} className="w-32" />
        </div>
        <div className="mb-6">
          <Toggle checked={blockDisposable} onChange={setBlockDisposable} label="Bloquear e-mails descartáveis" />
        </div>
        <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar segurança"}</Button>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-bold">Tentativas de cadastro recentes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="pb-2 text-left font-semibold text-zinc-500">Data</th>
                <th className="pb-2 text-left font-semibold text-zinc-500">IP</th>
                <th className="pb-2 text-left font-semibold text-zinc-500">E-mail</th>
                <th className="pb-2 text-left font-semibold text-zinc-500">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {attempts.length === 0 && (
                <tr><td colSpan={4} className="py-4 text-center text-zinc-400">Nenhuma tentativa registrada.</td></tr>
              )}
              {attempts.map(a => (
                <tr key={a.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="py-2 pr-4 whitespace-nowrap text-zinc-600">{new Date(a.createdAt).toLocaleString("pt-BR")}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{a.ip}</td>
                  <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300">{a.email}</td>
                  <td className="py-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${a.result.startsWith("blocked_") ? "bg-red-100 text-red-700" : a.result === "success" ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-600"}`}>
                      {a.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── SeoPanel ─────────────────────────────────────────────────────────────────
function SeoPanel({ config, onSave }: { config: Config; onSave: (p: Record<string, unknown>) => Promise<void> }) {
  const [seo, setSeo] = useState<Record<string, { title: string; description: string }>>(() => {
    const base: Record<string, { title: string; description: string }> = {};
    for (const loc of LOCALES) {
      base[loc] = { title: config.seo?.[loc]?.title ?? "", description: config.seo?.[loc]?.description ?? "" };
    }
    return base;
  });
  const [saving, setSaving] = useState(false);

  function set(loc: string, field: "title" | "description", value: string) {
    setSeo(prev => ({ ...prev, [loc]: { ...prev[loc], [field]: value } }));
  }

  async function save() {
    setSaving(true);
    await onSave({ seo });
    setSaving(false);
  }

  return (
    <Card>
      <h2 className="mb-6 text-lg font-bold">SEO por locale</h2>
      {LOCALES.map(loc => (
        <div key={loc} className="mb-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">{loc}</h3>
          <div className="mb-3">
            <Label>Título ({loc})</Label>
            <Input value={seo[loc]?.title ?? ""} onChange={e => set(loc, "title", e.target.value)} placeholder="Título da página" />
          </div>
          <div>
            <Label>Descrição ({loc})</Label>
            <textarea
              rows={3}
              value={seo[loc]?.description ?? ""}
              onChange={e => set(loc, "description", e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="Meta description da página"
            />
          </div>
        </div>
      ))}
      <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar SEO"}</Button>
    </Card>
  );
}

// ─── TotpPanel ───────────────────────────────────────────────────────────────
function TotpPanel() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [setupData, setSetupData] = useState<{ otpauthUrl: string; secret: string; qrDataUrl: string } | null>(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [disableInput, setDisableInput] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/totp/status")
      .then(r => r.json())
      .then((d: { enabled?: boolean }) => setEnabled(d.enabled ?? false))
      .catch(() => setEnabled(false));
  }, []);

  function showMsg(ok: boolean, text: string) {
    setMsg({ ok, text });
    setTimeout(() => setMsg(null), 3000);
  }

  async function startSetup() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/totp/setup", { method: "POST" });
      if (!res.ok) { showMsg(false, "Erro ao gerar segredo 2FA."); return; }
      const data = await res.json() as { otpauthUrl: string; secret: string };
      const qrDataUrl = await QRCode.toDataURL(data.otpauthUrl);
      setSetupData({ ...data, qrDataUrl });
      setConfirmCode("");
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnable() {
    if (!setupData) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/totp/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: confirmCode })
      });
      if (res.ok) {
        setEnabled(true);
        setSetupData(null);
        setConfirmCode("");
        showMsg(true, "2FA ativado com sucesso!");
      } else {
        showMsg(false, "Código inválido. Verifique seu app autenticador.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function disableTotp() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/totp/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: disableInput, password: disableInput })
      });
      if (res.ok) {
        setEnabled(false);
        setDisableInput("");
        showMsg(true, "2FA desativado.");
      } else {
        showMsg(false, "Código ou senha inválidos.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (enabled === null) return null;

  return (
    <Card className="max-w-md mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Autenticação em duas etapas (2FA)</h2>
        {enabled
          ? <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Ativo</span>
          : <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500">Inativo</span>
        }
      </div>

      {msg && (
        <div className={`mb-4 rounded-xl px-4 py-2 text-sm ${msg.ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{msg.text}</div>
      )}

      {!enabled && !setupData && (
        <Button onClick={startSetup} disabled={busy}>{busy ? "Gerando…" : "Ativar 2FA"}</Button>
      )}

      {!enabled && setupData && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-600">Escaneie o QR code no seu app autenticador (Google Authenticator, Authy, etc.):</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={setupData.qrDataUrl} alt="QR Code 2FA" className="h-48 w-48 rounded border border-zinc-200" />
          <div>
            <p className="text-xs text-zinc-500 mb-1">Ou insira o código manualmente:</p>
            <code className="block rounded bg-zinc-100 px-3 py-2 text-xs font-mono break-all dark:bg-zinc-800">{setupData.secret}</code>
          </div>
          <div>
            <Label>Código de confirmação (6 dígitos)</Label>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              pattern="\d{6}"
              value={confirmCode}
              onChange={e => setConfirmCode(e.target.value)}
              placeholder="000000"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={confirmEnable} disabled={busy || confirmCode.length !== 6}>{busy ? "Verificando…" : "Confirmar"}</Button>
            <Button variant="ghost" onClick={() => { setSetupData(null); setConfirmCode(""); }}>Cancelar</Button>
          </div>
        </div>
      )}

      {enabled && (
        <div className="space-y-3">
          <p className="text-sm text-zinc-600">Para desativar, insira seu código 2FA ou senha atual:</p>
          <Input
            type="text"
            value={disableInput}
            onChange={e => setDisableInput(e.target.value)}
            placeholder="Código 2FA ou senha atual"
          />
          <Button variant="outline" onClick={disableTotp} disabled={busy || !disableInput}
            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300">
            {busy ? "Desativando…" : "Desativar 2FA"}
          </Button>
        </div>
      )}
    </Card>
  );
}

// ─── PasswordPanel ───────────────────────────────────────────────────────────
function PasswordPanel() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/admin/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current, next })
    });
    const body = await res.json() as { success?: boolean; code?: string };
    if (body.success) {
      setMsg({ ok: true, text: "Senha alterada com sucesso! Faça login novamente." });
      setCurrent("");
      setNext("");
      setTimeout(() => { window.location.href = "/admin/login"; }, 2000);
    } else {
      const codes: Record<string, string> = {
        wrong_password: "Senha atual incorreta.",
        weak_password: "Nova senha muito fraca (mínimo 8 caracteres, letras e números).",
        unauthorized: "Sessão expirada."
      };
      setMsg({ ok: false, text: codes[body.code ?? ""] ?? "Erro ao alterar senha." });
    }
    setSaving(false);
  }

  return (
    <div className="space-y-0">
      <Card className="max-w-md">
        <h2 className="mb-6 text-lg font-bold">Alterar senha</h2>
        <form onSubmit={save} className="space-y-4">
          <div>
            <Label>Senha atual</Label>
            <Input type="password" value={current} onChange={e => setCurrent(e.target.value)} required />
          </div>
          <div>
            <Label>Nova senha</Label>
            <Input type="password" value={next} onChange={e => setNext(e.target.value)} required />
            <p className="mt-1 text-xs text-zinc-500">Mínimo 8 caracteres, com letras e números.</p>
          </div>
          {msg && (
            <p className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>
          )}
          <Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Alterar senha"}</Button>
        </form>
      </Card>
      <TotpPanel />
    </div>
  );
}

// ─── AdminPanels (main) ──────────────────────────────────────────────────────
export function AdminPanels({ userEmail }: { userEmail: string }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Branding");
  const [config, setConfig] = useState<Config | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/config");
    if (res.status === 401) { window.location.href = "/admin/login"; return; }
    setConfig(await res.json() as Config);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveConfig(patch: Record<string, unknown>) {
    const res = await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    if (res.status === 401) { window.location.href = "/admin/login"; return; }
    if (res.ok) {
      setFeedback({ ok: true, msg: "Salvo!" });
      load();
    } else {
      setFeedback({ ok: false, msg: "Erro ao salvar. Tente novamente." });
    }
    setTimeout(() => setFeedback(null), 2000);
  }

  if (!config) return <div className="p-10 text-zinc-500">Carregando…</div>;

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6 text-sm font-bold">Landing Admin</div>
        {TABS.map(name => (
          <button
            key={name}
            onClick={() => setTab(name)}
            className={`mb-1 block w-full rounded-lg px-3 py-2 text-left text-sm transition ${tab === name ? "bg-brand text-white" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
          >
            {name}
          </button>
        ))}
        <form action="/api/admin/logout" method="post" className="mt-8">
          <button className="text-xs text-zinc-500 hover:text-red-600">Sair ({userEmail})</button>
        </form>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        {feedback && (
          <div className={`mb-4 rounded-xl px-4 py-2 text-sm ${feedback.ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{feedback.msg}</div>
        )}
        {tab === "Branding" && <BrandingPanel config={config} onSave={saveConfig} />}
        {tab === "Conteúdo" && <ContentPanel config={config} onSave={saveConfig} />}
        {tab === "Planos" && <PlansPanel config={config} onSave={saveConfig} />}
        {tab === "Integrações" && <IntegrationsPanel config={config} onSave={saveConfig} />}
        {tab === "Segurança" && <SecurityPanel config={config} onSave={saveConfig} />}
        {tab === "SEO" && <SeoPanel config={config} onSave={saveConfig} />}
        {tab === "Senha" && <PasswordPanel />}
      </main>
    </div>
  );
}
