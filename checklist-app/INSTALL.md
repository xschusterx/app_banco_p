# Instalar Task-Flux no celular

## Instalador facial

Página visual que detecta Android/iPhone e guia a instalação:

- Local: http://localhost:8787/instalar.html (ou `/instalar`)
- Em produção/túnel: `https://SEU-DOMINIO/instalar.html`

`/downloads` redireciona para o instalador. Os arquivos ficam em:

- `/downloads/task-flux-1.0.0.apk`
- `/downloads/task-flux-ios-xcode-1.0.0.zip`

## Android — APK (sideload)

Arquivos:

- `checklist-app/release/task-flux-1.0.0.apk`

1. Abra o instalador no celular **ou** baixe o `.apk`
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

1. Abra o instalador no **Safari**
2. Toque em **Abrir o app**
3. **Compartilhar → Adicionar à Tela de Início**
4. Confirme **Task-Flux**

### Projeto nativo Xcode (gerar `.ipa` no Mac)

- Pasta: `checklist-app/ios/`
- Zip: `checklist-app/release/task-flux-ios-xcode-1.0.0.zip`

Guia completo: [IOS.md](./IOS.md)

> Este ambiente Linux **não gera `.ipa`**. O `.ipa` só sai do Xcode no macOS (TestFlight / Ad Hoc / App Store).
