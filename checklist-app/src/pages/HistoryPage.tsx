import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { sendReportEmail } from '../email';
import { normalizePhotos, normalizePhotoUrls } from '../photos';
import { deleteReport, loadData } from '../storage';

export function HistoryPage() {
  const reports = loadData().reports;

  return (
    <div className="page">
      <header className="page-intro">
        <h1>Histórico</h1>
        <p>Relatórios salvos neste aparelho para consulta e reenvio.</p>
      </header>

      {!reports.length ? (
        <p className="hint">Nenhum checklist finalizado ainda.</p>
      ) : (
        <ul className="report-list tall">
          {reports.map((report) => {
            const photos = normalizePhotoUrls(report);
            return (
              <li key={report.id}>
                <Link to={`/historico/${report.id}`}>
                  <strong>{report.title}</strong>
                  <span>
                    {new Date(report.createdAt).toLocaleString('pt-BR')}
                    {report.location ? ` · ${report.location}` : ''}
                    {photos.length ? ` · ${photos.length} foto(s)` : ''}
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
  const report = loadData().reports.find((r) => r.id === id);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

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

  const photos = normalizePhotos(report);

  async function handleResend() {
    if (!report || sending) return;
    setSending(true);
    setFeedback('Reenviando e-mail…');
    try {
      await sendReportEmail(report);
      setFeedback(
        photos.length
          ? `E-mail reenviado com ${photos.length} foto(s) no corpo/anexo.`
          : 'E-mail reenviado pelo servidor.',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao reenviar.';
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
      </header>

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
        </div>
        <p className="obs-text">{report.sentTo.join(', ')}</p>
      </section>

      {feedback ? <p className="feedback">{feedback}</p> : null}

      <div className="row-actions wrap">
        <button
          type="button"
          className="btn primary"
          onClick={() => void handleResend()}
          disabled={sending}
        >
          {sending ? 'Enviando…' : 'Reenviar e-mail'}
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
