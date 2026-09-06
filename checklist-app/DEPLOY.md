# Deploy Task-Flux em produção

O servidor Node (`server/index.mjs`) serve a API **e** o frontend (`dist/`), além de `/instalar.html` e `/install.apk`.

## Host fixo atual

- **URL:** https://task-flux-production.up.railway.app
- **Instalador:** https://task-flux-production.up.railway.app/instalar.html
- **APK:** https://task-flux-production.up.railway.app/install.apk
- **Health:** https://task-flux-production.up.railway.app/api/health

Projeto Railway: `task-flux` (serviço `task-flux`, ambiente `production`).

## O que você precisa fazer (fora do repositório)

Estas etapas **não dá para fechar só no código**:

1. **Hospedagem estável** — já publicada no Railway (URL acima). Alternativas: Render, Fly.io ou VPS com Docker.

2. **Domínio + DNS na Resend** — para enviar e-mail para qualquer destinatário (não só a conta de teste):
   - Crie domínio em https://resend.com/domains
   - Adicione os registros DNS que a Resend mostrar (SPF/DKIM)
   - Defina `RESEND_FROM=Task-Flux <checklist@seudominio.com>`
3. **Google Play / App Store** — veja `PLAY_STORE.md` e `IOS.md` (assinatura, contas de desenvolvedor).

Sem domínio verificado, o remetente `onboarding@resend.dev` só entrega no e-mail da **sua** conta Resend.

## Segurança (já aplicado no código)

- Headers HTTP via `helmet` (CSP, HSTS em produção, `X-Content-Type-Options`, `Referrer-Policy`, etc.)
- `APP_SEND_TOKEN` comparado com `crypto.timingSafeEqual`
- Em produção, `CORS_ORIGIN=*` é **ignorado** (não abre wildcard)
- Android: `android:allowBackup="false"` (evita backup automático de contatos/histórico/fotos)

### Limitações que ainda existem

- `VITE_APP_SEND_TOKEN` entra no APK/web build e **pode ser extraído** — trate como segredo compartilhado da equipe, não como autenticação forte
- Dados do app ficam em `localStorage` **sem criptografia** no aparelho
- O APK em `/install.apk` é público (qualquer um com o link baixa)
- Sem login por usuário — quem tiver o token pode disparar e-mail pela sua conta Resend

Rotacione `APP_SEND_TOKEN` se o APK vazar e rebuild o app. Para dados sensíveis, o próximo passo é autenticação por usuário.

## Variáveis de ambiente (obrigatórias em produção)

| Variável              | Obrigatória                      | Descrição                                          |
| --------------------- | -------------------------------- | -------------------------------------------------- |
| `RESEND_API_KEY`      | sim                              | Chave `re_…` da Resend                             |
| `RESEND_FROM`         | sim\*                            | Remetente com domínio verificado                   |
| `APP_SEND_TOKEN`      | **sim** se `NODE_ENV=production` | Segredo no header `X-App-Token`                    |
| `CORS_ORIGIN`         | recomendado                      | Origens permitidas, separadas por vírgula          |
| `PORT`                | não                              | Padrão `8787`                                      |
| `NODE_ENV`            | sim                              | `production`                                       |
| `VITE_EMAIL_API_URL`  | no build web/APK                 | URL pública HTTPS da API (ou vazio = mesma origem) |
| `VITE_APP_SEND_TOKEN` | no build se token ativo          | Mesmo valor de `APP_SEND_TOKEN`                    |

\* Em testes locais pode usar `Task-Flux <onboarding@resend.dev>`.

Copie o modelo:

```bash
cp .env.example .env
```

## Opção A — Docker (VPS / qualquer host)

```bash
cd checklist-app
cp .env.example .env   # edite as chaves
docker compose up --build -d
# ou:
docker build -t task-flux .
docker run --env-file .env -p 8787:8787 task-flux
```

Health: `GET https://seu-host/api/health` → `"emailConfigured": true`.

Instalador: `https://seu-host/instalar.html` · APK: `https://seu-host/install.apk`

## Opção B — Railway (recomendado: host HTTPS fixo)

Arquivos prontos nesta pasta: `railway.toml` + `Dockerfile`.

### CLI (rápido)

```bash
cd checklist-app
railway login          # ou: railway login --browserless
railway init           # cria projeto Task-Flux
railway up             # sobe o container
railway domain         # gera https://….up.railway.app (URL fixa)
```

Variáveis (dashboard ou `railway variables set`):

```bash
railway variables set NODE_ENV=production
railway variables set RESEND_API_KEY=re_…
railway variables set RESEND_FROM='Task-Flux <onboarding@resend.dev>'
railway variables set APP_SEND_TOKEN='segredo-longo'
# Depois de ter a URL pública:
railway variables set CORS_ORIGIN=https://seu-app.up.railway.app
```

### Dashboard GitHub

1. New Project → Deploy from GitHub → **Root Directory** = `checklist-app`.
2. Mesmas variáveis acima; health check `/api/health`.
3. Gere domínio Railway (`*.up.railway.app`) ou ligue o seu domínio.

Para o APK Android apontar para a API Railway, rebuild com:

```bash
export VITE_EMAIL_API_URL=https://seu-app.up.railway.app
export VITE_APP_SEND_TOKEN=mesmo-segredo
npm run apk:android
```

> Em produção no mesmo host web, deixe `VITE_EMAIL_API_URL` vazio no build Docker (mesma origem `/api`).

## Opção C — Render

Arquivo pronto: `render.yaml` (Blueprint). No dashboard: **Blueprints** → conecte o repo → pasta `checklist-app`.

Ou manualmente:

1. New **Web Service** → repo → Root Directory `checklist-app`.
2. Runtime: Docker **ou** Native:
   - Build: `npm ci && npm run build`
   - Start: `node server/index.mjs`
3. Mesmas env vars da tabela.
4. Health check path: `/api/health`.
5. URL fixa: `https://….onrender.com` (plano free pode “dormir” após inatividade).

## Opção D — Fly.io

```bash
cd checklist-app
fly launch --dockerfile Dockerfile --name task-flux
fly secrets set RESEND_API_KEY=re_… RESEND_FROM='Task-Flux <checklist@seudominio.com>' APP_SEND_TOKEN=… CORS_ORIGIN=https://seu-app.fly.dev NODE_ENV=production
fly deploy
```

## Opção E — Node direto (VPS)

```bash
cd checklist-app
npm ci
npm run build
NODE_ENV=production PORT=8787 node server/index.mjs
# ou: npm run start   (rebuild + server)
```

Coloque Nginx/Caddy na frente com HTTPS.

## Checklist pós-deploy

- [ ] `GET /api/health` → `ok: true`, `emailConfigured: true`, `tokenRequired: true`
- [ ] `POST /api/send-email` sem `X-App-Token` → `401` (em produção)
- [ ] CORS bloqueia origens fora de `CORS_ORIGIN`
- [ ] Abrir `/instalar.html` e baixar `/install.apk`
- [ ] Domínio Resend verificado + `RESEND_FROM` atualizado
- [ ] Rebuild do APK com `VITE_EMAIL_API_URL` = URL pública HTTPS

## Túnel temporário (só desenvolvimento / demo)

Neste ambiente de agente usamos Cloudflare Quick Tunnel (`*.trycloudflare.com`). Ele **muda** quando reinicia — não é produção. Para celular de teste:

1. `npm run server` na porta 8787
2. `cloudflared tunnel --url http://127.0.0.1:8787`
3. Atualize `INSTALL.md` / rebuild APK com a URL nova
