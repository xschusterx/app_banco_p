import type { ChecklistItem, ChecklistReport } from './types'
import { normalizePhotoUrls } from './photos'

const API_BASE = (import.meta.env.VITE_EMAIL_API_URL as string | undefined)?.replace(/\/$/, '') || ''
const APP_TOKEN = (import.meta.env.VITE_APP_SEND_TOKEN as string | undefined) || ''

/** null = ainda não consultou; false = sem Resend; true = API ok */
let cachedEmailConfigured: boolean | null = null

/** Prefetch ao abrir a tela Novo — evita gastar o gesto do toque no iOS. */
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

export function buildEmailBody(
  report: ChecklistReport,
  opts?: { claimPhotosAttached?: boolean },
): string {
  const photos = normalizePhotoUrls(report)
  const claimPhotos = opts?.claimPhotosAttached ?? false
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
    if (claimPhotos) {
      lines.push(
        photos.length === 1
          ? 'Foto: anexada neste e-mail.'
          : `${photos.length} fotos: anexadas neste e-mail.`,
      )
    } else {
      lines.push(
        photos.length === 1
          ? 'Foto: compartilhada pelo aparelho (anexo).'
          : `${photos.length} fotos: compartilhadas pelo aparelho (anexos).`,
      )
    }
  }
  lines.push('')
  lines.push('— Enviado pelo Task-Flux')
  return lines.join('\n')
}

export type SendEmailResult = {
  ok: true
  id: string | null
  sentTo: string[]
  via: 'api' | 'share' | 'mailto' | 'cancelled'
}

function shouldFallbackToDevice(status: number, message: string): boolean {
  if (status === 502 || status === 503 || status === 504) return true
  return /RESEND_API_KEY|não configurado|nao configurado|Falha ao enviar e-mail \(50[234]\)/i.test(
    message,
  )
}

/** iOS/Safari nem sempre usa name === 'AbortError' ao fechar o sheet. */
function isShareCancellation(error: unknown): boolean {
  const err = error as { name?: string; message?: string }
  const name = err?.name || ''
  const message = (err?.message || '').toLowerCase()
  if (name === 'AbortError') return true
  if (name === 'NotAllowedError' && /cancel|abort|denied/i.test(message)) return true
  return /cancel|abort|shar(e|ing) cancel/i.test(message)
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

/** Conversão síncrona — evita await/fetch que quebra o gesto do toque no iOS. */
function dataUrlToFileSync(dataUrl: string, index: number): File {
  const comma = dataUrl.indexOf(',')
  const header = comma >= 0 ? dataUrl.slice(0, comma) : ''
  const data = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl
  const mime = /data:(image\/[a-zA-Z0-9.+-]+);base64/i.exec(header)?.[1] || 'image/jpeg'
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  const ext = mime.includes('png') ? 'png' : 'jpg'
  return new File([bytes], `checklist-foto-${index + 1}.${ext}`, { type: mime })
}

function canShareFiles(files: File[]): boolean {
  if (!navigator.share || !navigator.canShare) return false
  try {
    return navigator.canShare({ files })
  } catch {
    return false
  }
}

/**
 * Com fotos: compartilha ARQUIVOS (Mail anexa de verdade).
 * Não usa mailto com fotos.
 * No iOS, chamar share o mais cedo possível após o toque (sem POST da API antes).
 */
export async function shareReport(options: {
  emails: string[]
  subject: string
  body: string
  photoDataUrls: string[]
}): Promise<'shared' | 'mailto' | 'cancelled'> {
  const { emails, subject, body, photoDataUrls } = options
  const hasPhotos = photoDataUrls.length > 0

  if (hasPhotos) {
    if (!navigator.share || !navigator.canShare) {
      throw new Error(
        'Este navegador não compartilha arquivos com foto. Abra no Safari e tente de novo, ou configure RESEND_API_KEY no servidor.',
      )
    }

    const photoFiles = photoDataUrls.map((url, i) => dataUrlToFileSync(url, i))
    const reportFile = new File(
      [`${body}\n\nPara: ${emails.join(', ')}\n`],
      'checklist-relatorio.txt',
      { type: 'text/plain' },
    )

    // Preferir só fotos (mais compatível no iOS); txt é opcional.
    const pack = canShareFiles(photoFiles)
      ? photoFiles
      : canShareFiles([...photoFiles, reportFile])
        ? [...photoFiles, reportFile]
        : null

    if (!pack) {
      throw new Error(
        'Este aparelho bloqueou anexos no compartilhar. Configure RESEND_API_KEY no servidor (EMAIL.md) para enviar as fotos no e-mail.',
      )
    }

    try {
      await navigator.share({ files: pack, title: subject })
      return 'shared'
    } catch (error) {
      if (isShareCancellation(error)) return 'cancelled'
      if ((error as Error).name === 'NotAllowedError') {
        throw new Error(
          'Toque de novo em Finalizar e, no menu Compartilhar, escolha Mail (as fotos vão como anexo).',
        )
      }
      throw new Error(
        'Não foi possível abrir o compartilhamento com as fotos. Toque em Finalizar outra vez e escolha Mail.',
      )
    }
  }

  if (navigator.share) {
    try {
      await navigator.share({
        title: subject,
        text: `${body}\n\nPara: ${emails.join(', ')}`,
      })
      return 'shared'
    } catch (error) {
      if (isShareCancellation(error)) return 'cancelled'
    }
  }

  openMailto(emails, subject, body)
  return 'mailto'
}

async function sendViaDevice(report: ChecklistReport): Promise<SendEmailResult> {
  const photos = normalizePhotoUrls(report)
  const subject = `Checklist: ${report.title}`
  const body = buildEmailBody(report, { claimPhotosAttached: false })
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
    via: deviceVia === 'shared' ? 'share' : deviceVia === 'cancelled' ? 'cancelled' : 'mailto',
  }
}

export async function sendReportEmail(report: ChecklistReport): Promise<SendEmailResult> {
  const photos = normalizePhotoUrls(report)

  // Sem Resend: NÃO chamar POST antes do share — no iOS isso perde o gesto do toque.
  if (photos.length && cachedEmailConfigured === false) {
    return sendViaDevice(report)
  }

  if (photos.length && cachedEmailConfigured === null) {
    await prefetchEmailConfigured()
    if (cachedEmailConfigured === false) {
      return sendViaDevice(report)
    }
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
      cachedEmailConfigured = false
      return sendViaDevice(report)
    }
    throw new Error(message)
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
