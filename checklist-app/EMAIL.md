# Envio automático de e-mail (Task-Flux)

O app **envia pelo servidor** (Resend). O usuário **não precisa abrir o e-mail do celular**.
As fotos entram no **corpo do relatório** (layout HTML) e também como **anexos**.

## Por que precisa da chave?

Sem `RESEND_API_KEY`, o servidor não consegue mandar e-mail sozinho.
A chave fica **só no servidor** — nunca no app (web/Android).

## Configuração (obrigatória para envio real)

1. Crie conta em https://resend.com e gere uma API key (`re_...`)
2. Em testes, o remetente `Task-Flux <onboarding@resend.dev>` só entrega no e-mail da sua conta Resend
3. Em produção, verifique um domínio e use `RESEND_FROM=Task-Flux <checklist@seudominio.com>`

```bash
cd checklist-app
cp .env.example .env
# edite:
# RESEND_API_KEY=re_sua_chave_real
# RESEND_FROM=Task-Flux <onboarding@resend.dev>
npm install
npm run build
npm run start
```

Confirme: `GET /api/health` → `"emailConfigured": true`.

## O que o destinatário recebe

- Cabeçalho Task-Flux com título do checklist
- Cards de data, veículo/placa, itens ok e quantidade de fotos
- Lista de itens com status
- Observações
- Galeria das fotos no corpo do e-mail + arquivos anexados

## Limites

- Até **20 fotos** por checklist (comprimidas no aparelho)
- Até **10 destinatários** por envio
