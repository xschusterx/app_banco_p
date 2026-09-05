import type { ChecklistItem, ChecklistReport } from './types'

const API_BASE = (import.meta.env.VITE_EMAIL_API_URL as string | undefined)?.replace(/\/$/, '') || ''
const APP_TOKEN = (import.meta.env.VITE_APP_SEND_TOKEN as string | undefined) || ''

export function buildEmailBody(report: ChecklistReport): string {
  const lines: string[] = []
  lines.push(`Checklist: ${report.title}`)
  if (report.location) lines.push(`Veículo / placa: ${report.location}`)
  lines.push(`Data: ${new Date(report.createdAt).toLocaleString('pt-BR')}`)
  lines.push('')
  lines.push('Itens verificados:')
  report.items.forEach((item) => {
    lines.push(`${item.done ? '[x]' : '[ ]'} ${item.label}`)
  })
  lines.push('')
  lines.push('Observações:')
  lines.push(report.observations.trim() || '(sem observações)')
  if (report.photoDataUrl) {
    lines.push('')
    lines.push('Foto: anexada no e-mail (ou compartilhada pelo aparelho).')
  }
  lines.push('')
  lines.push('— Enviado pelo Task-Flux')
  return lines.join('\n')
}

export type SendEmailResult = {
  ok: true
  id: string | null
  sentTo: string[]
  via: 'api' | 'share' | 'mailto'
}

/** 503 do Resend ausente, túnel morto (HTML) ou API fora — usa o aparelho. */
function shouldFallbackToDevice(status: number, message: string): boolean {
  if (status === 502 || status === 503 || status === 504) return true
  return /RESEND_API_KEY|não configurado|nao configurado|Falha ao enviar e-mail \(50[234]\)/i.test(
    message,
  )
}

export function openMailto(emails: string[], subject: string, body: string): void {
  const url = `mailto:${emails.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  // Prefer anchor click so the SPA stays on the page and feedback can show.
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.rel = 'noopener'
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

/** Fallback quando a API Resend não está configurada: compartilha ou abre o app de e-mail. */
export async function shareReport(options: {
  emails: string[]
  subject: string
  body: string
  photoDataUrl: string | null
}): Promise<'shared' | 'mailto'> {
  const { emails, subject, body, photoDataUrl } = options

  if (navigator.share) {
    try {
      const data: ShareData = {
        title: subject,
        text: `${body}\n\nPara: ${emails.join(', ')}`,
      }

      if (photoDataUrl && navigator.canShare) {
        const blob = await (await fetch(photoDataUrl)).blob()
        const file = new File([blob], 'checklist-foto.jpg', { type: blob.type || 'image/jpeg' })
        const withFile = { ...data, files: [file] }
        if (navigator.canShare(withFile)) {
          await navigator.share(withFile)
          return 'shared'
        }
      }

      await navigator.share(data)
      return 'shared'
    } catch (error) {
      if ((error as Error).name === 'AbortError') return 'shared'
    }
  }

  openMailto(emails, subject, body)
  return 'mailto'
}

async function sendViaDevice(report: ChecklistReport): Promise<SendEmailResult> {
  const subject = `Checklist: ${report.title}`
  const body = buildEmailBody(report)
  const deviceVia = await shareReport({
    emails: report.sentTo,
    subject,
    body,
    photoDataUrl: report.photoDataUrl,
  })
  return {
    ok: true,
    id: null,
    sentTo: report.sentTo,
    via: deviceVia === 'shared' ? 'share' : 'mailto',
  }
}

export async function sendReportEmail(report: ChecklistReport): Promise<SendEmailResult> {
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
        photoDataUrl: report.photoDataUrl,
      }),
    })
  } catch {
    // Sem rede / API offline: ainda permite enviar pelo aparelho.
    return sendViaDevice(report)
  }

  let payload: { error?: string; id?: string | null; sentTo?: string[]; ok?: boolean } = {}
  try {
    payload = (await response.json()) as typeof payload
  } catch {
    payload = {}
  }

  if (!response.ok) {
    const message = payload.error || `Falha ao enviar e-mail (${response.status}).`
    if (shouldFallbackToDevice(response.status, message)) {
      return sendViaDevice(report)
    }
    throw new Error(message)
  }

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
