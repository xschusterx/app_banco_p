import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resend } from 'resend'
import { buildHtmlEmail, buildTextEmail } from './template.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

/** Carrega .env local sem dependência extra (não sobrescreve env já definida). */
function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return
  const text = readFileSync(filePath, 'utf8')
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq <= 0) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

loadEnvFile(join(rootDir, '.env'))

const PORT = Number(process.env.PORT || 8787)
const PLACEHOLDER_KEYS = new Set(['', 're_xxxxxxxx', 'your_api_key', 'changeme'])

function resolveResendApiKey() {
  const raw = String(process.env.RESEND_API_KEY || '').trim()
  if (!raw || PLACEHOLDER_KEYS.has(raw.toLowerCase())) return ''
  // Chave real da Resend começa com re_
  if (!raw.startsWith('re_') || raw.length < 20) return ''
  return raw
}

const RESEND_API_KEY = resolveResendApiKey()
const RESEND_FROM = process.env.RESEND_FROM || 'Task-Flux <onboarding@resend.dev>'
const APP_SEND_TOKEN = process.env.APP_SEND_TOKEN || ''
const MAX_RECIPIENTS = 10
const MAX_PHOTOS = 20
const MAX_PHOTO_CHARS = 4_500_000 // ~3.3 MB em base64 por foto

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const app = express()
app.set('trust proxy', 1)
app.use(cors({ origin: true }))
// Várias fotos comprimidas ainda podem passar de 5 MB no JSON.
app.use(express.json({ limit: '20mb' }))

const sendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de envio. Aguarde alguns minutos e tente de novo.' },
})

function isValidEmail(value) {
  return typeof value === 'string' && EMAIL_RE.test(value.trim()) && value.length <= 254
}

function normalizeEmails(list) {
  if (!Array.isArray(list)) return []
  return Array.from(
    new Set(
      list
        .map((e) => String(e || '').trim().toLowerCase())
        .filter(isValidEmail),
    ),
  ).slice(0, MAX_RECIPIENTS)
}

function extractPhotoBase64(photoDataUrl) {
  if (!photoDataUrl || typeof photoDataUrl !== 'string') return null
  if (photoDataUrl.length > MAX_PHOTO_CHARS) {
    const err = new Error('Uma das fotos é grande demais para anexar no e-mail.')
    err.status = 413
    throw err
  }
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(photoDataUrl)
  if (!match) return null
  return { contentType: match[1], content: match[2] }
}

function collectPhotoDataUrls(body) {
  const fromList = Array.isArray(body?.photoDataUrls) ? body.photoDataUrls : []
  const legacy = body?.photoDataUrl ? [body.photoDataUrl] : []
  return Array.from(new Set([...fromList, ...legacy].filter((u) => typeof u === 'string' && u.startsWith('data:image/')))).slice(
    0,
    MAX_PHOTOS,
  )
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    emailConfigured: Boolean(RESEND_API_KEY),
    from: RESEND_FROM,
  })
})

app.post('/api/send-email', sendLimiter, async (req, res) => {
  try {
    if (!RESEND_API_KEY) {
      return res.status(503).json({
        error:
          'Envio de e-mail não configurado. Defina RESEND_API_KEY no servidor (veja EMAIL.md).',
      })
    }

    if (APP_SEND_TOKEN) {
      const header = req.get('x-app-token') || ''
      if (header !== APP_SEND_TOKEN) {
        return res.status(401).json({ error: 'Token do aplicativo inválido.' })
      }
    }

    const {
      to,
      subject,
      title,
      location,
      items,
      observations,
      createdAt,
      photoDataUrl,
      photoDataUrls,
    } = req.body || {}

    const recipients = normalizeEmails(to)
    if (!recipients.length) {
      return res.status(400).json({ error: 'Informe ao menos um e-mail de destino válido.' })
    }

    const safeTitle = String(title || subject || 'Checklist').trim().slice(0, 120)
    const safeSubject = String(subject || `Checklist: ${safeTitle}`).trim().slice(0, 180)
    const safeLocation = String(location || '').trim().slice(0, 120)
    const safeObservations = String(observations || '').trim().slice(0, 4000)
    const safeCreatedAt = String(createdAt || new Date().toISOString())
    const safeItems = Array.isArray(items)
      ? items.slice(0, 80).map((item) => ({
          label: String(item?.label || '').trim().slice(0, 120),
          done: Boolean(item?.done),
        }))
      : []

    const photoUrls = collectPhotoDataUrls({ photoDataUrl, photoDataUrls })
    const photos = photoUrls.map((url) => extractPhotoBase64(url)).filter(Boolean)

    const report = {
      title: safeTitle,
      location: safeLocation,
      items: safeItems,
      observations: safeObservations,
      createdAt: safeCreatedAt,
      hasPhoto: photos.length > 0,
      photoCount: photos.length,
    }

    const resend = new Resend(RESEND_API_KEY)

    const payload = {
      from: RESEND_FROM,
      to: recipients,
      subject: safeSubject,
      text: buildTextEmail(report),
      html: buildHtmlEmail(report),
    }

    if (photos.length) {
      // contentId = CID para a foto aparecer no corpo do e-mail (não só como anexo).
      payload.attachments = photos.map((photo, index) => {
        const ext = photo.contentType.includes('png') ? 'png' : 'jpg'
        const contentId = `foto${index + 1}`
        return {
          filename: `checklist-foto-${index + 1}.${ext}`,
          content: photo.content,
          contentType: photo.contentType,
          contentId,
        }
      })
      payload.html = buildHtmlEmail({
        ...report,
        inlinePhotoCids: payload.attachments.map((a) => a.contentId),
      })
    }

    const { data, error } = await resend.emails.send(payload)
    if (error) {
      console.error('[send-email] Resend error:', error)
      return res.status(502).json({
        error: error.message || 'Falha ao enviar e-mail pelo provedor.',
      })
    }

    return res.json({ ok: true, id: data?.id || null, sentTo: recipients })
  } catch (error) {
    const status = error.status || 500
    console.error('[send-email]', error)
    return res.status(status).json({
      error: error.message || 'Erro interno ao enviar e-mail.',
    })
  }
})

const releaseDir = join(rootDir, 'release')
const downloadsDir = existsSync(releaseDir) ? releaseDir : join(rootDir, 'dist', 'downloads')

app.get('/downloads', (_req, res) => {
  const files = existsSync(downloadsDir)
    ? [
        existsSync(join(downloadsDir, 'task-flux-1.0.0.apk')) && 'task-flux-1.0.0.apk',
        existsSync(join(downloadsDir, 'task-flux-ios-xcode-1.0.0.zip')) &&
          'task-flux-ios-xcode-1.0.0.zip',
      ].filter(Boolean)
    : []
  const links = files
    .map((name) => `<li><a href="/downloads/${name}">${name}</a></li>`)
    .join('\n')
  res
    .type('html')
    .send(
      `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Task-Flux downloads</title></head><body><h1>Task-Flux</h1><ul>${links || '<li>Nenhum pacote ainda.</li>'}</ul></body></html>`,
    )
})

app.get('/downloads/:file', (req, res, next) => {
  const allowed = new Set(['task-flux-1.0.0.apk', 'task-flux-ios-xcode-1.0.0.zip'])
  const file = String(req.params.file || '')
  if (!allowed.has(file)) return res.status(404).send('Not found')
  const full = join(downloadsDir, file)
  if (!existsSync(full)) return res.status(404).send('Not found')
  if (file.endsWith('.apk')) {
    res.type('application/vnd.android.package-archive')
  }
  return res.download(full, file, (err) => (err ? next(err) : undefined))
})

const distDir = join(rootDir, 'dist')
if (existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get(/^(?!\/api)(?!\/downloads).*/, (_req, res) => {
    res.sendFile(join(distDir, 'index.html'))
  })
} else {
  app.get('/', (_req, res) => {
    res
      .status(200)
      .type('text')
      .send('Task-Flux API. Rode npm run build e reinicie para servir o app.')
  })
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Task-Flux email API on http://0.0.0.0:${PORT}`)
  console.log(`Resend configured: ${Boolean(RESEND_API_KEY)}`)
  if (!RESEND_API_KEY) {
    console.warn('Defina RESEND_API_KEY para habilitar o envio real de e-mails.')
  }
})
