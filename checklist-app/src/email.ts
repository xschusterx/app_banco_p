import type { ChecklistItem, ChecklistReport } from './types';

export function buildEmailBody(report: ChecklistReport): string {
  const lines: string[] = [];
  lines.push(`Checklist: ${report.title}`);
  if (report.location) lines.push(`Local: ${report.location}`);
  lines.push(`Data: ${new Date(report.createdAt).toLocaleString('pt-BR')}`);
  lines.push('');
  lines.push('Itens verificados:');
  report.items.forEach((item) => {
    lines.push(`${item.done ? '[x]' : '[ ]'} ${item.label}`);
  });
  lines.push('');
  lines.push('Observações:');
  lines.push(report.observations.trim() || '(sem observações)');
  if (report.photoDataUrl) {
    lines.push('');
    lines.push('Foto: anexada no aplicativo. Abra o relatório salvo no Relato Campo para visualizar.');
  }
  lines.push('');
  lines.push('— Enviado pelo Relato Campo');
  return lines.join('\n');
}

export function openMailto(emails: string[], subject: string, body: string): void {
  const url = `mailto:${emails.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = url;
}

export async function shareReport(options: {
  emails: string[];
  subject: string;
  body: string;
  photoDataUrl: string | null;
}): Promise<'shared' | 'mailto'> {
  const { emails, subject, body, photoDataUrl } = options;

  if (navigator.share) {
    try {
      const data: ShareData = {
        title: subject,
        text: `${body}\n\nPara: ${emails.join(', ')}`,
      };

      if (photoDataUrl && navigator.canShare) {
        const blob = await (await fetch(photoDataUrl)).blob();
        const file = new File([blob], 'checklist-foto.jpg', { type: blob.type || 'image/jpeg' });
        const withFile = { ...data, files: [file] };
        if (navigator.canShare(withFile)) {
          await navigator.share(withFile);
          return 'shared';
        }
      }

      await navigator.share(data);
      return 'shared';
    } catch (error) {
      if ((error as Error).name === 'AbortError') return 'shared';
    }
  }

  openMailto(emails, subject, body);
  return 'mailto';
}

export function createItems(labels: string[]): ChecklistItem[] {
  return labels.map((label, i) => ({
    id: `item-${i}-${label.slice(0, 12)}`,
    label,
    done: false,
  }));
}
