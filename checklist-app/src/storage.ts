import type { AppData, ChecklistReport, Contact } from './types';

const STORAGE_KEY = 'relato-campo-data-v2';

/** Modelo base de checklist de veículos; o usuário pode incluir outros itens na tela. */
const DEFAULT_ITEMS = [
  'Farol',
  'Pneus',
  'Para-brisa',
  'Lataria',
];

function emptyData(): AppData {
  return {
    contacts: [],
    reports: [],
    defaultItems: DEFAULT_ITEMS,
  };
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as AppData;
    return {
      contacts: parsed.contacts ?? [],
      reports: parsed.reports ?? [],
      // Sempre usa o modelo atual de veículos; itens extras o usuário adiciona na tela.
      defaultItems: DEFAULT_ITEMS,
    };
  } catch {
    return emptyData();
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function upsertContact(contact: Contact): AppData {
  const data = loadData();
  const idx = data.contacts.findIndex((c) => c.id === contact.id);
  if (idx >= 0) data.contacts[idx] = contact;
  else data.contacts.push(contact);
  data.contacts.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  saveData(data);
  return data;
}

export function deleteContact(id: string): AppData {
  const data = loadData();
  data.contacts = data.contacts.filter((c) => c.id !== id);
  saveData(data);
  return data;
}

export function saveReport(report: ChecklistReport): AppData {
  const data = loadData();
  data.reports = [report, ...data.reports.filter((r) => r.id !== report.id)].slice(0, 40);
  saveData(data);
  return data;
}

export function deleteReport(id: string): AppData {
  const data = loadData();
  data.reports = data.reports.filter((r) => r.id !== id);
  saveData(data);
  return data;
}
