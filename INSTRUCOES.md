# Deploy da Landing no aaPanel — arquivos e correção

Este pacote contém tudo para subir a landing no aaPanel e o **fix** dos dois erros que
derrubavam o container:

1. `Error: The datasource.url property is required in your Prisma config file`
   → o `Dockerfile` não copiava o `prisma.config.ts` (onde fica a URL do banco) para a
     imagem final. **Corrigido** no `Dockerfile` deste pacote.
2. `Please manually install OpenSSL...`
   → `node:22-slim` não traz OpenSSL, que o Prisma precisa. **Corrigido** (instala openssl).

---

## Arquivos

| Arquivo                    | Para que serve                                                        |
|----------------------------|-----------------------------------------------------------------------|
| `Dockerfile`               | Dockerfile **corrigido** (substitui o do repositório).                |
| `aapanel-deploy-fix.patch` | Os 2 commits (docs aaPanel no README + fix do Docker) para aplicar no repo com `git am`. |
| `compose.yaml`             | Compose para o aaPanel usando a **imagem pública** (após o fix ir para o Docker Hub). |
| `compose.build.yaml`       | Compose que **builda a imagem localmente** já com o fix (funciona AGORA). |
| `.env`                     | Variáveis para o campo `.env` do Compose no aaPanel.                  |

---

## Caminho A — Subir funcionando AGORA (build local, sem Docker Hub)

Use quando você quer a landing no ar imediatamente, sem esperar a imagem pública ser
reconstruída.

1. No servidor, coloque o código-fonte da landing numa pasta `landing-src` ao lado do
   compose e **substitua** o `Dockerfile` de lá pelo `Dockerfile` deste pacote.
   (Ou aplique o patch: `cd landing-src && git am < ../aapanel-deploy-fix.patch`)
2. Copie `compose.build.yaml` (renomeie para `compose.yaml`) e o `.env` para a mesma pasta.
3. Edite o `.env`: gere `SESSION_SECRET` com `openssl rand -hex 32` e defina `ADMIN_*` e `APP_PATH`.
4. No aaPanel: **Docker → Compose → Adicionar Compose**, cole os dois arquivos, Salvar.
   (Ou via terminal: `docker compose up -d --build`.)

## Caminho B — Usar a imagem pública (depois que o fix subir)

O `Dockerfile` corrigido só vira imagem nova quando o workflow de CI publicar
`digitalsac/landing:latest` no Docker Hub (dispara no push para `main`).

1. Aplique o patch no repositório (`git am < aapanel-deploy-fix.patch`) e faça push /
   merge em `main` → a CI reconstrói e publica `latest`.
2. No aaPanel, use o `compose.yaml` (image-based) + `.env`.
3. Para atualizar depois: aba do Compose → **Atualizar Imagem** → **Reiniciar**.

---

## HTTPS é obrigatório

O login do admin usa cookie `secure`. Depois de subir o container:

1. **Site → Adicionar site** com o seu domínio.
2. No site → **Proxy reverso** → destino `http://127.0.0.1:3005` (valor de `WEB_PORT`).
3. Aba **SSL** → **Let's Encrypt** + **Forçar HTTPS**.
4. Acesse `https://seudominio.com.br/admin/login`.
