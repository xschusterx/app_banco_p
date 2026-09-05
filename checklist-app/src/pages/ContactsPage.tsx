import { useState } from 'react';
import type { FormEvent } from 'react';
import { deleteGroup, loadData, uid, upsertGroup } from '../storage';
import type { ContactGroup } from '../types';

function parseEmails(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes('@'));
}

export function ContactsPage() {
  const [groups, setGroups] = useState<ContactGroup[]>(() => loadData().groups);
  const [name, setName] = useState('');
  const [emailsText, setEmailsText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function resetForm() {
    setName('');
    setEmailsText('');
    setEditingId(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const cleanName = name.trim();
    const emails = parseEmails(emailsText);
    if (!cleanName) {
      setMessage('Informe o nome do grupo.');
      return;
    }
    if (!emails.length) {
      setMessage('Informe pelo menos um e-mail válido.');
      return;
    }

    const group: ContactGroup = {
      id: editingId ?? uid(),
      name: cleanName,
      emails,
    };
    const data = upsertGroup(group);
    setGroups(data.groups);
    setMessage(editingId ? 'Grupo atualizado.' : 'Grupo salvo para próximos envios.');
    resetForm();
  }

  function startEdit(group: ContactGroup) {
    setEditingId(group.id);
    setName(group.name);
    setEmailsText(group.emails.join('\n'));
    setMessage(null);
  }

  function remove(id: string) {
    const data = deleteGroup(id);
    setGroups(data.groups);
    if (editingId === id) resetForm();
    setMessage('Grupo removido.');
  }

  return (
    <div className="page">
      <header className="page-intro">
        <h1>Grupos de e-mail</h1>
        <p>Cadastre grupos com vários destinatários e selecione o grupo ao finalizar o checklist.</p>
      </header>

      <form className="form-block contact-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Nome do grupo</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Supervisão / Oficina / Cliente"
          />
        </label>
        <label className="field">
          <span>E-mails do grupo</span>
          <textarea
            className="textarea"
            rows={4}
            value={emailsText}
            onChange={(e) => setEmailsText(e.target.value)}
            placeholder={'Um e-mail por linha, ou separados por vírgula\ncarla@empresa.com\njoao@empresa.com'}
          />
        </label>
        <div className="row-actions">
          <button type="submit" className="btn primary">
            {editingId ? 'Salvar grupo' : 'Adicionar grupo'}
          </button>
          {editingId ? (
            <button type="button" className="btn ghost" onClick={resetForm}>
              Cancelar
            </button>
          ) : null}
        </div>
      </form>

      {message ? <p className="feedback">{message}</p> : null}

      <section className="form-block">
        <div className="section-head">
          <h2>Grupos salvos neste aparelho</h2>
          <p>{groups.length ? `${groups.length} grupo(s)` : 'Nenhum grupo cadastrado.'}</p>
        </div>
        <ul className="contact-list group-list">
          {groups.map((group) => (
            <li key={group.id}>
              <div>
                <strong>{group.name}</strong>
                <span>{group.emails.length} e-mail(s)</span>
                <em className="group-emails">{group.emails.join(', ')}</em>
              </div>
              <div className="row-actions">
                <button type="button" className="btn ghost" onClick={() => startEdit(group)}>
                  Editar
                </button>
                <button type="button" className="btn ghost danger" onClick={() => remove(group.id)}>
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
