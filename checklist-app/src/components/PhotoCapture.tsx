import { useRef } from 'react';

type Props = {
  photoDataUrl: string | null;
  onChange: (dataUrl: string | null) => void;
};

export function PhotoCapture({ photoDataUrl, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onChange(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <section className="photo-block">
      <div className="section-head">
        <h2>Foto do local</h2>
        <p>Tire uma foto ou escolha da galeria para anexar ao relato.</p>
      </div>

      {photoDataUrl ? (
        <div className="photo-preview">
          <img src={photoDataUrl} alt="Foto capturada do checklist" />
          <div className="photo-actions">
            <button type="button" className="btn ghost" onClick={() => inputRef.current?.click()}>
              Trocar foto
            </button>
            <button type="button" className="btn ghost danger" onClick={() => onChange(null)}>
              Remover
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="photo-empty" onClick={() => inputRef.current?.click()}>
          <span className="photo-empty-icon" aria-hidden />
          <span>Abrir câmera</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </section>
  );
}
