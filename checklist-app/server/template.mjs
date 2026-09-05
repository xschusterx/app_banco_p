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
    return new Date(iso).toLocaleString('pt-BR')
  } catch {
    return String(iso || '')
  }
}

export function buildTextEmail(report) {
  const lines = []
  lines.push(`Checklist: ${report.title}`)
  if (report.location) lines.push(`Veículo / placa: ${report.location}`)
  lines.push(`Data: ${formatDate(report.createdAt)}`)
  lines.push('')
  lines.push('Itens:')
  for (const item of report.items) {
    lines.push(`${item.done ? '[x]' : '[ ]'} ${item.label}`)
  }
  lines.push('')
  lines.push('Observações:')
  lines.push(report.observations || '(sem observações)')
  if (report.hasPhoto) {
    lines.push('')
    lines.push('Foto: anexada neste e-mail.')
  }
  lines.push('')
  lines.push('— Enviado pelo Task-Flux')
  return lines.join('\n')
}

export function buildHtmlEmail(report) {
  const itemsHtml = (report.items || [])
    .map((item) => {
      const mark = item.done ? '✓' : '○'
      const color = item.done ? '#1b3a2f' : '#6b7280'
      return `<li style="margin:0 0 8px;color:${color};font-size:15px;line-height:1.4;">
        <span style="display:inline-block;width:1.2em;">${mark}</span>
        ${escapeHtml(item.label)}
      </li>`
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f3f4f1;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#1b1f1c;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f1;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #dde3db;">
          <tr>
            <td style="background:#1b3a2f;padding:20px 24px;">
              <div style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#c6d5c8;">Task-Flux</div>
              <div style="font-size:22px;font-weight:700;color:#ffffff;margin-top:6px;">${escapeHtml(report.title)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 6px;color:#4b5563;font-size:14px;"><strong>Data:</strong> ${escapeHtml(formatDate(report.createdAt))}</p>
              ${
                report.location
                  ? `<p style="margin:0 0 16px;color:#4b5563;font-size:14px;"><strong>Veículo / placa:</strong> ${escapeHtml(report.location)}</p>`
                  : '<div style="height:10px;"></div>'
              }
              <h2 style="margin:0 0 10px;font-size:16px;color:#1b3a2f;">Itens do checklist</h2>
              <ul style="margin:0;padding:0 0 0 4px;list-style:none;">${itemsHtml || '<li style="color:#6b7280;">Nenhum item informado.</li>'}</ul>
              <h2 style="margin:20px 0 8px;font-size:16px;color:#1b3a2f;">Observações</h2>
              <p style="margin:0;white-space:pre-wrap;font-size:14px;line-height:1.5;color:#374151;">${escapeHtml(report.observations || 'Sem observações.')}</p>
              ${
                report.hasPhoto
                  ? '<p style="margin:18px 0 0;font-size:13px;color:#4b5563;">A foto do checklist está anexada a este e-mail.</p>'
                  : ''
              }
            </td>
          </tr>
          <tr>
            <td style="padding:14px 24px 20px;border-top:1px solid #e8ece6;font-size:12px;color:#6b7280;">
              Relatório gerado automaticamente pelo Task-Flux.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
