import { Link, NavLink, Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden />
          <span className="brand-text">Relato Campo</span>
        </Link>
        <nav className="nav" aria-label="Principal">
          <NavLink to="/" end>
            Início
          </NavLink>
          <NavLink to="/novo">Novo</NavLink>
          <NavLink to="/contatos">Contatos</NavLink>
          <NavLink to="/historico">Histórico</NavLink>
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
