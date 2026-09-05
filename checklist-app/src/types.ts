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

/** Foto do checklist com observação opcional. */
export type ChecklistPhoto = {
  dataUrl: string;
  note: string;
};

export type ChecklistReport = {
  id: string;
  title: string;
  location: string;
  items: ChecklistItem[];
  observations: string;
  /** Fotos com observação opcional por imagem. */
  photos: ChecklistPhoto[];
  /**
   * @deprecated use `photos` — mantido sincronizado para histórico antigo / e-mail.
   */
  photoDataUrls: string[];
  /** @deprecated use photos — migração de histórico antigo */
  photoDataUrl?: string | null;
  createdAt: string;
  sentTo: string[];
};

export type AppData = {
  contacts: Contact[];
  groups: ContactGroup[];
  reports: ChecklistReport[];
  defaultItems: string[];
};
