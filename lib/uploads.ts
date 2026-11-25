// client-safe upload rules, shared by the form and the server

export const UPLOAD_KINDS = {
  banner: {
    prefix: "banners",
    types: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" },
    maxBytes: 5 * 1024 * 1024,
    label: "JPG, PNG or WebP, up to 5 MB",
  },
  document: {
    prefix: "documents",
    types: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" },
    maxBytes: 10 * 1024 * 1024,
    label: "JPG, PNG, WebP or PDF, up to 10 MB",
  },
  receipt: {
    prefix: "payments",
    types: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" },
    maxBytes: 5 * 1024 * 1024,
    label: "Photo or PDF, up to 5 MB",
  },
} as const;

export type UploadKind = keyof typeof UPLOAD_KINDS;

// posters, shirt size charts and other race files, per race
export const MAX_EVENT_FILES = 5;

export function isImageKey(key: string) {
  return /\.(jpe?g|png|webp)$/i.test(key);
}

export function checkFile(kind: UploadKind, type: string, size: number): string | null {
  const rule = UPLOAD_KINDS[kind];
  if (!(type in rule.types)) return `That file type isn't allowed. Use ${rule.label}.`;
  if (size <= 0) return "That file is empty.";
  if (size > rule.maxBytes) return `That file is too big. Use ${rule.label}.`;
  return null;
}

// key format: <prefix>/<userId>/<uuid>.<ext>
export function ownsKey(kind: UploadKind, userId: string, key: string) {
  return new RegExp(`^${UPLOAD_KINDS[kind].prefix}/${userId}/[0-9a-f-]{36}\\.[a-z]+$`).test(key);
}
