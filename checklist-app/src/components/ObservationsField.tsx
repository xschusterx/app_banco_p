import { useSpeechToText } from '../hooks/useSpeechToText';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function ObservationsField({ value, onChange }: Props) {
  const { listening, supported, error, toggle } = useSpeechToText((transcript) => {
    onChange(value ? `${value.trim()} ${transcript}` : transcript);
  });

  return (
    <section className="obs-block">
      <div className="section-head">
        <h2>Observações</h2>
        <p>Digite o relato ou use o microfone para falar o que deseja escrever.</p>
      </div>

      <textarea
        className="textarea"
        rows={6}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Descreva o que encontrou, pendências, recomendações..."
      />

      <div className="obs-actions">
        {supported ? (
          <button
            type="button"
            className={`btn voice ${listening ? 'listening' : ''}`}
            onClick={toggle}
            aria-pressed={listening}
          >
            <span className="mic" aria-hidden />
            {listening ? 'Ouvindo… toque para parar' : 'Falar para escrever'}
          </button>
        ) : (
          <p className="hint">Seu navegador não oferece ditado por voz. Digite as observações normalmente.</p>
        )}
        {error ? <p className="error">{error}</p> : null}
      </div>
    </section>
  );
}
