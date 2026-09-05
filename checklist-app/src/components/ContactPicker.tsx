import type { ContactGroup } from '../types';

type Props = {
  groups: ContactGroup[];
  selectedGroupIds: string[];
  onToggleGroup: (id: string) => void;
  customEmail: string;
  onCustomEmailChange: (value: string) => void;
};

export function ContactPicker({
  groups,
  selectedGroupIds,
  onToggleGroup,
  customEmail,
  onCustomEmailChange,
}: Props) {
  return (
    <section className="send-block">
      <div className="section-head">
        <h2>Enviar por e-mail</h2>
        <p>Selecione um ou mais grupos salvos, ou digite um e-mail avulso para este envio.</p>
      </div>

      {groups.length === 0 ? (
        <p className="hint">
          Nenhum grupo salvo ainda. Cadastre em Contatos ou digite um e-mail abaixo.
        </p>
      ) : (
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
