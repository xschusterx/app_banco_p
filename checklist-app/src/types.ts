export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

export type Contact = {
  id: string;
  name: string;
  email: string;
};

/** Grupo com vários e-mails para envio em lote do checklist. */
export type ContactGroup = {
  id: string;
  name: string;
  emails: string[];
};

export type ChecklistReport = {
  id: string;
  title: string;
  location: string;
  items: ChecklistItem[];
  observations: string;
  photoDataUrl: string | null;
  createdAt: string;
  sentTo: string[];
};

export type AppData = {
  contacts: Contact[];
  groups: ContactGroup[];
  reports: ChecklistReport[];
  defaultItems: string[];
};
