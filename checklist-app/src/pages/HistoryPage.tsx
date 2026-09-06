import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { sendReportEmail } from '../email';
import { normalizePhotos, normalizePhotoUrls } from '../photos';
import { deleteReport, isReportPendingSend, loadData, updateReport } from '../storage';
import type { ChecklistReport } from '../types';

function parseEmails(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[,;\s]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.includes('@')),
    ),
  );
}

function statusLabel(report: ChecklistReport): string {
  return isReportPendingSend(report) ? 'Pendente de envio' : 'Enviado';
}

export function HistoryPage() {
  const reports = loadData().reports;

  return (
    <div className="page">
      <header className="page-intro">
        <h1>Histórico</h1>
        <p>Relatórios salvos neste aparelho para consulta e envio depois.</p>
      </header>

      {!reports.length ? (
        <p className="hint">Nenhum checklist finalizado ainda.</p>
      ) : (
        <ul className="report-list tall">
          {reports.map((report) => {
            const photos = normalizePhotoUrls(report);
            const pending = isReportPendingSend(report);
            return (
              <li key={report.id}>
                <Link to={`/historico/${report.id}`}>
                  <strong>{report.title}</strong>
                  <span>
                    {new Date(report.createdAt).toLocaleString('pt-BR')}
                    {report.location ? ` · ${report.location}` : ''}
                    {photos.length ? ` · ${photos.length} foto(s)` : ''}
                  </span>
                  <span className={`status-pill ${pending ? 'pending' : 'sent'}`}>
                    {statusLabel(report)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const initial = loadData().reports.find((r) => r.id === id);
  const [report, setReport] = useState<ChecklistReport | undefined>(initial);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [emailDraft, setEmailDraft] = useState(() => initial?.sentTo.join(', ') ?? '');

  useEffect(() => {
    const next = loadData().reports.find((r) => r.id === id);
    setReport(next);
    setEmailDraft(next?.sentTo.join(', ') ?? '');
    setFeedback(null);
    setSending(false);
  }, [id]);

  const pending = useMemo(() => (report ? isReportPendingSend(report) : false), [report]);
  const photos = report ? normalizePhotos(report) : [];

  if (!report) {
    return (
      <div className="page">
        <p className="hint">Relatório não encontrado.</p>
        <Link to="/historico" className="text-link">
          Voltar ao histórico
        </Link>
      </div>
    );
  }

  async function handleSend() {
    if (!report || sending) return;
    const emails = parseEmails(emailDraft);
    if (!emails.length) {
      setFeedback('Informe ao menos um e-mail de destino para enviar.');
      return;
    }

    const toSend: ChecklistReport = { ...report, sentTo: emails };
    setSending(true);
    setFeedback(pending ? 'Enviando e-mail…' : 'Reenviando e-mail…');
    try {
      const result = await sendReportEmail(toSend);
      const next: ChecklistReport = {
        ...toSend,
        sentTo: result.sentTo,
        sentAt: new Date().toISOString(),
      };
      updateReport(report.id, { sentTo: next.sentTo, sentAt: next.sentAt });
      setReport(next);
      setEmailDraft(next.sentTo.join(', '));
      setFeedback(
        photos.length
          ? `E-mail enviado com ${photos.length} foto(s) para ${result.sentTo.join(', ')}.`
          : `E-mail enviado para ${result.sentTo.join(', ')}.`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao enviar.';
      setFeedback(message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="page">
      <header className="page-intro">
        <p className="eyebrow">{new Date(report.createdAt).toLocaleString('pt-BR')}</p>
        <h1>{report.title}</h1>
        {report.location ? <p className="hero-lead soft">{report.location}</p> : null}
        <p className={`status-pill inline ${pending ? 'pending' : 'sent'}`}>
          {statusLabel(report)}
        </p>
      </header>

      {pending ? (
        <div className="banner warn" role="status">
          <strong>Aguardando envio.</strong>
          <span> Confira os destinatários abaixo e toque em enviar quando estiver pronto.</span>
        </div>
      ) : null}

      {photos.length ? (
        <ul className="photo-grid photo-grid-notes detail">
          {photos.map((photo, index) => (
            <li key={`detail-photo-${index}`} className="photo-grid-item has-note">
              <div className="photo-thumb">
                <img src={photo.dataUrl} alt={`Foto ${index + 1} do checklist ${report.title}`} />
              </div>
              {photo.note ? <p className="photo-note-text">{photo.note}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}

      <section className="form-block">
        <div className="section-head">
          <h2>Itens</h2>
        </div>
        <ul className="check-list readonly">
          {report.items.map((item) => (
            <li key={item.id}>
              <span className={`check-row ${item.done ? 'done' : ''}`}>
                <span className="tick" aria-hidden>
                  {item.done ? '✓' : '○'}
                </span>
                <span>{item.label}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="form-block">
        <div className="section-head">
          <h2>Observações</h2>
        </div>
        <p className="obs-text">{report.observations || 'Sem observações.'}</p>
      </section>

      <section className="form-block">
        <div className="section-head">
          <h2>Assinaturas</h2>
        </div>
        {report.authorSignature || report.verifierSignature ? (
          <div className="signature-grid detail">
            <div className="signature-card">
              <h3>Responsável</h3>
              <p className="obs-text">{report.authorSignature?.name || '—'}</p>
              {report.authorSignature?.dataUrl ? (
                <img
                  className="signature-preview"
                  src={report.authorSignature.dataUrl}
                  alt={`Assinatura de ${report.authorSignature.name}`}
                />
              ) : (
                <p className="hint">Sem imagem de assinatura.</p>
              )}
            </div>
            <div className="signature-card">
              <h3>Conferente</h3>
              <p className="obs-text">{report.verifierSignature?.name || '—'}</p>
              {report.verifierSignature?.dataUrl ? (
                <img
                  className="signature-preview"
                  src={report.verifierSignature.dataUrl}
                  alt={`Assinatura de ${report.verifierSignature.name}`}
                />
              ) : (
                <p className="hint">Sem imagem de assinatura.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="obs-text">Este checklist antigo não possui assinaturas registradas.</p>
        )}
      </section>

      <section className="form-block">
        <div className="section-head">
          <h2>Destinatários</h2>
          <p>
            {pending
              ? 'Informe um ou mais e-mails (separados por vírgula) para o envio.'
              : 'Destinatários do último envio. Você pode alterar e reenviar.'}
          </p>
        </div>
        <label className="field">
          <span>E-mails</span>
          <input
            value={emailDraft}
            onChange={(e) => setEmailDraft(e.target.value)}
            placeholder="exemplo@empresa.com, equipe@empresa.com"
            inputMode="email"
            autoComplete="email"
            disabled={sending}
          />
        </label>
      </section>

      {feedback ? <p className="feedback">{feedback}</p> : null}

      <div className="row-actions wrap">
        <button
          type="button"
          className="btn primary"
          onClick={() => void handleSend()}
          disabled={sending}
        >
          {sending ? 'Enviando…' : pending ? 'Enviar e-mail agora' : 'Reenviar e-mail'}
        </button>
        <button
          type="button"
          className="btn ghost danger"
          onClick={() => {
            deleteReport(report.id);
            navigate('/historico');
          }}
        >
          Excluir
        </button>
        <Link to="/historico" className="btn ghost">
          Voltar
        </Link>
      </div>
    </div>
  );
}
