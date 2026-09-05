# Instalar Task-Flux no celular

## Host fixo (produção)

- **App / instalador:** https://task-flux-production.up.railway.app/instalar.html
- **APK direto:** https://task-flux-production.up.railway.app/install.apk
- **API health:** https://task-flux-production.up.railway.app/api/health
- Atalhos: `/instalar` e `/downloads` → instalador
- Local: http://localhost:8787/instalar.html

> URL estável no Railway (`*.up.railway.app`). Detalhes em [DEPLOY.md](./DEPLOY.md).

## Android

1. Abra o instalador no celular
2. Toque em **Instalar APK agora**
3. Permita instalar de fontes desconhecidas / deste navegador
4. Confirme **Instalar** (`com.taskflux.app`)

Arquivo local: `release/task-flux-1.0.0.apk`

```bash
cd checklist-app
export VITE_EMAIL_API_URL=https://task-flux-production.up.railway.app
export VITE_APP_SEND_TOKEN='mesmo-segredo-do-APP_SEND_TOKEN'
export ANDROID_HOME=$HOME/Android/Sdk
npm run apk:android
```

## iPhone

1. Abra o instalador no **Safari**
2. **Abrir o app** → Compartilhar → **Adicionar à Tela de Início**

App nativo (Mac/Xcode): `release/task-flux-ios-xcode-1.0.0.zip` — veja [IOS.md](./IOS.md)

## Deploy estável

Veja [DEPLOY.md](./DEPLOY.md) (Docker / Railway / Render / Fly / VPS + DNS Resend).
