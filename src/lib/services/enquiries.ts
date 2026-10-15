import "server-only";
import { FieldValue, type DocumentData } from "firebase-admin/firestore";
import { getDownloadURL } from "firebase-admin/storage";
import { bucket, db, isFirebaseConfigured } from "@/lib/firebase/admin";
import type { Attribution } from "./crm";

// Booking and quote requests from every form on the site, stored in Firestore `enquiries`.
// Attachments go to Cloud Storage under enquiries/{id}/ and are only reachable from the admin page.

export type EnquiryType = "booking" | "quote";
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
  attribution?: Attribution;
};

export type StoredFile = { name: string; path: string; contentType: string; size: number };

export type Enquiry = Omit<EnquiryInput, "files"> & { id: string; status: EnquiryStatus; createdAt: number; files: StoredFile[]; filesFailed: number; staffNote: string };

const enquiries = () => db().collection("enquiries");

function safeFileName(name: string) {
  return name.normalize("NFKD").replace(/[^\w.\-]+/g, "_").replace(/^_+/, "").slice(-80) || "file";
}

export async function saveEnquiry(input: EnquiryInput): Promise<{ id: string }> {
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
  const { files: _files, ...fields } = input;
  void _files;
  await ref.set({ ...fields, status: "new" satisfies EnquiryStatus, files: stored, filesFailed, staffNote: "", createdAt: FieldValue.serverTimestamp() });
  await notifyStaff(ref.id, input).catch((error) => console.error("Enquiry notification failed", error));
  return { id: ref.id };
}

/**
 * Optional email alert via the Firebase "Trigger Email from Firestore" extension, which sends
 * any document added to the `mail` collection. Set ENQUIRY_NOTIFY_EMAIL to turn it on.
 */
async function notifyStaff(id: string, input: EnquiryInput) {
  const to = process.env.ENQUIRY_NOTIFY_EMAIL;
  if (!to) return;
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const what = input.type === "booking" ? `Consultation request · ${input.date} ${input.time}` : "Quote request";
  const lines = [
    `${what} — ${input.service}`, "",
    `Name: ${input.name}`, `Business: ${input.business || "—"}`, `Email: ${input.email}`, `Phone: ${input.phone}`, `Location: ${input.location || "—"}`,
    ...Object.entries(input.details ?? {}).filter(([, value]) => value).map(([key, value]) => `${key}: ${value}`),
    "", input.description || "(no description)", "", `Open in admin: ${site}/admin/enquiries/${id}`,
  ];
  await db().collection("mail").add({ to: to.split(",").map((email) => email.trim()).filter(Boolean), replyTo: input.email, message: { subject: `New ${input.type === "booking" ? "booking" : "quote"} request: ${input.service} — ${input.name}`, text: lines.join("\n") } });
}

function toEnquiry(id: string, data: DocumentData): Enquiry {
  return {
    id,
    type: data.type === "booking" ? "booking" : "quote",
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
  };
}

export async function listEnquiries(limit = 200) {
  const snapshot = await enquiries().orderBy("createdAt", "desc").limit(limit).get();
  return snapshot.docs.map((doc) => toEnquiry(doc.id, doc.data()));
}

export async function getEnquiry(id: string) {
  const doc = await enquiries().doc(id).get();
  return doc.exists ? toEnquiry(doc.id, doc.data()!) : null;
}

export async function updateEnquiry(id: string, changes: { status: EnquiryStatus; staffNote: string }) {
  await enquiries().doc(id).update({ ...changes, updatedAt: FieldValue.serverTimestamp() });
}

/** Download link for an attachment (admin pages only). */
export async function attachmentUrl(file: StoredFile) {
  return getDownloadURL(bucket().file(file.path));
}
