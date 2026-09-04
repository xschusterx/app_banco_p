import type { Contact } from '../types';

type Props = {
  contacts: Contact[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  customEmail: string;
  onCustomEmailChange: (value: string) => void;
};

export function ContactPicker({
  contacts,
  selectedIds,
  onToggle,
  customEmail,
  onCustomEmailChange,
}: Props) {
  return (
    <section className="send-block">
      <div className="section-head">
        <h2>Enviar por e-mail</h2>
        <p>Escolha contatos salvos ou digite um e-mail novo para este envio.</p>
      </div>

      {contacts.length === 0 ? (
        <p className="hint">Nenhum contato salvo ainda. Digite um e-mail abaixo ou cadastre em Contatos.</p>
      ) : (
        <ul className="contact-pick-list">
          {contacts.map((contact) => {
            const checked = selectedIds.includes(contact.id);
            return (
              <li key={contact.id}>
                <label className={`contact-pick ${checked ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(contact.id)}
                  />
                  <span>
                    <strong>{contact.name}</strong>
                    <em>{contact.email}</em>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      <label className="field">
        <span>E-mail avulso</span>
        <input
          type="email"
          value={customEmail}
          onChange={(e) => onCustomEmailChange(e.target.value)}
          placeholder="exemplo@empresa.com"
        />
      </label>
    </section>
  );
}
