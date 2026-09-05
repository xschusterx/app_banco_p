# Publicar Relato Campo na Google Play Store

O app web foi empacotado com **Capacitor** e gerado como **Android App Bundle (`.aab`)**.

## Arquivo gerado

- `checklist-app/release/relato-campo-1.0.0.aab`
- Também em: `android/app/build/outputs/bundle/release/app-release.aab`

- Pacote Android: `com.relatocampo.app`
- Versão: `1.0.0` (`versionCode` 1)

## Gerar o AAB de novo

```bash
cd checklist-app
npm install
npm run bundle:android
```

O AAB sai em:

`android/app/build/outputs/bundle/release/app-release.aab`

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
2. Crie um app (nome: **Relato Campo**)
3. Preencha ficha da loja, classificação de conteúdo, privacidade e público-alvo
4. Em **Produção** (ou teste interno/fechado) → **Criar nova versão**
5. Envie o arquivo `relato-campo-1.0.0.aab`
6. Revise e publique

## Observações

- Câmera e microfone pedem permissão no Android (foto e ditado por voz).
- Contatos e histórico ficam no armazenamento local do aparelho.
- Para ícone oficial da loja, substitua os mipmaps em `android/app/src/main/res/`.
- A cada nova publicação, aumente `versionCode` e `versionName` em `android/app/build.gradle`.
