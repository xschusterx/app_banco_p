import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContactPicker } from '../components/ContactPicker';
import { ObservationsField } from '../components/ObservationsField';
import { PhotoCapture } from '../components/PhotoCapture';
import { buildEmailBody, createItems, shareReport } from '../email';
import { loadData, saveReport, uid, upsertContact } from '../storage';
import type { ChecklistItem, ChecklistReport } from '../types';

export function NewChecklistPage() {
  const navigate = useNavigate();
  const initial = useMemo(() => loadData(), []);
  const [title, setTitle] = useState('Vistoria de campo');
  const [location, setLocation] = useState('');
  const [items, setItems] = useState<ChecklistItem[]>(() => createItems(initial.defaultItems));
  const [newItem, setNewItem] = useState('');
  const [observations, setObservations] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [customEmail, setCustomEmail] = useState('');
  const [saveCustomAsContact, setSaveCustomAsContact] = useState(true);
  const [customContactName, setCustomContactName] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  function toggleItem(id: string) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  }

  function addItem(e: FormEvent) {
    e.preventDefault();
    const label = newItem.trim();
    if (!label) return;
    setItems((prev) => [...prev, { id: uid(), label, done: false }]);
    setNewItem('');
  }

  function toggleContact(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function collectEmails(): string[] {
    const fromContacts = initial.contacts
      .filter((c) => selectedIds.includes(c.id))
      .map((c) => c.email.trim())
      .filter(Boolean);
    const extra = customEmail.trim();
    const all = [...fromContacts];
    if (extra) all.push(extra);
    return Array.from(new Set(all.map((e) => e.toLowerCase())));
  }

  function handleFinish() {
    const emails = collectEmails();
    if (!title.trim()) {
      setFeedback('Informe um título para o checklist.');
      return;
    }
    if (!emails.length) {
      setFeedback('Selecione um contato ou digite um e-mail para enviar.');
      return;
    }

    if (customEmail.trim() && saveCustomAsContact) {
      upsertContact({
        id: uid(),
        name: customContactName.trim() || customEmail.trim().split('@')[0],
        email: customEmail.trim().toLowerCase(),
      });
    }

    const report: ChecklistReport = {
      id: uid(),
      title: title.trim(),
      location: location.trim(),
      items,
      observations: observations.trim(),
      photoDataUrl,
      createdAt: new Date().toISOString(),
      sentTo: emails,
    };

    saveReport(report);
    setFeedback('Checklist salvo. Preparando envio…');
    void shareReport({
      emails,
      subject: `Checklist: ${report.title}`,
      body: buildEmailBody(report),
      photoDataUrl: report.photoDataUrl,
    }).then((mode) => {
      setFeedback(mode === 'shared' ? 'Checklist enviado.' : 'Checklist salvo. Abrindo o e-mail…');
      setTimeout(() => navigate(`/historico/${report.id}`), 500);
    });
  }

  return (
    <div className="page form-page">
      <header className="page-intro">
        <h1>Novo checklist</h1>
        <p>Preencha os itens, registre foto e observações, depois envie aos destinatários.</p>
      </header>

      <section className="form-block">
        <label className="field">
          <span>Título</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Inspeção matinal" />
        </label>
        <label className="field">
          <span>Local</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ex.: Obra Setor B / Galpão 3"
          />
        </label>
      </section>

      <section className="form-block">
        <div className="section-head">
          <h2>Itens do checklist</h2>
          <p>Marque o que foi conferido. Inclua itens extras se precisar.</p>
        </div>
        <ul className="check-list">
          {items.map((item) => (
            <li key={item.id}>
              <label className={`check-row ${item.done ? 'done' : ''}`}>
                <input type="checkbox" checked={item.done} onChange={() => toggleItem(item.id)} />
                <span>{item.label}</span>
              </label>
            </li>
          ))}
        </ul>
        <form className="inline-add" onSubmit={addItem}>
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Novo item…"
            aria-label="Novo item do checklist"
          />
          <button type="submit" className="btn ghost">
            Adicionar
          </button>
        </form>
      </section>

      <PhotoCapture photoDataUrl={photoDataUrl} onChange={setPhotoDataUrl} />
      <ObservationsField value={observations} onChange={setObservations} />

      <ContactPicker
        contacts={initial.contacts}
        selectedIds={selectedIds}
        onToggle={toggleContact}
        customEmail={customEmail}
        onCustomEmailChange={setCustomEmail}
      />

      {customEmail.trim() ? (
        <div className="save-contact-box">
          <label className="check-row">
            <input
              type="checkbox"
              checked={saveCustomAsContact}
              onChange={(e) => setSaveCustomAsContact(e.target.checked)}
            />
            <span>Salvar este e-mail nos contatos para próximos checklists</span>
          </label>
          {saveCustomAsContact ? (
            <label className="field">
              <span>Nome do contato</span>
              <input
                value={customContactName}
                onChange={(e) => setCustomContactName(e.target.value)}
                placeholder="Ex.: Supervisão / Cliente"
              />
            </label>
          ) : null}
        </div>
      ) : null}

      {feedback ? <p className="feedback">{feedback}</p> : null}

      <div className="sticky-actions">
        <button type="button" className="btn primary wide" onClick={handleFinish}>
          Finalizar e enviar e-mail
        </button>
      </div>
    </div>
  );
}
