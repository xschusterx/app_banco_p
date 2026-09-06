import { SignaturePad } from './SignaturePad';

type SignaturesBlockProps = {
  authorName: string;
  authorDataUrl: string | null;
  verifierName: string;
  verifierDataUrl: string | null;
  onAuthorNameChange: (value: string) => void;
  onAuthorDataUrlChange: (value: string | null) => void;
  onVerifierNameChange: (value: string) => void;
  onVerifierDataUrlChange: (value: string | null) => void;
  disabled?: boolean;
};

/** Bloco obrigatório: assinatura do responsável + do conferente. */
export function SignaturesBlock({
  authorName,
  authorDataUrl,
  verifierName,
  verifierDataUrl,
  onAuthorNameChange,
  onAuthorDataUrlChange,
  onVerifierNameChange,
  onVerifierDataUrlChange,
  disabled = false,
}: SignaturesBlockProps) {
  return (
    <section className="form-block signatures-block">
      <div className="section-head">
        <h2>Assinaturas obrigatórias</h2>
        <p>
          Para finalizar, o responsável pelo checklist e o conferente precisam assinar e informar o
          nome completo.
        </p>
      </div>

      <div className="signature-grid">
        <div className="signature-card">
          <h3>Responsável</h3>
          <label className="field">
            <span>Nome do responsável</span>
            <input
              value={authorName}
              onChange={(e) => onAuthorNameChange(e.target.value)}
              placeholder="Quem preencheu o checklist"
              disabled={disabled}
              autoComplete="name"
            />
          </label>
          <SignaturePad
            label="Assinatura do responsável"
            value={authorDataUrl}
            onChange={onAuthorDataUrlChange}
            disabled={disabled}
          />
        </div>

        <div className="signature-card">
          <h3>Conferente</h3>
          <label className="field">
            <span>Nome do conferente</span>
            <input
              value={verifierName}
              onChange={(e) => onVerifierNameChange(e.target.value)}
              placeholder="Quem conferiu o checklist"
              disabled={disabled}
              autoComplete="name"
            />
          </label>
          <SignaturePad
            label="Assinatura do conferente"
            value={verifierDataUrl}
            onChange={onVerifierDataUrlChange}
            disabled={disabled}
          />
        </div>
      </div>
    </section>
  );
}
