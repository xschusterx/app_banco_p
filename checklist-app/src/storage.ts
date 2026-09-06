import { withSyncedPhotoFields } from './photos';
import type {
  AppData,
  ChecklistItem,
  ChecklistPhoto,
  ChecklistReport,
  Contact,
  ContactGroup,
} from './types';

const STORAGE_KEY = 'task-flux-data-v2';
const DRAFT_KEY = 'task-flux-draft-v1';

/** Lista inicia em branco; o usuário inclui os itens na tela. */
const DEFAULT_ITEMS: string[] = [];

/** Rascunho do checklist em andamento (localStorage). */
export type ChecklistDraft = {
  title: string;
  location: string;
  items: ChecklistItem[];
  observations: string;
  photos: ChecklistPhoto[];
  selectedGroupIds: string[];
  selectedContactIds: string[];
  customEmail: string;
  authorName: string;
  authorSignatureDataUrl: string | null;
  verifierName: string;
  verifierSignatureDataUrl: string | null;
  updatedAt: string;
};

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

export function updateReport(
  id: string,
  patch: Partial<Pick<ChecklistReport, 'sentTo' | 'sentAt'>>,
): AppData {
  const data = loadData();
  const idx = data.reports.findIndex((r) => r.id === id);
  if (idx < 0) return data;
  data.reports[idx] = migrateReport({ ...data.reports[idx], ...patch });
  saveData(data);
  return data;
}

/** Checklist finalizado localmente, ainda sem e-mail enviado. */
export function isReportPendingSend(report: ChecklistReport): boolean {
  return report.sentAt === null;
}

export function deleteReport(id: string): AppData {
  const data = loadData();
  data.reports = data.reports.filter((r) => r.id !== id);
  saveData(data);
  return data;
}

export function loadDraft(): ChecklistDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ChecklistDraft>;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      title: typeof parsed.title === 'string' ? parsed.title : 'Checklist',
      location: typeof parsed.location === 'string' ? parsed.location : '',
      items: Array.isArray(parsed.items) ? (parsed.items as ChecklistItem[]) : [],
      observations: typeof parsed.observations === 'string' ? parsed.observations : '',
      photos: Array.isArray(parsed.photos) ? (parsed.photos as ChecklistPhoto[]) : [],
      selectedGroupIds: Array.isArray(parsed.selectedGroupIds)
        ? parsed.selectedGroupIds.map(String)
        : [],
      selectedContactIds: Array.isArray(parsed.selectedContactIds)
        ? parsed.selectedContactIds.map(String)
        : [],
      customEmail: typeof parsed.customEmail === 'string' ? parsed.customEmail : '',
      authorName: typeof parsed.authorName === 'string' ? parsed.authorName : '',
      authorSignatureDataUrl:
        typeof parsed.authorSignatureDataUrl === 'string' ? parsed.authorSignatureDataUrl : null,
      verifierName: typeof parsed.verifierName === 'string' ? parsed.verifierName : '',
      verifierSignatureDataUrl:
        typeof parsed.verifierSignatureDataUrl === 'string'
          ? parsed.verifierSignatureDataUrl
          : null,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveDraft(draft: Omit<ChecklistDraft, 'updatedAt'>): void {
  const payload: ChecklistDraft = {
    ...draft,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  } catch {
    // Quota (fotos grandes): ignora — o envio ainda usa a API.
  }
}

export function clearDraft(): void {
  localStorage.removeItem(DRAFT_KEY);
}
