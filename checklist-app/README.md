# Relato Campo

App de checklist de veículos (web + Android) com:

- modelo base: farol, pneus, para-brisa e lataria (incluir/remover itens)
- captura de foto (câmera/galeria)
- observações digitadas ou por ditado de voz
- envio do relatório por e-mail
- cadastro de contatos de e-mail para reutilizar
- tema claro/escuro

## Como rodar (web)

```bash
cd checklist-app
npm install
npm run dev
```

## Android App Bundle (Play Store)

```bash
cd checklist-app
npm install
npm run bundle:android
```

O arquivo `.aab` fica em:

`android/app/build/outputs/bundle/release/app-release.aab`

Cópia pronta: `release/relato-campo-1.0.0.aab`

Guia completo: [PLAY_STORE.md](./PLAY_STORE.md)

## Observações

- Contatos e histórico ficam salvos no aparelho (`localStorage` / WebView).
- O envio abre o cliente de e-mail (`mailto:` / compartilhamento nativo).
- O ditado por voz usa a Web Speech API (melhor no Chrome).
