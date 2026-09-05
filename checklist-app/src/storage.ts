import { withSyncedPhotoFields } from './photos';
import type { AppData, ChecklistReport, Contact, ContactGroup } from './types';

const STORAGE_KEY = 'task-flux-data-v2';

/** Lista inicia em branco; o usuário inclui os itens na tela. */
const DEFAULT_ITEMS: string[] = [];

function emptyData(): AppData {
  return {
    contacts: [],
    groups: [],
    reports: [],
    defaultItems: DEFAULT_ITEMS,
  };
}

function migrateReport(report: ChecklistReport): ChecklistReport {
  return withSyncedPhotoFields(report);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function uniqueEmails(emails: string[]): string[] {
  return Array.from(new Set(emails.map(normalizeEmail).filter((e) => e.includes('@'))));
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem('task-flux-data-v1');
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      contacts: parsed.contacts ?? [],
      groups: parsed.groups ?? [],
      reports: (parsed.reports ?? []).map((report) => migrateReport(report as ChecklistReport)),
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

export function upsertGroup(group: ContactGroup): AppData {
  const data = loadData();
  const cleaned: ContactGroup = {
    ...group,
    name: group.name.trim(),
    emails: uniqueEmails(group.emails),
  };
  const idx = data.groups.findIndex((g) => g.id === cleaned.id);
  if (idx >= 0) data.groups[idx] = cleaned;
  else data.groups.push(cleaned);
  data.groups.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  saveData(data);
  return data;
}

export function deleteGroup(id: string): AppData {
  const data = loadData();
  data.groups = data.groups.filter((g) => g.id !== id);
  saveData(data);
  return data;
}

export function saveReport(report: ChecklistReport): AppData {
  const data = loadData();
  const normalized = migrateReport(report);
  data.reports = [normalized, ...data.reports.filter((r) => r.id !== normalized.id)].slice(0, 40);
  saveData(data);
  return data;
}

export function deleteReport(id: string): AppData {
  const data = loadData();
  data.reports = data.reports.filter((r) => r.id !== id);
  saveData(data);
  return data;
}
