"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label } from "@/components/ui";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [totpRequired, setTotpRequired] = useState(false);
  const [totp, setTotp] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const body: Record<string, string> = { email, password };
    if (totpRequired) body.totp = totp;
    const res = await fetch("/api/admin/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      router.push("/admin");
    } else {
      const data = await res.json().catch(() => ({})) as { code?: string };
      if (data.code === "totp_required") {
        setTotpRequired(true);
        setError("");
      } else if (data.code === "totp_invalid") {
        setError("Código inválido.");
      } else if (res.status === 429) {
        setError("Muitas tentativas. Aguarde 15 minutos.");
      } else {
        setError("Credenciais inválidas.");
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-4 dark:bg-zinc-950">
      <Card className="w-full max-w-sm">
        <h1 className="mb-6 text-xl font-bold">Painel da Landing Page</h1>
        <form onSubmit={submit} className="space-y-4">
          <div><Label>E-mail</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
          <div><Label>Senha</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></div>
          {totpRequired && (
            <div>
              <Label>Código 2FA</Label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                pattern="\d{6}"
                value={totp}
                onChange={e => setTotp(e.target.value)}
                autoFocus
                placeholder="000000"
              />
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full">Entrar</Button>
        </form>
      </Card>
    </div>
  );
}
