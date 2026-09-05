# Task-Flux

App de checklist de veículos (web + Android) com:

- checklist em branco (adicione/remova itens)
- captura de foto (câmera/galeria)
- observações digitadas ou por ditado de voz
- envio do relatório por e-mail **via API** (sem login na caixa do usuário)
- contatos individuais e grupos de e-mail
- tema claro/escuro

## Como rodar (web + API de e-mail)

```bash
cd checklist-app
cp .env.example .env
# coloque RESEND_API_KEY=re_... no .env
npm install
npm run start
```

Isso sobe em `http://localhost:8787` o app e o endpoint `POST /api/send-email`.

Guia completo do envio seguro: [EMAIL.md](./EMAIL.md)

### Só frontend (com proxy para a API)

```bash
npm run server   # terminal 1 — API na porta 8787
npm run dev      # terminal 2 — Vite
```

## Android App Bundle (Play Store)

```bash
cd checklist-app
npm install
npm run bundle:android
```

O arquivo `.aab` fica em:

`android/app/build/outputs/bundle/release/app-release.aab`

Cópia pronta: `release/task-flux-1.0.0.aab`

Guia completo: [PLAY_STORE.md](./PLAY_STORE.md)

No Android, aponte `VITE_EMAIL_API_URL` para a URL pública HTTPS da API antes do build.

## Observações

- Contatos e histórico ficam salvos no aparelho (`localStorage` / WebView).
- A chave Resend fica **somente no servidor** — nunca no app.
- Em produção, use domínio próprio verificado no Resend para evitar spam.
- O ditado por voz usa a Web Speech API (melhor no Chrome).
