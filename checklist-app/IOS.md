# Task-Flux no iOS

Este ambiente Linux **não consegue gerar um `.ipa` instalável** — isso exige **macOS + Xcode** (e conta Apple Developer para instalar fora da App Store / TestFlight).

O que já está pronto neste repositório:

1. Projeto nativo Capacitor em `checklist-app/ios/`
2. App web instalável no iPhone via Safari (**Adicionar à Tela de Início**) — imediato, sem Mac

## Opção A — Instalar agora no iPhone (PWA)

1. Abra a URL pública do app no **Safari** (não use Chrome no iOS para “Adicionar à Tela de Início”).
2. Toque em **Compartilhar** → **Adicionar à Tela de Início**.
3. Confirme o nome **Task-Flux**.

O ícone abre em tela cheia (standalone). O envio de e-mail usa a API HTTPS configurada no servidor.

## Opção B — App nativo (`.ipa` / App Store / TestFlight)

No Mac:

```bash
cd checklist-app
cp .env.example .env
# Defina VITE_EMAIL_API_URL=https://sua-api-publica.exemplo.com
npm install
npm run build:ios
npx cap open ios
```

No Xcode:

1. Selecione o target **App** → Signing & Capabilities → seu Team Apple
2. Bundle ID: `com.taskflux.app` (ou altere se já estiver em uso)
3. **Product → Archive**
4. Distribua via **TestFlight** (recomendado) ou Ad Hoc / Enterprise

Scripts:

| Script              | O que faz                           |
| ------------------- | ----------------------------------- |
| `npm run build:ios` | Build web + `cap sync ios`          |
| `npm run open:ios`  | Abre o projeto no Xcode (só no Mac) |

## Permissões iOS

Já declaradas em `ios/App/App/Info.plist`:

- Câmera (fotos do checklist)
- Microfone (ditado por voz)
- Galeria de fotos

## Observações

- Sem Mac neste ambiente, o artefato iOS entregue é o **projeto Xcode** + caminho **PWA**.
- Para produção, use domínio Resend verificado e URL HTTPS estável em `VITE_EMAIL_API_URL`.
