# Instalar Task-Flux no celular

## Instalador facial (use este link)

- **Instalador:** https://quote-performances-recommendation-uses.trycloudflare.com/instalar.html
- **APK direto:** https://quote-performances-recommendation-uses.trycloudflare.com/install.apk
- Atalhos: `/instalar` e `/downloads` redirecionam para o instalador
- Local: http://localhost:8787/instalar.html

> Túnel Cloudflare Quick Tunnel (demo). Se o link cair, reinicie `cloudflared` e atualize esta página — para produção veja [DEPLOY.md](./DEPLOY.md).

## Android

1. Abra o instalador no celular
2. Toque em **Instalar APK agora**
3. Permita instalar de fontes desconhecidas / deste navegador
4. Confirme **Instalar** (`com.taskflux.app`)

Arquivo local: `release/task-flux-1.0.0.apk`

```bash
cd checklist-app
export VITE_EMAIL_API_URL=https://sua-api-publica.exemplo.com
# Se APP_SEND_TOKEN estiver ativo no servidor:
# export VITE_APP_SEND_TOKEN=mesmo-segredo
export ANDROID_HOME=$HOME/Android/Sdk
npm run apk:android
```

## iPhone

1. Abra o instalador no **Safari**
2. **Abrir o app** → Compartilhar → **Adicionar à Tela de Início**

App nativo (Mac/Xcode): `release/task-flux-ios-xcode-1.0.0.zip` — veja [IOS.md](./IOS.md)

## Deploy estável

Veja [DEPLOY.md](./DEPLOY.md) (Docker / Railway / Render / Fly / VPS + DNS Resend).
