import { CompressedPhoto } from '../types/wishlist';
import firebaseConfig from '../../firebase-applet-config.json';

export function sanitizeText(val: unknown, maxLen = 600): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLen);
}

export function normalizeMemberName(val: unknown): string {
  const cleaned = sanitizeText(val, 60);
  if (!cleaned) return '';
  return cleaned.replace(/\s+/g, ' ').toUpperCase();
}

export function normalizePhoneDigits(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).replace(/\D/g, '').slice(0, 15);
}

/**
 * Derives a non-reversible SHA-256 account ID from normalized phone digits.
 * The raw phone number never leaves the browser or gets persisted in Firestore.
 */
export async function deriveAccountIdFromPhone(rawPhone: string): Promise<string> {
  const digits = normalizePhoneDigits(rawPhone);
  if (digits.length < 7 || digits.length > 15) {
    throw new Error('Ingresa un número de celular válido (entre 7 y 15 dígitos).');
  }
  const canonical = `navidad_secreta_phone_v1:${digits}`;
  const bytes = new TextEncoder().encode(canonical);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `acc_${hex.slice(0, 32)}`;
}

function tokenizeNormalizedName(raw: string): string[] {
  return normalizeMemberName(raw)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((token) => token.length >= 2);
}

export function namesMatchAccount(typedNameRaw: string, storedNameRaw: string): boolean {
  const aTokens = tokenizeNormalizedName(typedNameRaw);
  const bTokens = tokenizeNormalizedName(storedNameRaw);
  if (aTokens.length === 0 || bTokens.length === 0) return false;
  if (aTokens.join(' ') === bTokens.join(' ')) return true;
  // Friendly match: same first name (e.g. "JHONATAN" matches "JHONATAN PEREZ")
  return aTokens[0] === bTokens[0];
}

export function sanitizeGroupCodeInput(val: unknown): string {
  return sanitizeText(val, 40)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, '-')
    .replace(/[^A-Z0-9_-]/g, '')
    .replace(/^[-_]+|[-_]+$/g, '')
    .slice(0, 40);
}

export function normalizeFamilyCode(val: unknown): string {
  const cleaned = sanitizeGroupCodeInput(val);
  if (cleaned.length >= 3) return cleaned;
  return 'NAVIDAD_2026';
}

export function generateGroupCode(groupName: string): string {
  const prefix = sanitizeText(groupName, 40)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 5);
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  const base = prefix.length >= 2 ? prefix : 'NAV';
  return `${base}-${suffix}`;
}

export function buildMemberDocId(familyCode: string, memberName: string): string {
  const cleanName = memberName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
  const base = `${familyCode}_${cleanName || 'MIEMBRO'}`;
  return base.slice(0, 120);
}

export function normalizeHttpUrl(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  let str = String(raw).trim();
  if (!str) return '';

  const embeddedUrl = str.match(/https?:\/\/[^\s<>"{}|\\^`[\]]+/i);
  if (embeddedUrl) {
    str = embeddedUrl[0];
  } else if (/^[a-z0-9-]+(\.[a-z0-9-]+)+([/:?#].*)?$/i.test(str) && !/\s/.test(str)) {
    str = `https://${str}`;
  }

  try {
    const parsed = new URL(str);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    return parsed.href.slice(0, 1000);
  } catch {
    return '';
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatFirebaseError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err || 'Error inesperado');
  const lower = raw.toLowerCase();

  if (lower.includes('quota exceeded for quota metric')) {
    const dbId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId || '(default)';
    return `Se alcanzó la cuota gratuita diaria de lectura de Firestore. Revisa tu consola de Firebase: https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${dbId}/data?openUpgradeDialog=true`;
  }
  if (lower.includes('quota exceeded')) {
    return 'Se alcanzó la cuota gratuita diaria de Firebase Firestore. La cuota se restablece mañana.';
  }
  if (
    lower.includes('operation-not-allowed') ||
    lower.includes('admin-restricted-operation')
  ) {
    return 'Falta activar el acceso "Anónimo" en Authentication > Sign-in method dentro de tu consola de Firebase.';
  }
  if (lower.includes('popup-closed-by-user') || lower.includes('popup_closed')) {
    return 'Se cerró la ventana de acceso antes de terminar.';
  }
  if (lower.includes('unauthorized-domain')) {
    return 'Este dominio aún no está autorizado en Firebase Auth.';
  }
  if (lower.includes('permission-denied') || lower.includes('insufficient permissions')) {
    return 'Permisos insuficientes para realizar esta acción en la base de datos.';
  }
  if (lower.includes('the client is offline') || lower.includes('network')) {
    return 'Sin conexión a internet o problema de red con Firebase.';
  }
  // If JSON FirestoreErrorInfo was thrown, extract its readable error field
  if (raw.startsWith('{') && raw.includes('"operationType"')) {
    try {
      const parsed = JSON.parse(raw) as { error?: string };
      if (parsed.error) return formatFirebaseError(parsed.error);
    } catch {
      // fall through
    }
  }
  return raw;
}

/**
 * Compresses camera / gallery photos strictly under 350KB Data URL
 * so they store cleanly in the isolated wishPhotos Firestore collection.
 */
export async function compressImageFile(
  file: File,
  maxDim = 900,
  quality = 0.72
): Promise<CompressedPhoto> {
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo seleccionado no es una imagen válida.');
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('La imagen supera los 20 MB. Elige una foto más ligera.');
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No se pudo leer la imagen desde tu dispositivo.'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('No se pudo procesar el formato de la imagen.'));
    el.src = dataUrl;
  });

  let { width, height } = img;
  if (width > maxDim || height > maxDim) {
    if (width >= height) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    } else {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Tu navegador no pudo preparar la compresión de imagen.');
  }
  ctx.drawImage(img, 0, 0, width, height);

  let currentQuality = quality;
  let resultDataUrl = canvas.toDataURL('image/jpeg', currentQuality);

  // Ensure strictly below 340,000 chars (Firestore rule limit is 350,000)
  while (resultDataUrl.length > 340_000 && currentQuality > 0.35) {
    currentQuality -= 0.12;
    resultDataUrl = canvas.toDataURL('image/jpeg', currentQuality);
  }

  if (resultDataUrl.length > 345_000) {
    throw new Error('La foto sigue siendo demasiado pesada tras comprimirla. Intenta otra imagen.');
  }

  const approxBytes = Math.round((resultDataUrl.length * 3) / 4);
  const safeBaseName = file.name.replace(/\.[^.]+$/, '') || 'deseo_foto';

  return {
    dataUrl: resultDataUrl,
    fileName: `${safeBaseName}.jpg`,
    sizeBytes: approxBytes,
  };
}
