import { Link } from 'react-router-dom';
import { loadData } from '../storage';

export function HomePage() {
  const data = loadData();
  const recent = data.reports.slice(0, 3);

  return (
    <div className="page home-page">
      <section className="hero">
        <div className="hero-veil" aria-hidden />
        <div className="hero-copy">
          <p className="hero-brand">Relato Campo</p>
          <h1>Checklist com foto, voz e envio direto por e-mail</h1>
          <p className="hero-lead">
            Registre a vistoria, tire a foto, dite as observações e encaminhe o relatório aos contatos salvos.
          </p>
          <div className="hero-actions">
            <Link className="btn primary" to="/novo">
              Começar checklist
            </Link>
            <Link className="btn ghost light" to="/contatos">
              Gerenciar contatos
            </Link>
          </div>
        </div>
      </section>

      <section className="home-panel">
        <div className="section-head">
          <h2>Como funciona</h2>
          <p>Três passos para fechar a vistoria no celular.</p>
        </div>
        <ol className="steps">
          <li>
            <strong>Marque os itens</strong>
            <span>Confira o que está ok no local e anote o que falta.</span>
          </li>
          <li>
            <strong>Foto e relato</strong>
            <span>Capture a imagem e digite ou fale as observações.</span>
          </li>
          <li>
            <strong>Envie por e-mail</strong>
            <span>Use contatos salvos para reenviar em próximas vistorias.</span>
          </li>
        </ol>
      </section>

      <section className="home-panel">
        <div className="section-head row">
          <div>
            <h2>Últimos envios</h2>
            <p>{recent.length ? 'Relatórios salvos neste aparelho.' : 'Ainda não há checklists enviados.'}</p>
          </div>
          <Link to="/historico" className="text-link">
            Ver histórico
          </Link>
        </div>
        {recent.length ? (
          <ul className="report-list">
            {recent.map((report) => (
              <li key={report.id}>
                <Link to={`/historico/${report.id}`}>
                  <strong>{report.title}</strong>
                  <span>{new Date(report.createdAt).toLocaleString('pt-BR')}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
