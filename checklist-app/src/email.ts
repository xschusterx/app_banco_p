import type { ChecklistItem, ChecklistReport } from './types'
import { normalizePhotoUrls } from './photos'

const API_BASE = (import.meta.env.VITE_EMAIL_API_URL as string | undefined)?.replace(/\/$/, '') || ''
const APP_TOKEN = (import.meta.env.VITE_APP_SEND_TOKEN as string | undefined) || ''

/** null = ainda não consultou; false = sem Resend; true = API ok */
let cachedEmailConfigured: boolean | null = null

/** Prefetch ao abrir Novo — avisa se o envio automático está pronto. */
export async function prefetchEmailConfigured(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/health`, { method: 'GET' })
    const payload = (await response.json()) as { emailConfigured?: boolean }
    cachedEmailConfigured = Boolean(payload.emailConfigured)
  } catch {
    cachedEmailConfigured = false
  }
  return Boolean(cachedEmailConfigured)
}

export function getCachedEmailConfigured(): boolean | null {
  return cachedEmailConfigured
}

export type SendEmailResult = {
  ok: true
  id: string | null
  sentTo: string[]
  via: 'api'
}

/**
 * Envio automático pelo servidor (Resend).
 * Não abre o e-mail pessoal do usuário — as fotos vão anexadas + no corpo do HTML.
 */
export async function sendReportEmail(report: ChecklistReport): Promise<SendEmailResult> {
  const photos = normalizePhotoUrls(report)

  if (cachedEmailConfigured === null) {
    await prefetchEmailConfigured()
  }
  if (cachedEmailConfigured === false) {
    throw new Error(
      'Envio automático não configurado. Defina RESEND_API_KEY no servidor (veja EMAIL.md) para enviar as fotos sem abrir seu e-mail.',
    )
  }

  const url = `${API_BASE}/api/send-email`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (APP_TOKEN) headers['X-App-Token'] = APP_TOKEN

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        to: report.sentTo,
        subject: `Checklist: ${report.title}`,
        title: report.title,
        location: report.location,
        items: report.items.map((item) => ({ label: item.label, done: item.done })),
        observations: report.observations,
        createdAt: report.createdAt,
        photoDataUrls: photos,
        photoDataUrl: photos[0] ?? null,
      }),
    })
  } catch {
    cachedEmailConfigured = false
    throw new Error(
      'Não foi possível falar com o servidor de e-mail. Confira a conexão e se a API está no ar.',
    )
  }

  let payload: { error?: string; id?: string | null; sentTo?: string[]; ok?: boolean } = {}
  try {
    payload = (await response.json()) as typeof payload
  } catch {
    payload = {}
  }

  if (!response.ok) {
    if (response.status === 503) cachedEmailConfigured = false
    throw new Error(
      payload.error ||
        `Falha ao enviar e-mail (${response.status}). Com RESEND_API_KEY o envio inclui as fotos automaticamente.`,
    )
  }

  cachedEmailConfigured = true
  return {
    ok: true,
    id: payload.id ?? null,
    sentTo: payload.sentTo ?? report.sentTo,
    via: 'api',
  }
}

export function createItems(labels: string[]): ChecklistItem[] {
  return labels.map((label, i) => ({
    id: `item-${i}-${label.slice(0, 12)}`,
    label,
    done: false,
  }))
}
