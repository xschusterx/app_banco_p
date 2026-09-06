# Task-Flux

Checklist de veículos com foto, observação (texto/voz), assinaturas e envio automático por e-mail.

O código do app fica em [`checklist-app/`](./checklist-app/).

## Produção

| Recurso          | URL                                                       |
| ---------------- | --------------------------------------------------------- |
| App / instalador | https://task-flux-production.up.railway.app/instalar.html |
| APK Android      | https://task-flux-production.up.railway.app/install.apk   |
| Health da API    | https://task-flux-production.up.railway.app/api/health    |

## O que o app faz

- Checklist em branco (adicione e remova itens)
- Fotos pela câmera ou galeria, com observação
- Ditado por voz (Web Speech API)
- Contatos e grupos de e-mail
- Assinaturas obrigatórias do responsável e do conferente
- Opção de **salvar para enviar o e-mail depois** (histórico)
- Envio do relatório por e-mail via API (Resend), sem login na caixa do usuário
- Histórico local no aparelho
- Tema claro/escuro
- Web, Android (APK) e projeto iOS (Capacitor)

## Início rápido

```bash
cd checklist-app
cp .env.example .env
# Defina RESEND_API_KEY=re_... no .env
npm install
npm start
```

Abra `http://localhost:8787`.

Desenvolvimento com hot reload:

```bash
npm run server   # API + estáticos na porta 8787
npm run dev      # Vite (outro terminal)
```

## Estrutura do repositório

```
.
├── README.md           # este arquivo
├── app_banco/          # material legado (não é o app Task-Flux)
└── checklist-app/      # app Task-Flux (web + API + Android/iOS)
    ├── src/            # frontend React
    ├── server/         # API Express + Resend
    ├── android/        # projeto Capacitor Android
    ├── ios/            # projeto Capacitor iOS
    ├── public/         # PWA, ícones, instalar.html
    ├── release/        # APK / AAB / zip iOS gerados
    ├── INSTALL.md      # instalar no celular
    ├── DEPLOY.md       # deploy (Railway, Docker, etc.)
    ├── EMAIL.md        # envio de e-mail
    ├── PLAY_STORE.md   # Google Play
    └── IOS.md          # iOS / Xcode
```

## Documentação

| Guia                                                         | Conteúdo                         |
| ------------------------------------------------------------ | -------------------------------- |
| [checklist-app/README.md](./checklist-app/README.md)         | Visão geral do app               |
| [checklist-app/INSTALL.md](./checklist-app/INSTALL.md)       | Instalar / atualizar no celular  |
| [checklist-app/DEPLOY.md](./checklist-app/DEPLOY.md)         | Produção e variáveis de ambiente |
| [checklist-app/EMAIL.md](./checklist-app/EMAIL.md)           | Configuração Resend              |
| [checklist-app/PLAY_STORE.md](./checklist-app/PLAY_STORE.md) | Publicar na Play Store           |
| [checklist-app/IOS.md](./checklist-app/IOS.md)               | Build iOS                        |

## Licença

Uso privado / interno do projeto.
