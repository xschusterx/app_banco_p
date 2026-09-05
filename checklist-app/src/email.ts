import type { ChecklistItem, ChecklistReport } from './types'
import { normalizePhotoUrls } from './photos'

const API_BASE = (import.meta.env.VITE_EMAIL_API_URL as string | undefined)?.replace(/\/$/, '') || ''
const APP_TOKEN = (import.meta.env.VITE_APP_SEND_TOKEN as string | undefined) || ''

export function buildEmailBody(report: ChecklistReport): string {
  const photos = normalizePhotoUrls(report)
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
  if (photos.length) {
    lines.push('')
    lines.push(
      photos.length === 1
        ? 'Foto: anexada no e-mail (ou compartilhada pelo aparelho).'
        : `${photos.length} fotos: anexadas no e-mail (ou compartilhadas pelo aparelho).`,
    )
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
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.rel = 'noopener'
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

async function dataUrlToFile(dataUrl: string, index: number): Promise<File> {
  const blob = await (await fetch(dataUrl)).blob()
  const ext = blob.type.includes('png') ? 'png' : 'jpg'
  return new File([blob], `checklist-foto-${index + 1}.${ext}`, {
    type: blob.type || 'image/jpeg',
  })
}

/**
 * Fallback sem Resend: tenta compartilhar COM as fotos.
 * mailto: não anexa imagem — por isso preferimos share quando há fotos.
 */
export async function shareReport(options: {
  emails: string[]
  subject: string
  body: string
  photoDataUrls: string[]
}): Promise<'shared' | 'mailto'> {
  const { emails, subject, body, photoDataUrls } = options

  if (navigator.share) {
    try {
      const data: ShareData = {
        title: subject,
        text: `${body}\n\nPara: ${emails.join(', ')}`,
      }

      if (photoDataUrls.length && navigator.canShare) {
        const files = await Promise.all(photoDataUrls.map((url, i) => dataUrlToFile(url, i)))
        const withFiles = { ...data, files }
        if (navigator.canShare(withFiles)) {
          await navigator.share(withFiles)
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
  const photos = normalizePhotoUrls(report)
  const subject = `Checklist: ${report.title}`
  const body = buildEmailBody(report)
  const deviceVia = await shareReport({
    emails: report.sentTo,
    subject,
    body,
    photoDataUrls: photos,
  })
  return {
    ok: true,
    id: null,
    sentTo: report.sentTo,
    via: deviceVia === 'shared' ? 'share' : 'mailto',
  }
}

export async function sendReportEmail(report: ChecklistReport): Promise<SendEmailResult> {
  const photos = normalizePhotoUrls(report)
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
        // compatível com API antiga
        photoDataUrl: photos[0] ?? null,
      }),
    })
  } catch {
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
