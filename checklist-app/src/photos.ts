/** Limite de fotos por checklist (evita estourar localStorage / API). */
export const MAX_PHOTOS = 5

/** Lado máximo (px) após compressão. */
const MAX_EDGE = 1280

/** Qualidade JPEG (0–1). */
const JPEG_QUALITY = 0.72

/**
 * Redimensiona e comprime a imagem para caber no e-mail e no armazenamento local.
 * Sem isso, fotos de celular (~8–12 MB) falham no JSON da API e no localStorage.
 */
export function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height))
      const width = Math.max(1, Math.round(img.width * scale))
      const height = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Não foi possível processar a imagem.'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      try {
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Falha ao comprimir a foto.'))
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Não foi possível ler a imagem.'))
    }
    img.src = objectUrl
  })
}

/** Normaliza relatórios antigos (1 foto) para a lista atual. */
export function normalizePhotoUrls(report: {
  photoDataUrls?: string[] | null
  photoDataUrl?: string | null
}): string[] {
  if (Array.isArray(report.photoDataUrls) && report.photoDataUrls.length) {
    return report.photoDataUrls.filter((url) => typeof url === 'string' && url.startsWith('data:image/'))
  }
  if (typeof report.photoDataUrl === 'string' && report.photoDataUrl.startsWith('data:image/')) {
    return [report.photoDataUrl]
  }
  return []
}
