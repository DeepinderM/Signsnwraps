// Customer attachments (booking / quote forms). Shared by the browser uploader and the server checks.
// Files go straight from the browser to Cloud Storage (uploads/<session>/…), so they don't count
// against the hosting request-size limit; the server then moves them under enquiries/<id>/.

export const MAX_UPLOAD_FILES = 5;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const UPLOAD_ACCEPT = "image/*,.heic,.heif,.pdf,.ai,.eps,.svg";
export const UPLOAD_HINT = "JPG, PNG, HEIC, PDF, AI, EPS or SVG · up to 5 files, 10 MB each";

const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif", "image/svg+xml", "application/pdf", "application/postscript", "application/illustrator"];
const allowedExtensions = ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif", "svg", "pdf", "ai", "eps"];

export const fileExtension = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

/** Type check by MIME type, or by extension when the browser doesn't know the type (common for .ai/.eps/.heic). */
export function isAllowedUpload(name: string, type: string) {
  const ext = fileExtension(name);
  if (!allowedExtensions.includes(ext)) return false;
  return !type || type === "application/octet-stream" || allowedTypes.includes(type);
}

/** Content type to store: the browser's, or one inferred from the extension. */
export function uploadContentType(name: string, type: string) {
  if (type && type !== "application/octet-stream") return type;
  return ({ heic: "image/heic", heif: "image/heif", ai: "application/postscript", eps: "application/postscript", pdf: "application/pdf", svg: "image/svg+xml" } as Record<string, string>)[fileExtension(name)] ?? "application/octet-stream";
}

export const formatBytes = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export type UploadedFile = { path: string; name: string };
