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
    lines.push('Foto: anexada no e-mail.')
  }
  lines.push('')
  lines.push('— Enviado pelo Task-Flux')
  return lines.join('\n')
}

export type SendEmailResult = {
  ok: true
  id: string | null
  sentTo: string[]
}

export async function sendReportEmail(report: ChecklistReport): Promise<SendEmailResult> {
  const url = `${API_BASE}/api/send-email`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (APP_TOKEN) headers['X-App-Token'] = APP_TOKEN

  const response = await fetch(url, {
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

  let payload: { error?: string; id?: string | null; sentTo?: string[]; ok?: boolean } = {}
  try {
    payload = (await response.json()) as typeof payload
  } catch {
    payload = {}
  }

  if (!response.ok) {
    throw new Error(payload.error || `Falha ao enviar e-mail (${response.status}).`)
  }

  return {
    ok: true,
    id: payload.id ?? null,
    sentTo: payload.sentTo ?? report.sentTo,
  }
}

export function createItems(labels: string[]): ChecklistItem[] {
  return labels.map((label, i) => ({
    id: `item-${i}-${label.slice(0, 12)}`,
    label,
    done: false,
  }))
}
