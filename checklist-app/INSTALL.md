# Instalar Task-Flux no celular

## Android — APK (sideload)

Arquivo: `checklist-app/release/task-flux-1.0.0.apk`

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

## iPhone — instalação imediata (PWA)

Não há `.ipa` gerado neste Linux (precisa de Mac/Xcode). No iPhone:

1. Abra o app no **Safari** pela URL pública
2. **Compartilhar → Adicionar à Tela de Início**

Projeto nativo e guia do `.ipa`: [IOS.md](./IOS.md).
