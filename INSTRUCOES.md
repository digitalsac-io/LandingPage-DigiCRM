# Deploy da Landing no aaPanel — arquivos e correções

Três defeitos foram corrigidos:

1. **Container reiniciando** — `Error: The datasource.url property is required` →
   a imagem não incluía o `prisma.config.ts` (onde fica a URL do banco).
2. **`Please manually install OpenSSL`** — `node:22-slim` não traz OpenSSL, que o Prisma precisa.
3. **Logo não aparecia (imagem quebrada)** — o upload salvava o arquivo e retornava
   `/uploads/<arquivo>`, mas nenhuma rota servia esse caminho (ficava fora de `public/`).

---

## ✅ Caminho RÁPIDO — resolve tudo AGORA, sem rebuild  ← recomendado

Use o **`compose.hotfix.yaml`**. Ele roda a imagem pública atual e contorna os 3 problemas:
- recria o `prisma.config.ts` no boot (resolve o loop de restart);
- grava os uploads em `public/uploads`, que o Next já serve (resolve o logo).
  Como usa a MESMA pasta do host (`${APP_PATH}/uploads`), **o logo que você já subiu
  volta a aparecer sem reenviar**.

Passos no aaPanel:
1. **Docker → Compose** → abra o seu Compose `landing` (ou crie um novo).
2. Cole o conteúdo de `compose.hotfix.yaml` no campo **compose.yaml**.
3. Mantenha/cole o seu `.env` (veja o arquivo `.env` deste pacote).
4. **Salvar** e deixar recriar o container. Pronto — sobe e o logo aparece.

> Observação: o OpenSSL continua aparecendo só como *warning* (não trava nada). Ele
> some de vez quando você passar para a imagem reconstruída (Caminho B).

---

## Caminho A — build local já com todos os fixes (imagem própria)

Quando quiser uma imagem sua, definitiva, sem esperar o Docker Hub:
1. Tenha o código-fonte em `landing-src` e aplique o patch:
   `cd landing-src && git am < ../aapanel-deploy-fix.patch`
   (ou substitua manualmente o `Dockerfile` e adicione `src/app/uploads/[...path]/route.ts`).
2. Use `compose.build.yaml` (renomeie para `compose.yaml`) + `.env`.
3. `docker compose up -d --build` (ou cole no aaPanel).
   Com o route handler incluído, o `UPLOAD_DIR` pode ser `/app/uploads` (padrão do README).

## Caminho B — imagem pública oficial (depois que o fix subir)

1. Aplique o patch (`git am < aapanel-deploy-fix.patch`) e faça push/merge em `main`
   → a CI reconstrói e publica `digitalsac/landing:latest` já corrigida.
2. No aaPanel, use `compose.yaml` (image-based) + `.env`.
3. Para atualizar: aba do Compose → **Atualizar Imagem** → **Reiniciar**.

---

## Arquivos do pacote

| Arquivo                    | Para quê                                                         |
|----------------------------|------------------------------------------------------------------|
| `compose.hotfix.yaml`      | **Recomendado agora**: roda a imagem atual e corrige crash + logo. |
| `.env`                     | Variáveis para o campo `.env` do Compose.                        |
| `Dockerfile`               | Dockerfile corrigido (prisma.config.ts + OpenSSL).              |
| `src-uploads-route/route.ts` | A nova rota `/uploads/[...path]` (colocar em `src/app/uploads/[...path]/route.ts`). |
| `aapanel-deploy-fix.patch` | Os 3 commits (docs aaPanel + fix Docker + fix uploads).         |
| `compose.build.yaml`       | Compose que builda a imagem local já com os fixes.             |
| `compose.yaml`             | Compose com a imagem pública (após o fix ir para o Docker Hub). |

---

## HTTPS é obrigatório

O login do admin usa cookie `secure`. Depois de subir:
1. **Site → Adicionar site** com o seu domínio.
2. No site → **Proxy reverso** → destino `http://127.0.0.1:3005` (valor de `WEB_PORT`).
3. Aba **SSL** → **Let's Encrypt** + **Forçar HTTPS**.
4. Acesse `https://seudominio.com.br/admin/login`.
