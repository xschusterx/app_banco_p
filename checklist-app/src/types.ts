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

/** Assinatura manuscrita (canvas → PNG) com nome legível. */
export type ChecklistSignature = {
  name: string;
  dataUrl: string;
  signedAt: string;
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
  /** Quem preencheu o checklist (obrigatório nos novos envios). */
  authorSignature?: ChecklistSignature | null;
  /** Quem conferiu o checklist (obrigatório nos novos envios). */
  verifierSignature?: ChecklistSignature | null;
  createdAt: string;
  sentTo: string[];
};

export type AppData = {
  contacts: Contact[];
  groups: ContactGroup[];
  reports: ChecklistReport[];
  defaultItems: string[];
};
