import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ContactPicker } from '../components/ContactPicker'
import { ObservationsField } from '../components/ObservationsField'
import { PhotoCapture } from '../components/PhotoCapture'
import {
  createItems,
  getCachedEmailConfigured,
  prefetchEmailConfigured,
  sendReportEmail,
} from '../email'
import { loadData, saveReport, uid } from '../storage'
import type { ChecklistItem, ChecklistReport } from '../types'

export function NewChecklistPage() {
  const navigate = useNavigate()
  const initial = useMemo(() => loadData(), [])
  const [title, setTitle] = useState('Checklist')
  const [location, setLocation] = useState('')
  const [items, setItems] = useState<ChecklistItem[]>(() => createItems(initial.defaultItems))
  const [newItem, setNewItem] = useState('')
  const [observations, setObservations] = useState('')
  const [photoDataUrls, setPhotoDataUrls] = useState<string[]>([])
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([])
  const [customEmail, setCustomEmail] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [emailReady, setEmailReady] = useState<boolean | null>(null)

  useEffect(() => {
    void prefetchEmailConfigured().then((ok) => setEmailReady(ok))
  }, [])

  function toggleItem(id: string) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)))
  }

  function addItem(e: FormEvent) {
    e.preventDefault()
    const label = newItem.trim()
    if (!label) return
    setItems((prev) => [...prev, { id: uid(), label, done: false }])
    setNewItem('')
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  function toggleGroup(id: string) {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function toggleContact(id: string) {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function collectEmails(): string[] {
    const fromGroups = initial.groups
      .filter((g) => selectedGroupIds.includes(g.id))
      .flatMap((g) => g.emails)
    const fromContacts = initial.contacts
      .filter((c) => selectedContactIds.includes(c.id))
      .map((c) => c.email)
    const extra = customEmail.trim()
    const all = [...fromGroups, ...fromContacts]
    if (extra) all.push(extra)
    return Array.from(new Set(all.map((e) => e.toLowerCase()).filter((e) => e.includes('@'))))
  }

  async function handleFinish() {
    const emails = collectEmails()
    if (!title.trim()) {
      setFeedback('Informe um título para o checklist.')
      return
    }
    if (!emails.length) {
      setFeedback('Escolha um contato/grupo cadastrado ou informe o e-mail de destino.')
      return
    }
    if (sending) return

    const ready = emailReady ?? getCachedEmailConfigured()
    if (ready === false) {
      setFeedback(
        'Envio automático desligado: falta RESEND_API_KEY no servidor (EMAIL.md). Sem isso o app não consegue enviar as fotos sem abrir seu e-mail.',
      )
      return
    }

    const report: ChecklistReport = {
      id: uid(),
      title: title.trim(),
      location: location.trim(),
      items,
      observations: observations.trim(),
      photoDataUrls,
      createdAt: new Date().toISOString(),
      sentTo: emails,
    }

    setSending(true)
    setFeedback(
      photoDataUrls.length
        ? `Enviando checklist com ${photoDataUrls.length} foto(s) pelo servidor…`
        : 'Enviando checklist pelo servidor…',
    )
    try {
      const result = await sendReportEmail(report)
      saveReport(report)
      setFeedback(
        photoDataUrls.length
          ? `Enviado para ${result.sentTo.join(', ')} com ${photoDataUrls.length} foto(s) no e-mail.`
          : `Enviado para ${result.sentTo.join(', ')}.`,
      )
      setSending(false)
      setTimeout(() => navigate(`/historico/${report.id}`), 900)
    } catch (error) {
      saveReport(report)
      const message = error instanceof Error ? error.message : 'Não foi possível enviar o e-mail.'
      setFeedback(`Checklist salvo neste aparelho. ${message}`)
      setEmailReady(getCachedEmailConfigured())
      setSending(false)
    }
  }

  return (
    <div className="page form-page">
      <header className="page-intro">
        <h1>Novo checklist</h1>
        <p>
          Tire fotos, marque os itens e envie. O e-mail sai pelo servidor Task-Flux — sem abrir sua
          caixa de entrada — e as fotos aparecem no corpo do relatório.
        </p>
      </header>

      {emailReady === false ? (
        <div className="banner warn" role="status">
          <strong>Envio automático indisponível.</strong>
          <span>
            {' '}
            Configure <code>RESEND_API_KEY</code> no servidor (veja <code>EMAIL.md</code>) para
            mandar as fotos de verdade sem usar o e-mail do celular.
          </span>
        </div>
      ) : null}
      {emailReady === true ? (
        <div className="banner ok" role="status">
          Envio automático ativo: o destinatário recebe o relatório formatado com as fotos.
        </div>
      ) : null}

      <section className="form-block">
        <label className="field">
          <span>Título</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Checklist diário"
          />
        </label>
        <label className="field">
          <span>Veículo / placa</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ex.: ABC1D23 · Fiat Strada"
          />
        </label>
      </section>

      <section className="form-block">
        <div className="section-head">
          <h2>Itens do checklist</h2>
          <p>Inclua o que deseja relatar como conferido (óleo, pneus…).</p>
        </div>
        {items.length === 0 ? (
          <p className="hint">Lista em branco. Adicione abaixo o que deseja conferir.</p>
        ) : (
          <ul className="check-list">
            {items.map((item) => (
              <li key={item.id} className="check-item">
                <label className={`check-row ${item.done ? 'done' : ''}`}>
                  <input type="checkbox" checked={item.done} onChange={() => toggleItem(item.id)} />
                  <span>{item.label}</span>
                </label>
                <button
                  type="button"
                  className="btn-remove-item"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remover item ${item.label}`}
                  title="Remover item"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <form className="inline-add" onSubmit={addItem}>
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="O que mais quer conferir? Ex.: freios, óleo…"
            aria-label="Novo item do checklist"
          />
          <button type="submit" className="btn ghost">
            Adicionar
          </button>
        </form>
      </section>

      <PhotoCapture photoDataUrls={photoDataUrls} onChange={setPhotoDataUrls} />
      <ObservationsField value={observations} onChange={setObservations} />

      <ContactPicker
        contacts={initial.contacts}
        groups={initial.groups}
        selectedContactIds={selectedContactIds}
        selectedGroupIds={selectedGroupIds}
        onToggleContact={toggleContact}
        onToggleGroup={toggleGroup}
        customEmail={customEmail}
        onCustomEmailChange={setCustomEmail}
      />

      {feedback ? <p className="feedback">{feedback}</p> : null}

      <div className="sticky-actions">
        <button
          type="button"
          className="btn primary wide"
          onClick={() => void handleFinish()}
          disabled={sending || emailReady === false}
        >
          {sending ? 'Enviando…' : 'Finalizar e enviar pelo servidor'}
        </button>
      </div>
    </div>
  )
}
