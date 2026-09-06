import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ContactPicker } from '../components/ContactPicker'
import { ObservationsField } from '../components/ObservationsField'
import { PhotoCapture } from '../components/PhotoCapture'
import {
  SignaturesBlock,
  buildSignature,
  isSignatureComplete,
} from '../components/SignaturesBlock'
import {
  createItems,
  getCachedEmailConfigured,
  prefetchEmailConfigured,
  sendReportEmail,
} from '../email'
import { photosToReportFields } from '../photos'
import {
  clearDraft,
  loadData,
  loadDraft,
  saveDraft,
  saveReport,
  uid,
  type ChecklistDraft,
} from '../storage'
import type { ChecklistItem, ChecklistPhoto, ChecklistReport, Contact, ContactGroup } from '../types'

function readAddressBook(): { contacts: Contact[]; groups: ContactGroup[]; defaultItems: string[] } {
  const data = loadData()
  return {
    contacts: data.contacts,
    groups: data.groups,
    defaultItems: data.defaultItems,
  }
}

function emptyForm(defaultItems: string[]) {
  return {
    title: 'Checklist',
    location: '',
    items: createItems(defaultItems),
    observations: '',
    photos: [] as ChecklistPhoto[],
    selectedGroupIds: [] as string[],
    selectedContactIds: [] as string[],
    customEmail: '',
    authorName: '',
    authorSignatureDataUrl: null as string | null,
    verifierName: '',
    verifierSignatureDataUrl: null as string | null,
  }
}

function formFromDraft(draft: ChecklistDraft) {
  return {
    title: draft.title || 'Checklist',
    location: draft.location || '',
    items: draft.items?.length ? draft.items : [],
    observations: draft.observations || '',
    photos: draft.photos || [],
    selectedGroupIds: draft.selectedGroupIds || [],
    selectedContactIds: draft.selectedContactIds || [],
    customEmail: draft.customEmail || '',
    authorName: draft.authorName || '',
    authorSignatureDataUrl: draft.authorSignatureDataUrl || null,
    verifierName: draft.verifierName || '',
    verifierSignatureDataUrl: draft.verifierSignatureDataUrl || null,
  }
}

export function NewChecklistPage() {
  const navigate = useNavigate()
  const boot = readAddressBook()
  const savedDraft = loadDraft()
  const initialForm = savedDraft ? formFromDraft(savedDraft) : emptyForm(boot.defaultItems)

  const [contacts, setContacts] = useState<Contact[]>(boot.contacts)
  const [groups, setGroups] = useState<ContactGroup[]>(boot.groups)
  const [title, setTitle] = useState(initialForm.title)
  const [location, setLocation] = useState(initialForm.location)
  const [items, setItems] = useState<ChecklistItem[]>(initialForm.items)
  const [newItem, setNewItem] = useState('')
  const [observations, setObservations] = useState(initialForm.observations)
  const [photos, setPhotos] = useState<ChecklistPhoto[]>(initialForm.photos)
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(initialForm.selectedGroupIds)
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>(initialForm.selectedContactIds)
  const [customEmail, setCustomEmail] = useState(initialForm.customEmail)
  const [authorName, setAuthorName] = useState(initialForm.authorName)
  const [authorSignatureDataUrl, setAuthorSignatureDataUrl] = useState<string | null>(
    initialForm.authorSignatureDataUrl,
  )
  const [verifierName, setVerifierName] = useState(initialForm.verifierName)
  const [verifierSignatureDataUrl, setVerifierSignatureDataUrl] = useState<string | null>(
    initialForm.verifierSignatureDataUrl,
  )
  const [feedback, setFeedback] = useState<string | null>(
    savedDraft ? 'Rascunho restaurado deste aparelho.' : null,
  )
  const [sending, setSending] = useState(false)
  const [emailReady, setEmailReady] = useState<boolean | null>(null)

  const authorSignature = buildSignature(authorName, authorSignatureDataUrl)
  const verifierSignature = buildSignature(verifierName, verifierSignatureDataUrl)
  const signaturesReady =
    isSignatureComplete(authorSignature) && isSignatureComplete(verifierSignature)

  useEffect(() => {
    void prefetchEmailConfigured().then((ok) => setEmailReady(ok))
  }, [])

  useEffect(() => {
    function refreshContacts() {
      const next = readAddressBook()
      setContacts(next.contacts)
      setGroups(next.groups)
    }
    refreshContacts()
    window.addEventListener('focus', refreshContacts)
    document.addEventListener('visibilitychange', refreshContacts)
    return () => {
      window.removeEventListener('focus', refreshContacts)
      document.removeEventListener('visibilitychange', refreshContacts)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveDraft({
        title,
        location,
        items,
        observations,
        photos,
        selectedGroupIds,
        selectedContactIds,
        customEmail,
        authorName,
        authorSignatureDataUrl,
        verifierName,
        verifierSignatureDataUrl,
      })
    }, 400)
    return () => window.clearTimeout(timer)
  }, [
    title,
    location,
    items,
    observations,
    photos,
    selectedGroupIds,
    selectedContactIds,
    customEmail,
    authorName,
    authorSignatureDataUrl,
    verifierName,
    verifierSignatureDataUrl,
  ])

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
    setSelectedGroupIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function toggleContact(id: string) {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function collectEmails(): string[] {
    const fromGroups = groups.filter((g) => selectedGroupIds.includes(g.id)).flatMap((g) => g.emails)
    const fromContacts = contacts.filter((c) => selectedContactIds.includes(c.id)).map((c) => c.email)
    const extra = customEmail.trim()
    const all = [...fromGroups, ...fromContacts]
    if (extra) all.push(extra)
    return Array.from(new Set(all.map((e) => e.toLowerCase()).filter((e) => e.includes('@'))))
  }

  function handleSaveDraft() {
    saveDraft({
      title,
      location,
      items,
      observations,
      photos,
      selectedGroupIds,
      selectedContactIds,
      customEmail,
      authorName,
      authorSignatureDataUrl,
      verifierName,
      verifierSignatureDataUrl,
    })
    setFeedback('Rascunho salvo neste aparelho.')
  }

  function handleClearDraft() {
    clearDraft()
    const blank = emptyForm(readAddressBook().defaultItems)
    setTitle(blank.title)
    setLocation(blank.location)
    setItems(blank.items)
    setObservations(blank.observations)
    setPhotos(blank.photos)
    setSelectedGroupIds(blank.selectedGroupIds)
    setSelectedContactIds(blank.selectedContactIds)
    setCustomEmail(blank.customEmail)
    setAuthorName(blank.authorName)
    setAuthorSignatureDataUrl(blank.authorSignatureDataUrl)
    setVerifierName(blank.verifierName)
    setVerifierSignatureDataUrl(blank.verifierSignatureDataUrl)
    setFeedback('Rascunho limpo.')
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

    const author = buildSignature(authorName, authorSignatureDataUrl)
    const verifier = buildSignature(verifierName, verifierSignatureDataUrl)
    if (!isSignatureComplete(author)) {
      setFeedback('Assinatura e nome do responsável são obrigatórios para finalizar.')
      return
    }
    if (!isSignatureComplete(verifier)) {
      setFeedback('Assinatura e nome do conferente são obrigatórios para finalizar.')
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

    const photoFields = photosToReportFields(photos)
    const report: ChecklistReport = {
      id: uid(),
      title: title.trim(),
      location: location.trim(),
      items,
      observations: observations.trim(),
      ...photoFields,
      authorSignature: author,
      verifierSignature: verifier,
      createdAt: new Date().toISOString(),
      sentTo: emails,
    }

    setSending(true)
    setFeedback(
      photos.length
        ? `Enviando checklist com ${photos.length} foto(s) pelo servidor…`
        : 'Enviando checklist pelo servidor…',
    )
    try {
      const result = await sendReportEmail(report)
      saveReport(report)
      clearDraft()
      setFeedback(
        photos.length
          ? `Enviado para ${result.sentTo.join(', ')} com ${photos.length} foto(s) no e-mail.`
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
          Tire fotos, marque os itens e envie. No final, o responsável e o conferente precisam
          assinar. O e-mail sai pelo servidor Task-Flux — sem abrir sua caixa de entrada.
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

      <PhotoCapture photos={photos} onChange={setPhotos} />
      <ObservationsField value={observations} onChange={setObservations} />

      <ContactPicker
        contacts={contacts}
        groups={groups}
        selectedContactIds={selectedContactIds}
        selectedGroupIds={selectedGroupIds}
        onToggleContact={toggleContact}
        onToggleGroup={toggleGroup}
        customEmail={customEmail}
        onCustomEmailChange={setCustomEmail}
      />

      <SignaturesBlock
        authorName={authorName}
        authorDataUrl={authorSignatureDataUrl}
        verifierName={verifierName}
        verifierDataUrl={verifierSignatureDataUrl}
        onAuthorNameChange={setAuthorName}
        onAuthorDataUrlChange={setAuthorSignatureDataUrl}
        onVerifierNameChange={setVerifierName}
        onVerifierDataUrlChange={setVerifierSignatureDataUrl}
        disabled={sending}
      />

      {feedback ? <p className="feedback">{feedback}</p> : null}

      <div className="sticky-actions">
        <button type="button" className="btn ghost wide" onClick={handleSaveDraft} disabled={sending}>
          Salvar rascunho
        </button>
        <button type="button" className="btn ghost wide" onClick={handleClearDraft} disabled={sending}>
          Limpar rascunho
        </button>
        <button
          type="button"
          className="btn primary wide"
          onClick={() => void handleFinish()}
          disabled={sending || emailReady === false || !signaturesReady}
        >
          {sending
            ? 'Enviando…'
            : signaturesReady
              ? 'Finalizar e enviar pelo servidor'
              : 'Assine para finalizar'}
        </button>
      </div>
    </div>
  )
}
