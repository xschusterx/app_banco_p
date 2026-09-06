# Publicar Task-Flux na Google Play Store

O app web foi empacotado com **Capacitor** e gerado como **Android App Bundle (`.aab`)**.
Para sideload no celular use o **APK** (veja [INSTALL.md](./INSTALL.md)).

## Arquivos gerados

- APK (sideload): `checklist-app/release/task-flux-1.0.1.apk`
- AAB (Play Store): `checklist-app/release/task-flux-1.0.0.aab`
- Também em: `android/app/build/outputs/apk/release/app-release.apk` e `.../bundle/release/app-release.aab`

- Pacote Android: `com.taskflux.app`
- Versão: `1.0.1` (`versionCode` 2)
- Nome do app: **Task-Flux**

## Gerar APK (sideload) ou AAB de novo

```bash
cd checklist-app
npm install
export VITE_EMAIL_API_URL=https://sua-api-publica.exemplo.com
export ANDROID_HOME=$HOME/Android/Sdk
npm run apk:android      # → release/task-flux-1.0.1.apk
# ou
npm run bundle:android   # → release/task-flux-1.0.0.aab
```

## Assinatura (keystore)

O build de release usa:

- `android/keystore/relato-campo-release.jks`
- `android/keystore.properties`

Esses arquivos **não vão para o Git**. Guarde-os em local seguro. Sem o mesmo keystore, a Play Store **não aceita** atualizações futuras.

Credenciais geradas neste ambiente:

| Campo | Valor |
| --- | --- |
| storePassword | `RelatoCampo2026!` |
| keyPassword | `RelatoCampo2026!` |
| keyAlias | `relato-campo` |

## Upload na Play Console

1. Acesse [Google Play Console](https://play.google.com/console)
2. Crie um app (nome: **Task-Flux**)
3. Preencha ficha da loja, classificação de conteúdo, privacidade e público-alvo
4. Em **Produção** (ou teste interno/fechado) → **Criar nova versão**
5. Envie o arquivo `task-flux-1.0.0.aab`
6. Revise e publique

## Observações

- Câmera e microfone pedem permissão no Android (foto e ditado por voz).
- Contatos e histórico ficam no armazenamento local do aparelho.
- Para ícone oficial da loja, substitua os mipmaps em `android/app/src/main/res/`.
- A cada nova publicação, aumente `versionCode` e `versionName` em `android/app/build.gradle`.
