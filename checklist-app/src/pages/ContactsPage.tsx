import { useState } from 'react';
import type { FormEvent } from 'react';
import { deleteContact, loadData, uid, upsertContact } from '../storage';
import type { Contact } from '../types';

export function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>(() => loadData().contacts);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function resetForm() {
    setName('');
    setEmail('');
    setEditingId(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanName || !cleanEmail || !cleanEmail.includes('@')) {
      setMessage('Informe nome e um e-mail válido.');
      return;
    }

    const contact: Contact = {
      id: editingId ?? uid(),
      name: cleanName,
      email: cleanEmail,
    };
    const data = upsertContact(contact);
    setContacts(data.contacts);
    setMessage(editingId ? 'Contato atualizado.' : 'Contato salvo para próximos envios.');
    resetForm();
  }

  function startEdit(contact: Contact) {
    setEditingId(contact.id);
    setName(contact.name);
    setEmail(contact.email);
    setMessage(null);
  }

  function remove(id: string) {
    const data = deleteContact(id);
    setContacts(data.contacts);
    if (editingId === id) resetForm();
    setMessage('Contato removido.');
  }

  return (
    <div className="page">
      <header className="page-intro">
        <h1>Contatos de e-mail</h1>
        <p>Cadastre destinatários para reutilizar ao finalizar outros checklists.</p>
      </header>

      <form className="form-block contact-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Nome</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Eng. Carla" />
        </label>
        <label className="field">
          <span>E-mail</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="carla@empresa.com"
          />
        </label>
        <div className="row-actions">
          <button type="submit" className="btn primary">
            {editingId ? 'Salvar alteração' : 'Adicionar contato'}
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
          <h2>Salvos neste aparelho</h2>
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
                <button type="button" className="btn ghost" onClick={() => startEdit(contact)}>
                  Editar
                </button>
                <button type="button" className="btn ghost danger" onClick={() => remove(contact.id)}>
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
