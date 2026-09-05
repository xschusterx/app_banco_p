# Instalar Task-Flux no celular

URL pública atual (túnel de teste — pode mudar):

- App / PWA: https://2696776d5b431e.lhr.life/
- Downloads: https://2696776d5b431e.lhr.life/downloads/

## Android — APK (sideload)

Arquivos:

- `checklist-app/release/task-flux-1.0.0.apk`
- Download: https://2696776d5b431e.lhr.life/downloads/task-flux-1.0.0.apk

1. Baixe o `.apk` no aparelho
2. Em **Configurações → Segurança**, permita instalar apps de fontes desconhecidas / do navegador
3. Abra o arquivo e confirme a instalação

Gerar de novo:

```bash
cd checklist-app
export VITE_EMAIL_API_URL=https://sua-api-publica.exemplo.com
export ANDROID_HOME=$HOME/Android/Sdk
npm run apk:android
```

Também existe o `.aab` para Play Store: `release/task-flux-1.0.0.aab` (veja [PLAY_STORE.md](./PLAY_STORE.md)).

## iPhone

### Instalação imediata (PWA) — recomendado sem Mac

1. Abra https://2696776d5b431e.lhr.life/ no **Safari**
2. **Compartilhar → Adicionar à Tela de Início**
3. Confirme **Task-Flux**

### Projeto nativo Xcode (gerar `.ipa` no Mac)

- Pasta: `checklist-app/ios/`
- Zip: `checklist-app/release/task-flux-ios-xcode-1.0.0.zip`
- Download: https://2696776d5b431e.lhr.life/downloads/task-flux-ios-xcode-1.0.0.zip

Guia completo: [IOS.md](./IOS.md)

> Este ambiente Linux **não gera `.ipa`**. O `.ipa` só sai do Xcode no macOS (TestFlight / Ad Hoc / App Store).
