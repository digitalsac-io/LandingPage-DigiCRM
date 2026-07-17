# DigitalSac Landing (white-label)

Landing page de vendas e cadastro white-label para o DigitalSac. Construída com Next.js (output standalone), Tailwind CSS 4, next-intl (pt-BR, en, es, ru), Prisma v7 + SQLite (better-sqlite3) e deploy via Docker.

---

## 1. O que é

Cada instância do DigitalSac pode ter sua própria landing page configurada via painel admin local (`/admin`). O operador define a URL do backend, branding, captcha, planos em destaque, textos por idioma e muito mais — sem alterar código.

- **Proxy transparente:** todas as chamadas ao backend DigitalSac são feitas via `/api/proxy/*`, evitando CORS e ocultando a URL real do backend ao navegador.
- **Admin local em `/admin`:** painel de configuração protegido por sessão (cookie `secure`).
- **Imagem pública no Docker Hub:** `digitalsac/landing:latest`, publicada automaticamente pelo workflow de CI/CD do monorepo (`deploy_landing_dockerhub.yml` na raiz do monorepo) e pelo workflow standalone (`.github/workflows/docker-publish.yml` dentro de `landing/`).

---

## 2. Variáveis de ambiente

Copie `.env.example` como ponto de partida:

```bash
cp .env.example .env
```

| Variável | Obrigatória | Padrão | Descrição |
|---|:---:|---|---|
| `SESSION_SECRET` | **sim** | — | Segredo para cookies de sessão admin. Gere com `openssl rand -hex 32`. |
| `ADMIN_EMAIL` | **sim** | — | E-mail do administrador criado no primeiro boot. Pode ser trocado depois pela UI. |
| `ADMIN_PASSWORD` | **sim** | — | Senha do administrador (mín. 8 chars). Pode ser trocada depois pela UI (aba Senha). |
| `DATABASE_URL` | não | `file:./data/landing.db` | Caminho do banco SQLite. Lida pelo `prisma.config.ts` (não pelo `schema.prisma`) — pendência de compatibilidade com Prisma v7. No Docker, apontar para o volume: `file:/app/data/landing.db`. |
| `UPLOAD_DIR` | não | `./uploads` | Diretório para uploads de imagens (logos, favicon, OG). No Docker use `/app/uploads`. |
| `PORT` | não | `3005` | Porta de escuta do servidor Next.js. |

> **Importante:** a URL do backend DigitalSac, logos, cores, textos, captcha, número de WhatsApp e demais configurações **não são variáveis de ambiente** — são definidas pelo painel `/admin` após a instalação.

---

## 3. Instalação — Portainer (Docker Swarm + Traefik)

### Pré-requisitos

- Docker Swarm inicializado (`docker swarm init`).
- Traefik rodando na mesma rede overlay com entrypoints `web` (80) e `websecure` (443) e um `certresolver` configurado (ex.: `letsencryptresolver`).
- DNS do domínio desejado apontando para o IP do nó Swarm (registro A ou CNAME).

### Passo a passo

1. **DNS:** aponte o domínio da landing (ex.: `landing.suaempresa.com.br`) para o IP do servidor Swarm.

2. **Portainer → Stacks → Add stack:** cole o conteúdo de `docker-stack.yml` no editor de stack.

3. **Ajuste os seguintes trechos antes de fazer deploy:**

   - `Host(\`landing.suaempresa.com.br\`)` (duas ocorrências) → domínio real do cliente.
   - `network_public` → nome da rede overlay do Traefik da sua instalação (variações comuns: `traefik-public`, `traefik_public`).
   - `letsencryptresolver` → nome do certresolver configurado no Traefik (variações: `le`, `letsencrypt`).
   - Variáveis de ambiente obrigatórias:
     ```
     SESSION_SECRET: "resultado-do-openssl-rand-hex-32"
     ADMIN_EMAIL: "admin@suaempresa.com.br"
     ADMIN_PASSWORD: "senha-forte-aqui"
     ```

4. **Deploy:** clique em **Deploy the stack**. O Portainer puxa `digitalsac/landing:latest` do Docker Hub.

5. **Aguarde o certificado:** o Traefik solicita o certificado Let's Encrypt automaticamente. Em alguns segundos o domínio já estará acessível via HTTPS.

6. **Primeiro acesso:** abra `https://landing.suaempresa.com.br/admin/login` e entre com `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

### Avisos importantes

- **SQLite exige `replicas: 1`** e constraint de nó fixo. Os volumes `landing_data` e `landing_uploads` são locais ao nó onde o serviço roda — mover o serviço para outro nó sem migrar os volumes resulta em perda de dados.
- O **healthcheck** está embutido na imagem (`GET /healthz`). O Swarm reinicia o container automaticamente se ele não responder.
- O cookie `secure` do admin e o `X-Forwarded-For` do rate limit funcionam corretamente atrás do Traefik (ver seção 10).

---

## 4. Instalação — EasyPanel

1. **Criar projeto** no EasyPanel e dentro dele criar um novo **App**.

2. **Source:** selecione **Docker Image** e informe `digitalsac/landing:latest`.

3. **Environment:** adicione as variáveis obrigatórias e opcionais:
   ```
   SESSION_SECRET=resultado-do-openssl-rand-hex-32
   ADMIN_EMAIL=admin@suaempresa.com.br
   ADMIN_PASSWORD=senha-forte-aqui
   DATABASE_URL=file:/app/data/landing.db
   UPLOAD_DIR=/app/uploads
   ```

4. **Mounts:** adicione dois volumes:
   - Volume persistente em `/app/data` (banco SQLite).
   - Volume persistente em `/app/uploads` (imagens de branding).

5. **Port:** exponha a porta `3005` (a EasyPanel fará o proxy internamente).

6. **Domains:** adicione o domínio desejado. A EasyPanel provisiona o certificado HTTPS via Let's Encrypt/Traefik automaticamente.

7. **Deploy:** clique em Deploy e aguarde a imagem ser puxada e o container iniciar.

8. **Primeiro acesso:** abra `https://seudominio.com.br/admin/login`.

> **Nota:** a EasyPanel já coloca o app atrás de proxy HTTPS, então o cookie `secure` do admin e o header `X-Forwarded-For` do rate limit funcionam corretamente sem configuração adicional.

---

## 5. Instalação — Manual com Docker Compose (VPS simples)

### Passo a passo

1. **Instale Docker** e Docker Compose v2 na VPS:
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```

2. **Crie a pasta do projeto e baixe os arquivos necessários:**
   ```bash
   mkdir -p /opt/landing && cd /opt/landing
   # Copie docker-compose.yml e .env.example do repositório, ou use a versão abaixo
   ```

3. **Crie o arquivo `.env`:**
   ```bash
   cp .env.example .env
   # Edite e defina as 3 variáveis obrigatórias
   ```

   Conteúdo mínimo do `.env`:
   ```env
   SESSION_SECRET=resultado-do-openssl-rand-hex-32
   ADMIN_EMAIL=admin@suaempresa.com.br
   ADMIN_PASSWORD=senha-forte-aqui
   ```

4. **Para usar a imagem pública** (sem precisar clonar o repositório), substitua `build: .` por `image: digitalsac/landing:latest` no `docker-compose.yml`.

5. **Suba o serviço:**
   ```bash
   docker compose up -d
   ```

   O entrypoint executa automaticamente:
   - `prisma migrate deploy` — aplica migrações pendentes no SQLite.
   - `node scripts/seed.cjs` — cria o admin inicial (idempotente) e garante `SiteConfig`.
   - `node server.js` — inicia o Next.js standalone na porta 3005.

6. **Configure o proxy reverso HTTPS.** Sem HTTPS, o login no admin falha (cookie `secure`). Exemplo mínimo com NGINX:

   ```nginx
   server {
       listen 443 ssl;
       server_name landing.seudominio.com.br;
       # ... configuração TLS (certbot / Let's Encrypt) ...

       location / {
           proxy_pass http://127.0.0.1:3005;
           proxy_set_header X-Forwarded-For $remote_addr;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_set_header Host $host;
       }
   }

   server {
       listen 80;
       server_name landing.seudominio.com.br;
       return 301 https://$host$request_uri;
   }
   ```

   Não exponha a porta 3005 diretamente na internet (ver seção 10).

7. **Primeiro acesso:** `https://landing.seudominio.com.br/admin/login`.

---

## 6. Instalação — Manual sem Docker (Node)

### Pré-requisitos

- Node.js 20+ (recomendado: mesma versão do `Dockerfile`, atualmente Node 22).
- npm 10+.

### Passo a passo

1. **Clone e instale dependências:**
   ```bash
   git clone <repo> landing && cd landing
   npm install
   ```

2. **Configure o `.env`:**
   ```bash
   cp .env.example .env
   # Edite e defina SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
   ```

3. **Aplique as migrações do banco:**
   ```bash
   npx prisma migrate deploy
   ```

4. **Execute o seed inicial (cria o admin e SiteConfig):**
   ```bash
   npm run db:seed
   ```

5. **Build de produção:**
   ```bash
   npm run build
   ```

6. **Inicie o servidor:**
   ```bash
   npm start
   ```
   O servidor escuta na porta `3005` (ou `PORT` definido no `.env`).

7. **Proxy HTTPS:** coloque o servidor atrás de NGINX, Caddy ou similar (ver exemplos na seção 5 e motivação na seção 10).

8. **Manter o processo vivo com pm2 (recomendado):**
   ```bash
   npm install -g pm2
   pm2 start npm --name landing -- start
   pm2 save && pm2 startup
   ```

---

## 7. Pós-instalação — primeiros passos no admin

Após acessar `/admin/login` com `ADMIN_EMAIL` / `ADMIN_PASSWORD`:

1. **Integrações:**
   - **URL do backend:** endereço da API DigitalSac (ex.: `https://back01.digitalsac.com.br`). Use o botão **Testar** para confirmar a conexão.
   - **URL do app:** endereço do painel do usuário (ex.: `https://app.digitalsac.com.br`).

2. **Branding:**
   - Upload do logo claro, logo escuro, favicon e imagem OG.
   - Ajuste das cores primária e accent.
   - Configuração da imagem/vídeo hero e textos de destaque.

3. **Segurança:**
   - Escolha o provedor de captcha (`hcaptcha` ou `turnstile`) e cole as chaves de site e segredo.
   - Ajuste os limites de rate limit (padrão: 5 cadastros/hora + 20/dia por IP).
   - Ative o 2FA para o admin na aba **Senha**.

4. **Conteúdo:**
   - Personalize textos de cada seção por idioma (pt-BR, en, es, ru).
   - Gerencie FAQ e demais seções de conteúdo.

5. **Planos:**
   - Defina quais planos aparecem em destaque na landing.
   - Configure colunas e ordenação.

6. **WhatsApp:**
   - Número de contato e lista de assuntos disponíveis para os visitantes.

---

## 8. Atualização

### Docker Swarm

```bash
docker service update --image digitalsac/landing:latest nome_do_stack_landing
```

O entrypoint roda `prisma migrate deploy` automaticamente no boot, aplicando migrações novas sem intervenção manual.

### EasyPanel

Acesse o app no painel da EasyPanel e clique em **Redeploy** (ou ative o webhook de atualização automática).

### Docker Compose (VPS)

```bash
docker compose pull
docker compose up -d
```

As migrações são aplicadas automaticamente pelo entrypoint no startup do novo container.

### Node sem Docker

```bash
git pull
npm install
npx prisma migrate deploy
npm run build
pm2 restart landing
```

---

## 9. Desenvolvimento local e Testes

### Desenvolvimento local

```bash
# Instalar dependências
npm install

# Criar banco e aplicar migrações (modo dev, com hot-reload do schema)
npx prisma migrate dev

# Seed inicial (requer ADMIN_EMAIL e ADMIN_PASSWORD no .env)
npm run db:seed

# Iniciar em modo dev (porta 3005)
npm run dev
```

Acesse `http://localhost:3005`.

### Testes unitários (Vitest)

```bash
npm test
```

### Testes E2E (Playwright)

```bash
npm run e2e
```

O Playwright sobe automaticamente o servidor de desenvolvimento (porta 3005) e o mock backend (porta 4999) — nenhum passo manual necessário. Todos os 6 testes (4 locales + tema + signup) rodam direto.

**Para debug / reset manual (opcional):**

```bash
# Restaurar backendUrl e limpar tentativas
node e2e/teardown.js
```

---

## 10. Segurança embutida

### Proteções ativas

- **Rate limit persistente:** 5 cadastros/hora + 20/dia por IP (SQLite).
- **Honeypot + tempo mínimo de preenchimento:** campo honeypot oculto + 3 s mínimo de preenchimento para bloquear bots.
- **Captcha server-side configurável:** hCaptcha ou Turnstile (chaves configuradas no `/admin`).
- **Bloqueio de domínios de e-mail descartáveis.**
- **Validação server-side de CPF/CNPJ** via dígito verificador.
- **Auditoria de tentativas de cadastro** em `/admin` → aba Segurança.

### Proxy reverso HTTPS obrigatório em produção

Antes de expor a landing em produção, configure um proxy reverso com TLS. Dois motivos críticos:

**(a) Cookie de sessão admin é `secure` em produção.** Quando `NODE_ENV=production`, o cookie de autenticação do painel `/admin` só é enviado pelo navegador em conexões HTTPS. Acessar via `http://` faz o login falhar silenciosamente — o cookie não é gravado e o painel parece nunca autenticar. Essa restrição **não se aplica em localhost** (onde `secure` não é exigido pelo navegador).

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
├── docker-compose.yml
└── docker-stack.yml
```
