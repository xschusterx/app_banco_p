# Task-Flux

App de checklist de veículos (**web + Android + iOS/Capacitor**) com envio de relatório por e-mail via API.

## Produção

- **Instalador:** https://task-flux-production.up.railway.app/instalar.html
- **APK:** https://task-flux-production.up.railway.app/install.apk
- **Health:** https://task-flux-production.up.railway.app/api/health

Versão atual do APK: **1.0.1** (`versionCode` 2).

## Funcionalidades

- Checklist em branco — adicione e remova itens
- Foto (câmera/galeria) com observação por item
- Observações por texto ou **ditado de voz**
- Contatos individuais e **grupos de e-mail**
- **Assinaturas obrigatórias** do responsável e do conferente
- **Salvar para enviar depois** e concluir o e-mail no histórico
- Envio do relatório por e-mail **pelo servidor** (Resend)
- Histórico local no aparelho (consulta e reenvio)
- Tema claro/escuro
- PWA + instalador web (`/instalar.html`)

## Stack

- React + Vite + TypeScript
- Capacitor (Android / iOS)
- Express + Helmet + rate limit
- Resend (e-mail)
- PWA (`vite-plugin-pwa`)

## Como rodar (local)

```bash
cd checklist-app
cp .env.example .env
# Preencha RESEND_API_KEY=re_...
npm install
npm start
```

Sobe em `http://localhost:8787` o frontend (`dist/`) e a API (`POST /api/send-email`).

### Desenvolvimento (hot reload)

```bash
npm run server   # terminal 1 — API na porta 8787
npm run dev      # terminal 2 — Vite
```

Guia de e-mail: [EMAIL.md](./EMAIL.md)

## Variáveis de ambiente

Copie [`.env.example`](./.env.example). Principais:

| Variável              | Onde          | Descrição                                                 |
| --------------------- | ------------- | --------------------------------------------------------- |
| `RESEND_API_KEY`      | servidor      | Chave Resend (`re_…`)                                     |
| `RESEND_FROM`         | servidor      | Remetente (domínio verificado em produção)                |
| `APP_SEND_TOKEN`      | servidor      | Segredo do header `X-App-Token` (obrigatório em produção) |
| `CORS_ORIGIN`         | servidor      | Origens permitidas (vírgula). `*` é ignorado em produção  |
| `PORT`                | servidor      | Padrão `8787`                                             |
| `VITE_EMAIL_API_URL`  | build web/APK | URL pública HTTPS da API (vazio = mesma origem)           |
| `VITE_APP_SEND_TOKEN` | build web/APK | Mesmo valor de `APP_SEND_TOKEN`                           |

## Instalar no celular

Abra o instalador: `/instalar.html` (detecta Android / iPhone).

Guia completo: [INSTALL.md](./INSTALL.md)

### Android (APK)

```bash
cd checklist-app
export VITE_EMAIL_API_URL=https://task-flux-production.up.railway.app
export VITE_APP_SEND_TOKEN='mesmo-segredo-do-APP_SEND_TOKEN'
npm run apk:android
```

- Saída: `release/task-flux-1.0.1.apk`
- Atalho em produção: `/install.apk`

Para atualizar um APK já instalado via sideload, desinstale a versão antiga ou instale a 1.0.1 por cima (maior `versionCode`).

### Android (Play Store — AAB)

```bash
npm run bundle:android
# → release/task-flux-1.0.1.aab
```

Guia: [PLAY_STORE.md](./PLAY_STORE.md)

### iOS

- **PWA:** Safari → Compartilhar → Adicionar à Tela de Início
- **Nativo:** projeto em `ios/` (precisa Mac + Xcode)

```bash
npm run build:ios
npm run open:ios   # só no macOS
```

Guia: [IOS.md](./IOS.md)

## Deploy

O servidor Node serve API + frontend + instalador + APK.

```bash
npm start
# ou Docker / Railway — ver DEPLOY.md
```

Guia: [DEPLOY.md](./DEPLOY.md)

## Scripts npm

| Script                   | Função                        |
| ------------------------ | ----------------------------- |
| `npm run dev`            | Vite (frontend)               |
| `npm run server`         | API Express                   |
| `npm start`              | Build + API (produção local)  |
| `npm run build`          | Build web                     |
| `npm run apk:android`    | Gera APK de release           |
| `npm run bundle:android` | Gera AAB para Play Store      |
| `npm run build:ios`      | Sync Capacitor iOS            |
| `npm run lint`           | Oxlint                        |
| `npm run format`         | Formata o código com Prettier |
| `npm run format:check`   | Verifica formatação Prettier  |

## Segurança (resumo)

- Chave Resend **só no servidor**
- Headers HTTP com Helmet; token com comparação em tempo constante
- Em produção, CORS wildcard é rejeitado
- Android: backup automático desabilitado

Limitações: o token de envio entra no build do app (pode ser extraído); dados ficam em `localStorage` sem criptografia; `/install.apk` é público. Detalhes em [DEPLOY.md](./DEPLOY.md).

## Estrutura

```
checklist-app/
├── src/           # React (páginas, assinaturas, contatos, histórico)
├── server/        # Express + template de e-mail
├── android/       # Capacitor Android
├── ios/           # Capacitor iOS
├── public/        # instalar.html, ícones, manifest
├── release/       # artefatos APK/AAB/zip
└── dist/          # build web (gerado)
```
