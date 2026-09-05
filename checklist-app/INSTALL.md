# Instalar Task-Flux no celular

## Instalador facial

Página visual que detecta Android/iPhone e guia a instalação:

- **Agora (túnel):** https://1c45ec05d7f539.lhr.life/instalar.html
- Atalhos: `/instalar` e `/downloads` → redirecionam para o instalador
- Local: http://localhost:8787/instalar.html

Arquivos:

- APK: https://1c45ec05d7f539.lhr.life/downloads/task-flux-1.0.0.apk
- Xcode zip: https://1c45ec05d7f539.lhr.life/downloads/task-flux-ios-xcode-1.0.0.zip

> O domínio do túnel muda quando reinicia. Se o link cair, use `/instalar.html` no host atual da API.

## Android — APK (sideload)

Arquivo local: `checklist-app/release/task-flux-1.0.0.apk`

1. Abra o instalador no celular **ou** baixe o `.apk`
2. Em **Configurações → Segurança**, permita instalar de fontes desconhecidas / do navegador
3. Abra o arquivo e confirme

Gerar de novo:

```bash
cd checklist-app
export VITE_EMAIL_API_URL=https://sua-api-publica.exemplo.com
export ANDROID_HOME=$HOME/Android/Sdk
npm run apk:android
```

Play Store (`.aab`): [PLAY_STORE.md](./PLAY_STORE.md)

## iPhone

### Instalação imediata (PWA)

1. Abra o instalador no **Safari**
2. Toque em **Abrir o app**
3. **Compartilhar → Adicionar à Tela de Início**

### App nativo (Mac + Xcode)

- Pasta: `checklist-app/ios/`
- Zip: `release/task-flux-ios-xcode-1.0.0.zip`
- Guia: [IOS.md](./IOS.md)

> Linux não gera `.ipa` — só o Xcode no macOS.
