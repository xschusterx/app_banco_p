import { useTheme } from '../hooks/useTheme';

export function ThemeToggle() {
  const { isDark, switchTheme } = useTheme();

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={switchTheme}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={isDark ? 'Tema claro' : 'Tema escuro'}
    >
      <span className="theme-toggle-icon" aria-hidden>
        {isDark ? '☀' : '☾'}
      </span>
      <span className="theme-toggle-label">{isDark ? 'Claro' : 'Escuro'}</span>
    </button>
  );
}
