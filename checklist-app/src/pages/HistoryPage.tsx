import { Link, useNavigate, useParams } from 'react-router-dom';
import { buildEmailBody, openMailto } from '../email';
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
          {reports.map((report) => (
            <li key={report.id}>
              <Link to={`/historico/${report.id}`}>
                <strong>{report.title}</strong>
                <span>
                  {new Date(report.createdAt).toLocaleString('pt-BR')}
                  {report.location ? ` · ${report.location}` : ''}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const report = loadData().reports.find((r) => r.id === id);

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

  return (
    <div className="page">
      <header className="page-intro">
        <p className="eyebrow">{new Date(report.createdAt).toLocaleString('pt-BR')}</p>
        <h1>{report.title}</h1>
        {report.location ? <p className="hero-lead soft">{report.location}</p> : null}
      </header>

      {report.photoDataUrl ? (
        <div className="photo-preview detail">
          <img src={report.photoDataUrl} alt={`Foto do checklist ${report.title}`} />
        </div>
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
          <h2>Destinatários</h2>
        </div>
        <p className="obs-text">{report.sentTo.join(', ')}</p>
      </section>

      <div className="row-actions wrap">
        <button
          type="button"
          className="btn primary"
          onClick={() => openMailto(report.sentTo, `Checklist: ${report.title}`, buildEmailBody(report))}
        >
          Reenviar e-mail
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
