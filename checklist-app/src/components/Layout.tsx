import { Link, NavLink, Outlet } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

export function Layout() {
  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden />
          <span className="brand-text">Task-Flux</span>
        </Link>
        <div className="topbar-right">
          <ThemeToggle />
          <nav className="nav" aria-label="Principal">
            <NavLink to="/" end>
              Início
            </NavLink>
            <NavLink to="/novo">Novo</NavLink>
            <NavLink to="/contatos">Grupos</NavLink>
            <NavLink to="/historico">Histórico</NavLink>
          </nav>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
