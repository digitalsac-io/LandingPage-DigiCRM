# DigitalSac Landing

Landing page white-label por instalação para o DigitalSac. Substitui o antigo `LandingPage/` em PHP. Construída com Next.js 16 (output standalone), Tailwind CSS 4, next-intl (pt-BR, en, es, ru), Prisma v7 + SQLite (better-sqlite3) e deploy via Docker.

## O que é

Cada instância do DigitalSac pode ter sua própria landing page configurada via painel admin local (`/admin`). O operador define a URL do backend, branding, captcha, planos em destaque, textos por idioma e mais — sem alterar código.

---

## Deploy com Docker

### 1. Pré-requisitos

- Docker + Docker Compose v2

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` e defina:

| Variável | Descrição |
|---|---|
| `SESSION_SECRET` | Segredo para cookies de sessão admin (string aleatória longa) |
| `ADMIN_EMAIL` | E-mail do primeiro administrador |
| `ADMIN_PASSWORD` | Senha do primeiro administrador (mín. 8 chars) |

> **Nota:** `DATABASE_URL` é lida pelo `prisma.config.ts` (não pelo `schema.prisma`) — pendência de compatibilidade com Prisma v7 documentada na Task 2. O compose define `DATABASE_URL=file:./data/landing.db` apontando para o volume montado.

### 3. Subir o serviço

```bash
docker compose up -d
```

O entrypoint executa automaticamente:
1. `prisma migrate deploy` — aplica migrações pendentes no SQLite
2. `node scripts/seed.cjs` — cria o admin inicial (idempotente) e garante `SiteConfig`
3. `node server.js` — inicia o Next.js standalone na porta 3005

### 4. Acessar o painel admin

Abra `http://SEU_DOMINIO:3005/admin/login` e entre com `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

### 5. Configuração inicial no admin

- **Aba Integrações:** preencha "URL do backend" (ex.: `https://back01.digitalsac.com.br`) e "URL do app" (ex.: `https://app.digitalsac.com.br`).
- **Aba Branding:** faça upload do logo claro/escuro, favicon e imagem OG; ajuste as cores primária e accent.
- **Aba Segurança:** escolha o provedor de captcha (`hcaptcha` ou `turnstile`) e cole as chaves de site e segredo.
- **Aba Textos:** personalize textos de cada seção por idioma.

---

## Desenvolvimento local

```bash
# Instalar dependências
npm install

# Criar banco e aplicar migrações
npx prisma migrate dev

# Seed inicial (requer ADMIN_EMAIL e ADMIN_PASSWORD no .env)
npm run db:seed

# Iniciar em modo dev (porta 3005)
npm run dev
```

Acesse `http://localhost:3005`.

---

## Testes

### Unitários (Vitest)

```bash
npm test
```

### E2E (Playwright)

```bash
npm run e2e
```

Playwright sobe automaticamente tanto o servidor de desenvolvimento (porta 3005) quanto o mock backend (porta 4999) — nenhum passo manual necessário. Todos os 6 testes (4 locales + tema + signup) rodam direto.

**Para debug / reset manual (opcional):**

```bash
# Restaurar backendUrl e limpar tentativas
node e2e/teardown.js
```

---

## Segurança embutida

- Rate limit persistente: 5 cadastros/hora + 20/dia por IP (SQLite)
- Honeypot + tempo mínimo de preenchimento (3 s)
- Captcha server-side configurável (hCaptcha ou Turnstile)
- Bloqueio de domínios de e-mail descartáveis
- Validação server-side de CPF/CNPJ via dígito verificador
- Auditoria de tentativas de cadastro em `/admin` → aba Segurança

---

## Produção: proxy reverso HTTPS obrigatório

Antes de expor a landing em produção, configure um proxy reverso (NGINX, Traefik ou similar) com TLS. Dois motivos críticos:

**(a) Cookie de sessão admin é `secure` em produção.** Quando `NODE_ENV=production`, o cookie de autenticação do painel `/admin` só é enviado pelo navegador em conexões HTTPS. Acessar a landing via `http://` em produção faz o login falhar silenciosamente — o cookie não é gravado e o painel parece nunca autenticar. Essa restrição **não se aplica em localhost** (onde `secure` não é exigido pelo navegador).

**(b) O rate limit usa `X-Forwarded-For`.** A proteção contra spam de cadastro lê o IP real do visitante a partir do header `X-Forwarded-For`. Publique a porta `3005` **apenas** para o proxy reverso, que deve sobrescrever esse header com o IP do cliente real. Jamais exponha a porta 3005 diretamente na internet: um atacante poderia forjar o header e contornar o rate limit completamente.

Exemplo mínimo de configuração NGINX:

```nginx
server {
    listen 443 ssl;
    server_name landing.seudominio.com.br;
    # ... configuração TLS ...

    location / {
        proxy_pass http://127.0.0.1:3005;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }
}
```

---

## Estrutura principal

```
landing/
├── prisma/           # schema.prisma + migrações + seed.ts
├── prisma.config.ts  # config Prisma v7 (lê DATABASE_URL)
├── scripts/          # seed.cjs (usado no Docker entrypoint)
├── src/
│   ├── app/          # rotas Next.js (App Router)
│   │   ├── [locale]/ # páginas públicas i18n
│   │   ├── admin/    # painel admin (protegido por sessão)
│   │   └── api/      # rotas API (public/plans, public/register, admin/*)
│   ├── components/   # componentes React
│   └── lib/          # helpers (config, backend, captcha, rate-limit…)
├── messages/         # traduções JSON por idioma
├── e2e/              # testes Playwright
├── Dockerfile
└── docker-compose.yml
```

## Deploy em Docker Swarm (Portainer + Traefik)

Para clientes com Traefik já instalado, use o `docker-stack.yml`:

1. A imagem pública `digitalsac/landing:latest` é publicada pelo workflow do GitHub (`deploy_landing_dockerhub.yml`) — o Swarm baixa direto do Docker Hub, sem build local.
2. No Portainer: **Stacks → Add stack**, cole o conteúdo de `docker-stack.yml` ajustando:
   - `Host(\`landing.suaempresa.com.br\`)` → domínio do cliente (aponte o DNS para o Swarm);
   - `network_public` → nome da rede overlay do Traefik da instalação;
   - `letsencryptresolver` → nome do certresolver configurado no Traefik;
   - `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
3. Suba a stack. O Traefik emite o certificado e passa a rotear com HTTPS — o cookie
   `secure` do admin e o `X-Forwarded-For` do rate limit funcionam corretamente
   atrás dele (ver seção "Produção: proxy reverso HTTPS obrigatório").
4. **SQLite ⇒ `replicas: 1` sempre**, com constraint fixando o serviço num nó — os
   volumes `landing_data`/`landing_uploads` são locais àquele nó.
5. Primeiro acesso: `https://landing.suaempresa.com.br/admin/login` → aba Integrações
   → URL do backend do cliente.
