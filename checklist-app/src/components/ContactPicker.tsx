import type { Contact, ContactGroup } from '../types';

type Props = {
  contacts: Contact[];
  groups: ContactGroup[];
  selectedContactIds: string[];
  selectedGroupIds: string[];
  onToggleContact: (id: string) => void;
  onToggleGroup: (id: string) => void;
  customEmail: string;
  onCustomEmailChange: (value: string) => void;
};

export function ContactPicker({
  contacts,
  groups,
  selectedContactIds,
  selectedGroupIds,
  onToggleContact,
  onToggleGroup,
  customEmail,
  onCustomEmailChange,
}: Props) {
  return (
    <section className="send-block">
      <div className="section-head">
        <h2>Destinatários</h2>
        <p>
          Escolha contatos ou grupos cadastrados (ou um e-mail avulso de destino). O envio sai pelo
          Task-Flux — você não precisa abrir sua caixa de e-mail.
        </p>
      </div>

      {groups.length > 0 ? (
        <>
          <h3 className="picker-subtitle">Grupos</h3>
          <ul className="contact-pick-list">
            {groups.map((group) => {
              const checked = selectedGroupIds.includes(group.id);
              return (
                <li key={group.id}>
                  <label className={`contact-pick ${checked ? 'active' : ''}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleGroup(group.id)}
                    />
                    <span>
                      <strong>{group.name}</strong>
                      <em className="group-emails">
                        {group.emails.length} e-mail(s): {group.emails.join(', ')}
                      </em>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}

      {contacts.length > 0 ? (
        <>
          <h3 className="picker-subtitle">Contatos</h3>
          <ul className="contact-pick-list">
            {contacts.map((contact) => {
              const checked = selectedContactIds.includes(contact.id);
              return (
                <li key={contact.id}>
                  <label className={`contact-pick ${checked ? 'active' : ''}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleContact(contact.id)}
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
        </>
      ) : null}

      {groups.length === 0 && contacts.length === 0 ? (
        <p className="hint">
          Nenhum contato ou grupo salvo ainda. Cadastre em Contatos ou digite um e-mail abaixo.
        </p>
      ) : null}

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
