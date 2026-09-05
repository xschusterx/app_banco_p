import type { ChecklistItem, ChecklistReport } from './types'
import { normalizePhotoUrls } from './photos'

const API_BASE = (import.meta.env.VITE_EMAIL_API_URL as string | undefined)?.replace(/\/$/, '') || ''
const APP_TOKEN = (import.meta.env.VITE_APP_SEND_TOKEN as string | undefined) || ''

export function buildEmailBody(report: ChecklistReport, opts?: { claimPhotosAttached?: boolean }): string {
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
          ? 'Foto: salva no Task-Flux (abra o compartilhamento do aparelho para anexá-la).'
          : `${photos.length} fotos: salvas no Task-Flux (abra o compartilhamento do aparelho para anexá-las).`,
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

function canShareFiles(files: File[]): boolean {
  if (!navigator.share || !navigator.canShare) return false
  try {
    return navigator.canShare({ files })
  } catch {
    return false
  }
}

/**
 * Com fotos: só compartilha se os ARQUIVOS forem incluídos.
 * mailto NÃO anexa imagem — por isso não usamos mailto quando há fotos.
 * No iOS, enviamos as fotos + um .txt do relatório como arquivos (Mail anexa de verdade).
 */
export async function shareReport(options: {
  emails: string[]
  subject: string
  body: string
  photoDataUrls: string[]
}): Promise<'shared' | 'mailto'> {
  const { emails, subject, body, photoDataUrls } = options
  const hasPhotos = photoDataUrls.length > 0

  if (hasPhotos) {
    if (!navigator.share || !navigator.canShare) {
      throw new Error(
        'Este navegador não compartilha arquivos. No iPhone, abra pelo Safari e toque em Finalizar de novo, ou configure RESEND_API_KEY no servidor.',
      )
    }

    const photoFiles = await Promise.all(photoDataUrls.map((url, i) => dataUrlToFile(url, i)))
    const reportText = `${body}\n\nPara: ${emails.join(', ')}\n`
    const reportFile = new File([reportText], 'checklist-relatorio.txt', {
      type: 'text/plain',
    })

    const filesWithReport = [...photoFiles, reportFile]
    const filesOnlyPhotos = photoFiles

    const pack = canShareFiles(filesWithReport)
      ? filesWithReport
      : canShareFiles(filesOnlyPhotos)
        ? filesOnlyPhotos
        : null

    if (!pack) {
      throw new Error(
        'Não foi possível anexar as fotos neste aparelho. Configure RESEND_API_KEY no servidor (EMAIL.md) para o e-mail sair com as fotos.',
      )
    }

    try {
      // Só arquivos: no iOS isso abre o sheet e o Mail recebe os anexos.
      await navigator.share({ files: pack, title: subject })
      return 'shared'
    } catch (error) {
      if ((error as Error).name === 'AbortError') return 'shared'
      throw new Error(
        'Compartilhamento cancelado ou sem suporte a anexos. Toque em Finalizar e escolha Mail no menu Compartilhar (as fotos precisam ir como arquivo).',
      )
    }
  }

  // Sem fotos: share de texto ou mailto estão ok.
  if (navigator.share) {
    try {
      await navigator.share({
        title: subject,
        text: `${body}\n\nPara: ${emails.join(', ')}`,
      })
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
  // Nunca afirmar que fotos foram anexadas no caminho mailto/texto.
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
