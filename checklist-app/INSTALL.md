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

Arquivo local: `release/task-flux-1.0.1.apk`

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

## Atualizar o app já instalado

O Android **não atualiza sozinho** o sideload. Para pegar a versão nova:

1. Abra https://task-flux-production.up.railway.app/instalar.html
2. Toque em **Instalar o app agora** (APK 1.0.1)
3. Se o sistema bloquear por “já instalado”, desinstale o Task-Flux antigo e instale de novo
4. Ou use: Configurações → Apps → Task-Flux → Desinstalar, depois baixe `/install.apk`
