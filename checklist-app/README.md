# Task-Flux

App de checklist de veículos (web + Android + iOS/Capacitor) com:

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

## Instalar no celular

Abra o **instalador facial** (detecta Android/iPhone): `/instalar.html`

Guia: [INSTALL.md](./INSTALL.md)

### Android (APK / Play Store)

```bash
cd checklist-app
export VITE_EMAIL_API_URL=https://sua-api-publica.exemplo.com
npm run apk:android      # sideload .apk
# ou
npm run bundle:android   # Play Store .aab
```

- APK: `release/task-flux-1.0.1.apk`
- AAB: `release/task-flux-1.0.0.aab`

Guia Play Store: [PLAY_STORE.md](./PLAY_STORE.md)

### iOS (PWA agora / nativo no Mac)

- **Agora no iPhone:** abra a URL no Safari → Compartilhar → Adicionar à Tela de Início
- **App nativo:** projeto em `ios/` — precisa de Mac + Xcode para gerar `.ipa`

```bash
npm run build:ios
npm run open:ios   # só no macOS
```

Guia completo: [IOS.md](./IOS.md)

## Observações

- Contatos e histórico ficam salvos no aparelho (`localStorage` / WebView).
- A chave Resend fica **somente no servidor** — nunca no app.
- Sem `RESEND_API_KEY`, o envio automático fica indisponível.
- Em produção, use domínio próprio verificado no Resend para evitar spam.
- O ditado por voz usa a Web Speech API (melhor no Chrome / WebView).
- No Capacitor (Android/iOS), aponte `VITE_EMAIL_API_URL` para a URL pública HTTPS da API antes do build.
