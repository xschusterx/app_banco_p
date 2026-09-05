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
          <p className="hero-brand">Task-Flux</p>
          <h1>Checklist de veículos com foto, voz e envio por e-mail</h1>
          <p className="hero-lead">
            Confira farol, pneus, para-brisa e lataria, acrescente o que quiser, tire a foto e envie o relato.
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
          <p>Três passos para fechar a conferência do veículo.</p>
        </div>
        <ol className="steps">
          <li>
            <strong>Marque os itens</strong>
            <span>Inclua o que deseja relatar como conferido (óleo, pneus…).</span>
          </li>
          <li>
            <strong>Foto e relato</strong>
            <span>Faça a captura de fotos e descreva.</span>
          </li>
          <li>
            <strong>Envie por e-mail</strong>
            <span>Após finalizar o checklist, encaminhe por e-mail.</span>
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
