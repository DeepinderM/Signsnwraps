import "server-only";
import { randomBytes } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import { bucket, db, isFirebaseConfigured } from "@/lib/firebase/admin";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_FILES, isAllowedUpload, type UploadedFile } from "@/lib/uploads";

// Upload sessions let a browser put files into uploads/<session>/ (see storage.rules).
// They expire after two hours; files that are never attached to an enquiry should be cleaned up
// with a Cloud Storage lifecycle rule on the uploads/ prefix (e.g. delete after 7 days).

const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const sessions = () => db().collection("uploadSessions");

export async function createUploadSession() {
  if (!isFirebaseConfigured()) throw new Error("Uploads are not available.");
  const id = randomBytes(16).toString("hex");
  await sessions().doc(id).set({ createdAt: Timestamp.now(), expiresAt: Timestamp.fromMillis(Date.now() + SESSION_TTL_MS) });
  return { id, expiresAt: Date.now() + SESSION_TTL_MS };
}

export type ClaimedFile = { name: string; path: string; contentType: string; size: number };

/**
 * Checks files the browser says it uploaded and moves them to enquiries/<id>/.
 * Anything outside the session folder, too big, of the wrong type, or missing is skipped and counted as failed.
 */
export async function claimUploads(session: string, files: UploadedFile[], enquiryId: string) {
  const claimed: ClaimedFile[] = [];
  let failed = 0;
  if (!/^[a-f0-9]{32}$/.test(session) || !files.length) return { claimed, failed: files.length };
  const doc = await sessions().doc(session).get();
  if (!doc.exists) return { claimed, failed: files.length };
  for (const [index, file] of files.slice(0, MAX_UPLOAD_FILES).entries()) {
    try {
      if (!file.path.startsWith(`uploads/${session}/`) || file.path.includes("..")) throw new Error("Bad path");
      const source = bucket().file(file.path);
      const [metadata] = await source.getMetadata();
      const size = Number(metadata.size ?? 0);
      const contentType = metadata.contentType ?? "application/octet-stream";
      const name = String(file.name || file.path.split("/").pop() || "file").slice(0, 200);
      if (!size || size > MAX_UPLOAD_BYTES || !isAllowedUpload(name, contentType)) throw new Error("Rejected file");
      const safe = name.normalize("NFKD").replace(/[^\w.\-]+/g, "_").replace(/^_+/, "").slice(-80) || "file";
      const destination = `enquiries/${enquiryId}/${index + 1}-${safe}`;
      await source.move(destination);
      claimed.push({ name, path: destination, contentType, size });
    } catch (error) {
      console.error("Attachment claim failed", file.path, error);
      failed += 1;
    }
  }
  failed += Math.max(0, files.length - MAX_UPLOAD_FILES);
  await sessions().doc(session).delete().catch(() => undefined);
  return { claimed, failed };
}

/** Reads the uploader's hidden fields from a submitted form. */
export function uploadsFromForm(form: FormData): { session: string; files: UploadedFile[] } {
  const session = String(form.get("uploadSession") ?? "");
  try {
    const parsed = JSON.parse(String(form.get("uploadedFiles") ?? "[]")) as unknown;
    const files = Array.isArray(parsed) ? parsed.filter((item): item is UploadedFile => !!item && typeof item.path === "string" && typeof item.name === "string").slice(0, MAX_UPLOAD_FILES + 5) : [];
    return { session, files };
  } catch {
    return { session, files: [] };
  }
}
