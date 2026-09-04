# Relato Campo

App web de checklist de veículos com:

- modelo base: farol, pneus, para-brisa e lataria (com opção de incluir outros itens)
- captura de foto (câmera/galeria)
- observações digitadas ou por ditado de voz
- envio do relatório por e-mail
- cadastro de contatos de e-mail para reutilizar em próximos checklists

## Como rodar

```bash
cd checklist-app
npm install
npm run dev
```

Abra o endereço local mostrado no terminal (geralmente `http://localhost:5173`).

## Observações

- Contatos e histórico ficam salvos no `localStorage` do navegador.
- O envio abre o cliente de e-mail do aparelho (`mailto:`) com o texto do checklist.
- O ditado por voz usa a Web Speech API (melhor suporte no Chrome/Edge e em HTTPS ou localhost).
