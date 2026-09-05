# Envio de e-mail seguro (Task-Flux)

O fluxo preferido é:

1. Preencher o checklist e escolher destinatários  
2. Ao finalizar, o app monta o relatório (texto + HTML)  
3. O **servidor** envia via [Resend](https://resend.com) com a chave de API **privada**

Se `RESEND_API_KEY` **não** estiver configurada (ou for um placeholder inválido), o app **não falha**: ele usa o compartilhamento nativo (com as fotos, quando o aparelho permitir) ou abre o app de e-mail (`mailto:`).

> **Importante:** `mailto:` **não anexa fotos**. Sem `RESEND_API_KEY`, use o compartilhamento do aparelho (ou configure a chave) para o destinatário receber as imagens. O app aceita até **5 fotos** por checklist (comprimidas antes do envio).


## Por que backend?

A chave `RESEND_API_KEY` **nunca** pode ir no app (web/Android). Quem vê o frontend pode roubar a chave e spammar. O token fica só em variável de ambiente do servidor.

## Configuração rápida (envio direto via API)

1. Crie conta em https://resend.com e gere uma API key  
2. Em testes, use o remetente `onboarding@resend.dev` (só envia para o e-mail da sua conta Resend)  
3. No projeto:

```bash
cd checklist-app
cp .env.example .env
# edite RESEND_API_KEY=re_... (chave real, não o placeholder)
npm install
npm run build
npm run start
```

Abra `http://localhost:8787` — o mesmo processo serve o app e `POST /api/send-email`.

Confirme com `GET /api/health` → `"emailConfigured": true`.

### Desenvolvimento (Vite + API)

```bash
# terminal 1
npm run server

# terminal 2
npm run dev
```

O Vite faz proxy de `/api` para a porta `8787`.

## Sem chave Resend

O app continua utilizável: ao finalizar, abre compartilhamento / cliente de e-mail do aparelho. O checklist ainda é salvo no histórico local.

## Produção / loja

1. Compre um domínio barato (ex.: `taskflux.app`)  
2. No Resend, verifique o domínio (DNS)  
3. Defina `RESEND_FROM=Task-Flux <checklist@seudominio.com>`  
4. Publique o servidor (`npm run start`) em um host com HTTPS  
5. No build Android, configure:

```bash
VITE_EMAIL_API_URL=https://api.seudominio.com
```

## Segurança incluída

- Chave só no servidor  
- Placeholder (`re_xxxxxxxx`) é rejeitado  
- Rate limit (30 envios / 15 min por IP)  
- Validação de e-mails e limite de destinatários (10)  
- Limite de tamanho da foto  
- Token opcional `APP_SEND_TOKEN` / header `X-App-Token`  
- HTML escapado no template

## Endpoints

- `GET /api/health` — status e se a chave está configurada  
- `POST /api/send-email` — corpo JSON com `to`, `title`, `items`, `observations`, `photoDataUrl`, etc.
