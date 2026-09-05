function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(iso || '')
  }
}

export function buildTextEmail(report) {
  const lines = []
  lines.push('TASK-FLUX — Relatório de checklist')
  lines.push('='.repeat(36))
  lines.push(`Título: ${report.title}`)
  if (report.location) lines.push(`Veículo / placa: ${report.location}`)
  lines.push(`Data: ${formatDate(report.createdAt)}`)
  lines.push('')
  lines.push('Itens verificados:')
  for (const item of report.items || []) {
    lines.push(`  ${item.done ? '[x]' : '[ ]'} ${item.label}`)
  }
  lines.push('')
  lines.push('Observações:')
  lines.push(report.observations || '(sem observações)')
  if (report.hasPhoto) {
    const count = Number(report.photoCount) || 1
    lines.push('')
    lines.push(count === 1 ? '1 foto anexada neste e-mail.' : `${count} fotos anexadas neste e-mail.`)
  }
  lines.push('')
  lines.push('— Enviado automaticamente pelo Task-Flux')
  return lines.join('\n')
}

/**
 * Layout HTML apresentável para o destinatário.
 * Fotos aparecem no corpo via cid: (inlinePhotoCids) e também como anexos.
 */
export function buildHtmlEmail(report) {
  const doneCount = (report.items || []).filter((i) => i.done).length
  const totalCount = (report.items || []).length
  const photoCount = Number(report.photoCount) || (report.inlinePhotoCids || []).length || 0

  const itemsHtml = (report.items || [])
    .map((item) => {
      const done = Boolean(item.done)
      const bg = done ? '#e8f5ef' : '#f7f7f5'
      const border = done ? '#b7d9c8' : '#e5e7eb'
      const markBg = done ? '#1b6b4a' : '#d1d5db'
      const mark = done ? '✓' : ''
      const labelColor = done ? '#143528' : '#4b5563'
      return `
        <tr>
          <td style="padding:0 0 8px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${bg};border:1px solid ${border};border-radius:10px;">
              <tr>
                <td width="40" valign="middle" style="padding:12px 0 12px 12px;">
                  <div style="width:24px;height:24px;border-radius:999px;background:${markBg};color:#ffffff;font-size:13px;font-weight:700;line-height:24px;text-align:center;">${mark}</div>
                </td>
                <td valign="middle" style="padding:12px 14px 12px 8px;font-size:15px;line-height:1.35;color:${labelColor};font-weight:${done ? 600 : 500};">
                  ${escapeHtml(item.label || 'Item')}
                </td>
              </tr>
            </table>
          </td>
        </tr>`
    })
    .join('')

  const photosHtml = Array.isArray(report.inlinePhotoCids) && report.inlinePhotoCids.length
    ? `
      <tr>
        <td style="padding:8px 28px 8px;">
          <h2 style="margin:0 0 12px;font-size:15px;letter-spacing:0.04em;text-transform:uppercase;color:#1b6b4a;">Fotos do checklist</h2>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            ${report.inlinePhotoCids
              .map((cid, i) => {
                const n = i + 1
                return `
              <tr>
                <td style="padding:0 0 14px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;background:#0f172a;">
                    <tr>
                      <td style="padding:0;line-height:0;">
                        <img src="cid:${cid}" alt="Foto ${n} do checklist" width="504" style="display:block;width:100%;max-width:504px;height:auto;border:0;" />
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:10px 14px;background:#111827;color:#e5e7eb;font-size:12px;">
                        Foto ${n} de ${report.inlinePhotoCids.length}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`
              })
              .join('')}
          </table>
        </td>
      </tr>`
    : report.hasPhoto
      ? `
      <tr>
        <td style="padding:8px 28px 20px;">
          <p style="margin:0;padding:12px 14px;background:#eef6f1;border-radius:10px;color:#1b6b4a;font-size:13px;">
            ${photoCount === 1 ? '1 foto anexada neste e-mail.' : `${photoCount} fotos anexadas neste e-mail.`}
          </p>
        </td>
      </tr>`
      : ''

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(report.title || 'Checklist')}</title>
</head>
<body style="margin:0;padding:0;background:#e8ece7;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#14201a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#e8ece7;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #d5ddd6;box-shadow:0 8px 28px rgba(20,40,30,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#143528 0%,#1b6b4a 100%);padding:26px 28px 22px;">
              <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#b7e0cb;font-weight:600;">Task-Flux</div>
              <div style="margin-top:8px;font-size:24px;line-height:1.25;font-weight:700;color:#ffffff;">${escapeHtml(report.title || 'Checklist')}</div>
              <div style="margin-top:8px;font-size:13px;color:#d7eee2;">Relatório enviado automaticamente — sem abrir o e-mail do aparelho</div>
            </td>
          </tr>

          <!-- Meta cards -->
          <tr>
            <td style="padding:20px 28px 8px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="50%" valign="top" style="padding:0 6px 10px 0;">
                    <div style="background:#f4f7f5;border-radius:12px;padding:12px 14px;">
                      <div style="font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#6b7280;">Data</div>
                      <div style="margin-top:4px;font-size:14px;font-weight:600;color:#143528;">${escapeHtml(formatDate(report.createdAt))}</div>
                    </div>
                  </td>
                  <td width="50%" valign="top" style="padding:0 0 10px 6px;">
                    <div style="background:#f4f7f5;border-radius:12px;padding:12px 14px;">
                      <div style="font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#6b7280;">Veículo / placa</div>
                      <div style="margin-top:4px;font-size:14px;font-weight:600;color:#143528;">${escapeHtml(report.location || 'Não informado')}</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" valign="top" style="padding:0 6px 0 0;">
                    <div style="background:#eef6f1;border-radius:12px;padding:12px 14px;">
                      <div style="font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#6b7280;">Itens ok</div>
                      <div style="margin-top:4px;font-size:14px;font-weight:700;color:#1b6b4a;">${doneCount}/${totalCount}</div>
                    </div>
                  </td>
                  <td width="50%" valign="top" style="padding:0 0 0 6px;">
                    <div style="background:#eef6f1;border-radius:12px;padding:12px 14px;">
                      <div style="font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#6b7280;">Fotos</div>
                      <div style="margin-top:4px;font-size:14px;font-weight:700;color:#1b6b4a;">${photoCount}</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td style="padding:18px 28px 8px;">
              <h2 style="margin:0 0 12px;font-size:15px;letter-spacing:0.04em;text-transform:uppercase;color:#1b6b4a;">Itens do checklist</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                ${itemsHtml || '<tr><td style="color:#6b7280;font-size:14px;">Nenhum item informado.</td></tr>'}
              </table>
            </td>
          </tr>

          <!-- Observations -->
          <tr>
            <td style="padding:12px 28px 8px;">
              <h2 style="margin:0 0 10px;font-size:15px;letter-spacing:0.04em;text-transform:uppercase;color:#1b6b4a;">Observações</h2>
              <div style="background:#fafaf8;border:1px solid #e8ece6;border-radius:12px;padding:14px 16px;font-size:14px;line-height:1.55;color:#374151;white-space:pre-wrap;">${escapeHtml(report.observations || 'Sem observações.')}</div>
            </td>
          </tr>

          <!-- Photos -->
          ${photosHtml}

          <!-- Footer -->
          <tr>
            <td style="padding:18px 28px 24px;border-top:1px solid #e8ece6;">
              <div style="font-size:12px;line-height:1.5;color:#6b7280;">
                Este relatório foi gerado e enviado automaticamente pelo <strong style="color:#1b6b4a;">Task-Flux</strong>.
                As fotos também seguem anexadas a este e-mail.
              </div>
            </td>
          </tr>
        </table>
        <div style="max-width:560px;margin:14px auto 0;font-size:11px;color:#8a948d;text-align:center;">
          Não responda este e-mail se for remetente automático de sistema.
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`
}
