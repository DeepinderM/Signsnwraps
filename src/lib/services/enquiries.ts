import "server-only";
import { FieldValue, type DocumentData } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import { bucket, db, isFirebaseConfigured } from "@/lib/firebase/admin";
import type { Attribution } from "./crm";
import { storeLabel, storeStaffEmails, type StoreId } from "@/lib/staff";
import { claimUploads } from "./uploads";
import type { UploadedFile } from "@/lib/uploads";

// Booking and quote requests from every form on the site, stored in Firestore `enquiries`.
// Attachments go to Cloud Storage under enquiries/{id}/ and are only reachable from the admin page.
// Each enquiry is diverted to one store (`store`) by a super admin; store staff only see their store's.
// `notes` is the internal timeline (staff notes plus logged diverts and status changes); customers never see it.

export type EnquiryType = "booking" | "quote" | "installer";
export type EnquiryStatus = "new" | "contacted" | "booked" | "quoted" | "won" | "lost" | "closed";

export const enquiryStatuses: { value: EnquiryStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "booked", label: "Appointment confirmed" },
  { value: "quoted", label: "Quote sent" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "closed", label: "Closed" },
];

export type EnquiryInput = {
  type: EnquiryType;
  name: string; business?: string; email: string; phone: string;
  service: string; location: string; description: string;
  /** Booking: preferred appointment. */
  date?: string; time?: string;
  /** Quote: extra brief details, e.g. quantity, size, due date, fleet details. */
  details?: Record<string, string>;
  files?: File[];
  /** Files the browser already uploaded to Storage (preferred: no request-size limit). */
  uploads?: { session: string; files: UploadedFile[] };
  attribution?: Attribution;
};

export type StoredFile = { name: string; path: string; contentType: string; size: number };

export type EnquiryNote = { id: string; kind: "note" | "assign" | "status" | "email"; text: string; by: string; at: number };

export type Enquiry = Omit<EnquiryInput, "files"> & { id: string; status: EnquiryStatus; createdAt: number; files: StoredFile[]; filesFailed: number; staffNote: string; store: StoreId | null; assignedAt: number; notes: EnquiryNote[] };

const enquiries = () => db().collection("enquiries");

function safeFileName(name: string) {
  return name.normalize("NFKD").replace(/[^\w.\-]+/g, "_").replace(/^_+/, "").slice(-80) || "file";
}

export async function saveEnquiry(input: EnquiryInput): Promise<{ id: string; files: { name: string; size: number }[]; filesFailed: number }> {
  if (!isFirebaseConfigured()) throw new Error("Enquiry storage is not configured.");
  const ref = enquiries().doc();
  const stored: StoredFile[] = [];
  let filesFailed = 0;
  for (const [index, file] of (input.files ?? []).entries()) {
    const path = `enquiries/${ref.id}/${index + 1}-${safeFileName(file.name)}`;
    try {
      await bucket().file(path).save(Buffer.from(await file.arrayBuffer()), { contentType: file.type || "application/octet-stream", resumable: false });
      stored.push({ name: file.name.slice(0, 200), path, contentType: file.type, size: file.size });
    } catch (error) {
      // Don't lose the enquiry over an attachment; staff can ask the customer to resend.
      console.error("Enquiry attachment upload failed", path, error);
      filesFailed += 1;
    }
  }
  if (input.uploads?.files.length) {
    const result = await claimUploads(input.uploads.session, input.uploads.files, ref.id);
    stored.push(...result.claimed);
    filesFailed += result.failed;
  }
  const { files: _files, uploads: _uploads, ...fields } = input;
  void _files; void _uploads;
  await ref.set({ ...fields, status: "new" satisfies EnquiryStatus, store: null, notes: [], files: stored, filesFailed, staffNote: "", createdAt: FieldValue.serverTimestamp() });
  await notifyStaff(ref.id, input).catch((error) => console.error("Enquiry notification failed", error));
  return { id: ref.id, files: stored.map((file) => ({ name: file.name, size: file.size })), filesFailed };
}

/**
 * Optional email alert via the Firebase "Trigger Email from Firestore" extension, which sends
 * any document added to the `mail` collection. Set ENQUIRY_NOTIFY_EMAIL to turn it on.
 */
async function notifyStaff(id: string, input: EnquiryInput) {
  const to = process.env.ENQUIRY_NOTIFY_EMAIL;
  if (!to) return;
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const what = input.type === "booking" ? `Consultation request · ${input.date} ${input.time}` : input.type === "installer" ? "Installer application" : "Quote request";
  const lines = [
    `${what} — ${input.service}`, "",
    `Name: ${input.name}`, `Business: ${input.business || "—"}`, `Email: ${input.email}`, `Phone: ${input.phone}`, `Location: ${input.location || "—"}`,
    ...Object.entries(input.details ?? {}).filter(([, value]) => value).map(([key, value]) => `${key}: ${value}`),
    "", input.description || "(no description)", "", `Open in admin: ${site}/admin/enquiries/${id}`,
  ];
  await db().collection("mail").add({ to: to.split(",").map((email) => email.trim()).filter(Boolean), replyTo: input.email, message: { subject: `New ${input.type === "booking" ? "booking request" : input.type === "installer" ? "installer application" : "quote request"}: ${input.service} — ${input.name}`, text: lines.join("\n") } });
}

function toEnquiry(id: string, data: DocumentData): Enquiry {
  return {
    id,
    type: data.type === "booking" || data.type === "installer" ? data.type : "quote",
    status: enquiryStatuses.some((item) => item.value === data.status) ? data.status : "new",
    createdAt: typeof data.createdAt?.toMillis === "function" ? data.createdAt.toMillis() : 0,
    name: data.name ?? "", business: data.business ?? "", email: data.email ?? "", phone: data.phone ?? "",
    service: data.service ?? "", location: data.location ?? "", description: data.description ?? "",
    date: data.date ?? "", time: data.time ?? "",
    details: data.details ?? {},
    attribution: data.attribution ?? {},
    files: Array.isArray(data.files) ? data.files : [],
    filesFailed: data.filesFailed ?? 0,
    staffNote: data.staffNote ?? "",
    store: typeof data.store === "string" ? data.store as StoreId : null,
    assignedAt: typeof data.assignedAt?.toMillis === "function" ? data.assignedAt.toMillis() : 0,
    notes: Array.isArray(data.notes) ? (data.notes as EnquiryNote[]).filter((note) => note && typeof note.text === "string").sort((a, b) => a.at - b.at) : [],
  };
}

/** Newest first. With `store`, only that store's enquiries (store staff); sorted here to avoid a composite index. */
export async function listEnquiries(limit = 200, store?: StoreId) {
  if (store) {
    const snapshot = await enquiries().where("store", "==", store).limit(500).get();
    return snapshot.docs.map((doc) => toEnquiry(doc.id, doc.data())).sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  }
  const snapshot = await enquiries().orderBy("createdAt", "desc").limit(limit).get();
  return snapshot.docs.map((doc) => toEnquiry(doc.id, doc.data()));
}

export async function getEnquiry(id: string) {
  const doc = await enquiries().doc(id).get();
  return doc.exists ? toEnquiry(doc.id, doc.data()!) : null;
}

const note = (kind: EnquiryNote["kind"], text: string, by: string): EnquiryNote => ({ id: randomUUID(), kind, text, by, at: Date.now() });

export async function setEnquiryStatus(id: string, status: EnquiryStatus, by: string) {
  const label = enquiryStatuses.find((item) => item.value === status)?.label ?? status;
  await enquiries().doc(id).update({ status, notes: FieldValue.arrayUnion(note("status", `Status set to ${label}`, by)), updatedAt: FieldValue.serverTimestamp() });
}

export async function addEnquiryNote(id: string, text: string, by: string, kind: EnquiryNote["kind"] = "note") {
  await enquiries().doc(id).update({ notes: FieldValue.arrayUnion(note(kind, text, by)), updatedAt: FieldValue.serverTimestamp() });
}

/** Diverts an enquiry to a store (or back to unassigned) and alerts that store's staff. */
export async function assignEnquiry(enquiry: Enquiry, store: StoreId | null, by: string, reason: string) {
  const text = `${store ? `Diverted to ${storeLabel(store)}` : "Moved back to unassigned"}${enquiry.store ? ` (was ${storeLabel(enquiry.store)})` : ""}${reason ? `: ${reason}` : ""}`;
  await enquiries().doc(enquiry.id).update({ store, assignedAt: FieldValue.serverTimestamp(), assignedBy: by, notes: FieldValue.arrayUnion(note("assign", text, by)), updatedAt: FieldValue.serverTimestamp() });
  if (store) await notifyStore(store, enquiry, by, reason).catch((error) => console.error("Store notification failed", error));
}

/** Email alert to the store's staff via the "Trigger Email from Firestore" extension (no-op without it). */
async function notifyStore(store: StoreId, enquiry: Enquiry, by: string, reason: string) {
  const to = await storeStaffEmails(store);
  if (!to.length) return;
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  await db().collection("mail").add({ to, message: {
    subject: `New lead for ${storeLabel(store)}: ${enquiry.service} — ${enquiry.name}`,
    text: [`${by} diverted this ${enquiry.type === "booking" ? "appointment request" : enquiry.type === "installer" ? "installer application" : "quote request"} to ${storeLabel(store)}.`, reason ? `Note: ${reason}` : null, "", `${enquiry.name} · ${enquiry.phone} · ${enquiry.email}`, enquiry.service, "", `Open in admin: ${site}/admin/enquiries/${enquiry.id}`].filter((line) => line !== null).join("\n"),
  } });
}
