import type { ChecklistSignature } from './types';

export function buildSignature(name: string, dataUrl: string | null): ChecklistSignature | null {
  const trimmed = name.trim();
  if (!trimmed || !dataUrl || !dataUrl.startsWith('data:image/')) return null;
  return {
    name: trimmed.slice(0, 120),
    dataUrl,
    signedAt: new Date().toISOString(),
  };
}

export function isSignatureComplete(signature: ChecklistSignature | null | undefined): boolean {
  return Boolean(
    signature &&
      signature.name.trim() &&
      typeof signature.dataUrl === 'string' &&
      signature.dataUrl.startsWith('data:image/') &&
      signature.dataUrl.length > 80,
  );
}
