import { useEffect, useId, useRef, useState } from 'react'
import { MAX_PHOTOS, compressImageFile } from '../photos'
import type { ChecklistPhoto } from '../types'

type Props = {
  photos: ChecklistPhoto[]
  onChange: (photos: ChecklistPhoto[]) => void
}

type PendingNote = {
  dataUrl: string
  indexLabel: string
}

export function PhotoCapture({ photos, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const noteInputRef = useRef<HTMLTextAreaElement>(null)
  const noteFieldId = useId()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingQueue, setPendingQueue] = useState<string[]>([])
  const [draftNote, setDraftNote] = useState('')
  const remaining = MAX_PHOTOS - photos.length
  const pending: PendingNote | null = pendingQueue.length
    ? {
        dataUrl: pendingQueue[0],
        indexLabel: String(photos.length + 1),
      }
    : null

  useEffect(() => {
    if (pending) {
      setDraftNote('')
      const timer = window.setTimeout(() => noteInputRef.current?.focus(), 50)
      return () => window.clearTimeout(timer)
    }
  }, [pending?.dataUrl])

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length || remaining <= 0 || pendingQueue.length) return
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
      if (compressed.length) setPendingQueue(compressed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao adicionar foto.')
    } finally {
      setBusy(false)
    }
  }

  function commitPending(note: string) {
    if (!pendingQueue.length) return
    const [dataUrl, ...rest] = pendingQueue
    onChange([...photos, { dataUrl, note: note.trim() }])
    setPendingQueue(rest)
    setDraftNote('')
  }

  function removeAt(index: number) {
    onChange(photos.filter((_, i) => i !== index))
  }

  function updateNote(index: number, note: string) {
    onChange(photos.map((photo, i) => (i === index ? { ...photo, note } : photo)))
  }

  return (
    <section className="photo-block">
      <div className="section-head">
        <h2>Fotos do veículo</h2>
        <p>
          Adicione até {MAX_PHOTOS} fotos. Depois de cada captura você pode escrever uma observação
          (opcional) — ela vai no e-mail junto com a imagem.
        </p>
      </div>

      {photos.length > 0 ? (
        <ul className="photo-grid photo-grid-notes">
          {photos.map((photo, index) => (
            <li key={`photo-${index}`} className="photo-grid-item has-note">
              <div className="photo-thumb">
                <img src={photo.dataUrl} alt={`Foto ${index + 1} do checklist`} />
                <button
                  type="button"
                  className="photo-remove"
                  onClick={() => removeAt(index)}
                  aria-label={`Remover foto ${index + 1}`}
                  title="Remover foto"
                >
                  ×
                </button>
              </div>
              <label className="photo-note-field">
                <span>Observação da foto {index + 1}</span>
                <textarea
                  rows={2}
                  value={photo.note}
                  onChange={(e) => updateNote(index, e.target.value)}
                  placeholder="Opcional — ex.: amassado na porta direita"
                  maxLength={500}
                />
              </label>
            </li>
          ))}
        </ul>
      ) : null}

      {remaining > 0 && !pending ? (
        <button
          type="button"
          className={photos.length ? 'btn ghost wide' : 'photo-empty'}
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {photos.length ? (
            busy ? 'Processando…' : `Adicionar foto (${photos.length}/${MAX_PHOTOS})`
          ) : (
            <>
              <span className="photo-empty-icon" aria-hidden />
              <span>{busy ? 'Processando…' : 'Abrir câmera ou galeria'}</span>
            </>
          )}
        </button>
      ) : null}

      {!pending && remaining <= 0 ? (
        <p className="hint">Limite de {MAX_PHOTOS} fotos atingido.</p>
      ) : null}

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

      {pending ? (
        <div className="photo-note-modal" role="dialog" aria-modal="true" aria-labelledby={noteFieldId}>
          <div className="photo-note-card">
            <div className="photo-note-preview">
              <img src={pending.dataUrl} alt={`Prévia da foto ${pending.indexLabel}`} />
            </div>
            <h3 id={noteFieldId}>Observação desta foto?</h3>
            <p>Opcional. Se quiser, descreva o que a foto mostra — aparece no e-mail sob a imagem.</p>
            <textarea
              ref={noteInputRef}
              rows={3}
              value={draftNote}
              onChange={(e) => setDraftNote(e.target.value)}
              placeholder="Ex.: risco no para-choque dianteiro"
              maxLength={500}
            />
            <div className="photo-note-actions">
              <button type="button" className="btn ghost" onClick={() => commitPending('')}>
                Pular
              </button>
              <button type="button" className="btn primary" onClick={() => commitPending(draftNote)}>
                Salvar observação
              </button>
            </div>
            {pendingQueue.length > 1 ? (
              <p className="hint">Ainda há {pendingQueue.length - 1} foto(s) na fila.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}
