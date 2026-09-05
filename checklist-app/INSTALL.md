# Instalar Task-Flux no celular

## Instalador facial (use este link)

- **Instalador:** https://quote-performances-recommendation-uses.trycloudflare.com/instalar.html
- **APK direto:** https://quote-performances-recommendation-uses.trycloudflare.com/downloads/task-flux-1.0.0.apk
- Atalhos: `/instalar` e `/downloads` redirecionam para o instalador
- Local: http://localhost:8787/instalar.html

> Se o link público cair (túneis temporários mudam), peça um link atualizado ou use a API/host atual + `/instalar.html`.

## Android

1. Abra o instalador no celular
2. Toque em **Instalar APK agora**
3. Permita instalar de fontes desconhecidas / deste navegador
4. Confirme **Instalar** (`com.taskflux.app`)

Arquivo local: `release/task-flux-1.0.0.apk`

```bash
cd checklist-app
export VITE_EMAIL_API_URL=https://sua-api-publica.exemplo.com
export ANDROID_HOME=$HOME/Android/Sdk
npm run apk:android
```

## iPhone

1. Abra o instalador no **Safari**
2. **Abrir o app** → Compartilhar → **Adicionar à Tela de Início**

App nativo (Mac/Xcode): `release/task-flux-ios-xcode-1.0.0.zip` — veja [IOS.md](./IOS.md)
