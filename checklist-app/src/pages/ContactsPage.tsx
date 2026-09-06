import { useState } from 'react';
import type { FormEvent } from 'react';
import { deleteContact, deleteGroup, loadData, uid, upsertContact, upsertGroup } from '../storage';
import type { Contact, ContactGroup } from '../types';

function parseEmails(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes('@'));
}

export function ContactsPage() {
  const initial = loadData();
  const [contacts, setContacts] = useState<Contact[]>(() => initial.contacts);
  const [groups, setGroups] = useState<ContactGroup[]>(() => initial.groups);

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [editingContactId, setEditingContactId] = useState<string | null>(null);

  const [groupName, setGroupName] = useState('');
  const [groupEmailsText, setGroupEmailsText] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  const [message, setMessage] = useState<string | null>(null);

  function resetContactForm() {
    setContactName('');
    setContactEmail('');
    setEditingContactId(null);
  }

  function resetGroupForm() {
    setGroupName('');
    setGroupEmailsText('');
    setEditingGroupId(null);
  }

  function handleContactSubmit(e: FormEvent) {
    e.preventDefault();
    const cleanName = contactName.trim();
    const cleanEmail = contactEmail.trim().toLowerCase();
    if (!cleanName || !cleanEmail || !cleanEmail.includes('@')) {
      setMessage('Informe nome e um e-mail válido para o contato.');
      return;
    }

    const data = upsertContact({
      id: editingContactId ?? uid(),
      name: cleanName,
      email: cleanEmail,
    });
    setContacts(data.contacts);
    setMessage(editingContactId ? 'Contato atualizado.' : 'Contato salvo para próximos envios.');
    resetContactForm();
  }

  function startEditContact(contact: Contact) {
    setEditingContactId(contact.id);
    setContactName(contact.name);
    setContactEmail(contact.email);
    setMessage(null);
  }

  function removeContact(id: string) {
    const data = deleteContact(id);
    setContacts(data.contacts);
    if (editingContactId === id) resetContactForm();
    setMessage('Contato removido.');
  }

  function handleGroupSubmit(e: FormEvent) {
    e.preventDefault();
    const cleanName = groupName.trim();
    const emails = parseEmails(groupEmailsText);
    if (!cleanName) {
      setMessage('Informe o nome do grupo.');
      return;
    }
    if (!emails.length) {
      setMessage('Informe pelo menos um e-mail válido no grupo.');
      return;
    }

    const data = upsertGroup({
      id: editingGroupId ?? uid(),
      name: cleanName,
      emails,
    });
    setGroups(data.groups);
    setMessage(editingGroupId ? 'Grupo atualizado.' : 'Grupo salvo para próximos envios.');
    resetGroupForm();
  }

  function startEditGroup(group: ContactGroup) {
    setEditingGroupId(group.id);
    setGroupName(group.name);
    setGroupEmailsText(group.emails.join('\n'));
    setMessage(null);
  }

  function removeGroup(id: string) {
    const data = deleteGroup(id);
    setGroups(data.groups);
    if (editingGroupId === id) resetGroupForm();
    setMessage('Grupo removido.');
  }

  return (
    <div className="page">
      <header className="page-intro">
        <h1>Contatos de e-mail</h1>
        <p>
          Cadastre contatos individuais e também grupos com vários e-mails para selecionar no envio
          do checklist.
        </p>
      </header>

      <form className="form-block contact-form" onSubmit={handleContactSubmit}>
        <div className="section-head">
          <h2>Contato individual</h2>
          <p>Salve um destinatário por vez.</p>
        </div>
        <label className="field">
          <span>Nome</span>
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Ex.: Eng. Carla"
          />
        </label>
        <label className="field">
          <span>E-mail</span>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="carla@empresa.com"
          />
        </label>
        <div className="row-actions">
          <button type="submit" className="btn primary">
            {editingContactId ? 'Salvar contato' : 'Adicionar contato'}
          </button>
          {editingContactId ? (
            <button type="button" className="btn ghost" onClick={resetContactForm}>
              Cancelar
            </button>
          ) : null}
        </div>
      </form>

      <form className="form-block contact-form" onSubmit={handleGroupSubmit}>
        <div className="section-head">
          <h2>Grupo de contatos</h2>
          <p>Salve vários e-mails juntos e escolha o grupo na hora do envio.</p>
        </div>
        <label className="field">
          <span>Nome do grupo</span>
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Ex.: Supervisão / Oficina / Cliente"
          />
        </label>
        <label className="field">
          <span>E-mails do grupo</span>
          <textarea
            className="textarea"
            rows={4}
            value={groupEmailsText}
            onChange={(e) => setGroupEmailsText(e.target.value)}
            placeholder={
              'Um e-mail por linha, ou separados por vírgula\ncarla@empresa.com\njoao@empresa.com'
            }
          />
        </label>
        <div className="row-actions">
          <button type="submit" className="btn primary">
            {editingGroupId ? 'Salvar grupo' : 'Adicionar grupo'}
          </button>
          {editingGroupId ? (
            <button type="button" className="btn ghost" onClick={resetGroupForm}>
              Cancelar
            </button>
          ) : null}
        </div>
      </form>

      {message ? <p className="feedback">{message}</p> : null}

      <section className="form-block">
        <div className="section-head">
          <h2>Contatos salvos</h2>
          <p>{contacts.length ? `${contacts.length} contato(s)` : 'Nenhum contato cadastrado.'}</p>
        </div>
        <ul className="contact-list">
          {contacts.map((contact) => (
            <li key={contact.id}>
              <div>
                <strong>{contact.name}</strong>
                <span>{contact.email}</span>
              </div>
              <div className="row-actions">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => startEditContact(contact)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="btn ghost danger"
                  onClick={() => removeContact(contact.id)}
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="form-block">
        <div className="section-head">
          <h2>Grupos salvos</h2>
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
                <button type="button" className="btn ghost" onClick={() => startEditGroup(group)}>
                  Editar
                </button>
                <button
                  type="button"
                  className="btn ghost danger"
                  onClick={() => removeGroup(group.id)}
                >
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
