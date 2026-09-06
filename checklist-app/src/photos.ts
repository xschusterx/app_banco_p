import type { ChecklistPhoto, ChecklistReport } from './types';

/** Limite de fotos por checklist (evita estourar localStorage / API). */
export const MAX_PHOTOS = 20;

/** Lado máximo (px) após compressão. */
const MAX_EDGE = 1280;

/** Qualidade JPEG (0–1). */
const JPEG_QUALITY = 0.72;

/**
 * Redimensiona e comprime a imagem para caber no e-mail e no armazenamento local.
 * Sem isso, fotos de celular (~8–12 MB) falham no JSON da API e no localStorage.
 */
export function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Não foi possível processar a imagem.'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      try {
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Falha ao comprimir a foto.'));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Não foi possível ler a imagem.'));
    };
    img.src = objectUrl;
  });
}

/** Normaliza relatórios antigos (só data URL) para a lista atual com notas. */
export function normalizePhotos(report: {
  photos?: ChecklistPhoto[] | null;
  photoDataUrls?: string[] | null;
  photoDataUrl?: string | null;
}): ChecklistPhoto[] {
  if (Array.isArray(report.photos) && report.photos.length) {
    return report.photos
      .filter(
        (photo) =>
          photo && typeof photo.dataUrl === 'string' && photo.dataUrl.startsWith('data:image/'),
      )
      .map((photo) => ({
        dataUrl: photo.dataUrl,
        note: typeof photo.note === 'string' ? photo.note.trim() : '',
      }));
  }

  const urls: string[] = [];
  if (Array.isArray(report.photoDataUrls) && report.photoDataUrls.length) {
    for (const url of report.photoDataUrls) {
      if (typeof url === 'string' && url.startsWith('data:image/')) urls.push(url);
    }
  } else if (
    typeof report.photoDataUrl === 'string' &&
    report.photoDataUrl.startsWith('data:image/')
  ) {
    urls.push(report.photoDataUrl);
  }

  return urls.map((dataUrl) => ({ dataUrl, note: '' }));
}

/** Só as data URLs — útil para anexos e migração. */
export function normalizePhotoUrls(report: {
  photos?: ChecklistPhoto[] | null;
  photoDataUrls?: string[] | null;
  photoDataUrl?: string | null;
}): string[] {
  return normalizePhotos(report).map((photo) => photo.dataUrl);
}

export function withSyncedPhotoFields<T extends Partial<ChecklistReport>>(
  report: T,
): T & {
  photos: ChecklistPhoto[];
  photoDataUrls: string[];
  photoDataUrl: undefined;
} {
  const photos = normalizePhotos(report);
  return {
    ...report,
    photos,
    photoDataUrls: photos.map((photo) => photo.dataUrl),
    photoDataUrl: undefined,
  };
}

/** Atalho para montar os campos de foto a partir da lista da tela. */
export function photosToReportFields(photos: ChecklistPhoto[]) {
  return withSyncedPhotoFields({ photos });
}
