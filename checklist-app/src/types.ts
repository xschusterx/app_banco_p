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
  reports: ChecklistReport[];
  defaultItems: string[];
};
