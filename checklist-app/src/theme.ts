export type Theme = 'light' | 'dark';

const THEME_KEY = 'relato-campo-theme';

export function getStoredTheme(): Theme {
  try {
    const value = localStorage.getItem(THEME_KEY);
    if (value === 'dark' || value === 'light') return value;
  } catch {
    /* ignore */
  }
  return 'light';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0d1612' : '#1b3a2f');
}

export function setStoredTheme(theme: Theme): void {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}

export function toggleTheme(current: Theme): Theme {
  const next: Theme = current === 'light' ? 'dark' : 'light';
  setStoredTheme(next);
  return next;
}
