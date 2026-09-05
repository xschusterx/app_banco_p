import { useRef, useState } from 'react'
import { MAX_PHOTOS, compressImageFile } from '../photos'

type Props = {
  photoDataUrls: string[]
  onChange: (urls: string[]) => void
}

export function PhotoCapture({ photoDataUrls, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const remaining = MAX_PHOTOS - photoDataUrls.length

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length || remaining <= 0) return
    setBusy(true)
    setError(null)
    try {
      const files = Array.from(fileList)
        .filter((file) => file.type.startsWith('image/'))
        .slice(0, remaining)
      const compressed: string[] = []
      for (const file of files) {
        compressed.push(await compressImageFile(file))
      }
      if (compressed.length) onChange([...photoDataUrls, ...compressed])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao adicionar foto.')
    } finally {
      setBusy(false)
    }
  }

  function removeAt(index: number) {
    onChange(photoDataUrls.filter((_, i) => i !== index))
  }

  return (
    <section className="photo-block">
      <div className="section-head">
        <h2>Fotos do veículo</h2>
        <p>
          Adicione até {MAX_PHOTOS} fotos (câmera ou galeria). Elas vão anexadas no e-mail quando o
          envio pela API ou o compartilhamento do aparelho estiver disponível.
        </p>
      </div>

      {photoDataUrls.length > 0 ? (
        <ul className="photo-grid">
          {photoDataUrls.map((url, index) => (
            <li key={`photo-${index}`} className="photo-grid-item">
              <img src={url} alt={`Foto ${index + 1} do checklist`} />
              <button
                type="button"
                className="photo-remove"
                onClick={() => removeAt(index)}
                aria-label={`Remover foto ${index + 1}`}
                title="Remover foto"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {remaining > 0 ? (
        <button
          type="button"
          className={photoDataUrls.length ? 'btn ghost wide' : 'photo-empty'}
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {photoDataUrls.length ? (
            busy ? 'Processando…' : `Adicionar foto (${photoDataUrls.length}/${MAX_PHOTOS})`
          ) : (
            <>
              <span className="photo-empty-icon" aria-hidden />
              <span>{busy ? 'Processando…' : 'Abrir câmera ou galeria'}</span>
            </>
          )}
        </button>
      ) : (
        <p className="hint">Limite de {MAX_PHOTOS} fotos atingido.</p>
      )}

      {error ? <p className="feedback error">{error}</p> : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="sr-only"
        onChange={(e) => {
          void handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
    </section>
  )
}
