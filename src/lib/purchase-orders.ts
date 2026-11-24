import "server-only";
import { FieldValue, Timestamp, type DocumentData } from "firebase-admin/firestore";
import { db } from "@/lib/firebase/admin";
import type { BillingDoc, LineItem } from "@/lib/billing";
import type { StoredFile } from "@/lib/services/enquiries";
import type { StoreId } from "@/lib/staff";
import type { ChatSide } from "@/lib/po-chat-types";
import { DEFAULT_PO_RECIPIENT, DEFAULT_SUPPLIER, DEFAULT_VENDOR_ID, isProgressStage, progressLabel, vendorDiscount, type ProgressEvent, type ProgressStage } from "@/lib/vendor-types";
import { getVendor } from "@/lib/vendors";

// Purchase orders to the manufacturer (Quick Signage by default) for an accepted quote. One PO per quote, stored
// under the quote's id so the quote and the invoice made from it (fromQuoteId) both find it. A draft is made when the
// quote is accepted; the sales person ticks the lines to order (e.g. lift / access hire is paid by Signs N Wraps, so it
// stays off), checks the summary and recipients, picks the artwork and sends it with the production sheet.

export { DEFAULT_PO_RECIPIENT, DEFAULT_SUPPLIER } from "@/lib/vendor-types";
/** Site costs Signs N Wraps pays for itself (lift / access hire, permits…): unticked on a new PO; the sales person can still tick them. */
const NOT_ORDERED = /\b(lift|access|scaffold\w*|ewp|boom|scissor|cherry ?picker|crane|permits?|traffic|parking)\b/i;

export type PoLine = { description: string; qty: number; unitCents: number; code: string; production: string; include: boolean; note: string; acp?: LineItem["acp"]; roll?: LineItem["roll"] };
export type PoStatus = "draft" | "sent";
export type PoEvent = { at: number; by: string; text: string };
export type PurchaseOrder = {
  id: string; number: string; quoteId: string; quoteNumber: string; invoiceId: string; invoiceNumber: string; store: StoreId | null; status: PoStatus;
  /** The vendor the PO goes to and its franchise discount for this store (set from the vendor list, not by sales). */
  vendorId: string; discountPercent: number;
  supplier: string; recipients: string[]; ccSelf: boolean; summary: string; lines: PoLine[];
  /** What goes with the email: the production sheet PDF, customer/site contact details, the job's artwork files. */
  attachProductionSheet: boolean; includeCustomer: boolean;
  /** Artwork from the enquiry (by storage path) that is ticked to send; plus files staff uploaded for this PO. */
  artwork: string[]; uploads: StoredFile[];
  requiredBy: string; sentAt: number; sentBy: string; sentByEmail: string; history: PoEvent[]; createdAt: number;
  /** Where the job is, as updated by the vendor ("new" until they open it), with every update. */
  progress: ProgressStage; progressAt: number; progressLog: ProgressEvent[];
  /** Chat between vendor and staff: last message and when each side last read it (see po-chat.ts). */
  lastMessageAt: number; lastMessageSide: ChatSide | ""; staffReadAt: number; vendorReadAt: number; chatCount: number;
};

const orders = () => db().collection("purchaseOrders");
const millis = (value: unknown) => (value instanceof Timestamp ? value.toMillis() : typeof value === "number" ? value : 0);

function toPo(id: string, data: DocumentData): PurchaseOrder {
  return {
    id, number: data.number ?? "", quoteId: data.quoteId ?? id, quoteNumber: data.quoteNumber ?? "", invoiceId: data.invoiceId ?? "", invoiceNumber: data.invoiceNumber ?? "",
    store: data.store ?? null, status: data.status === "sent" ? "sent" : "draft", vendorId: data.vendorId ?? DEFAULT_VENDOR_ID, discountPercent: typeof data.discountPercent === "number" ? data.discountPercent : 0, supplier: data.supplier ?? DEFAULT_SUPPLIER,
    recipients: Array.isArray(data.recipients) ? data.recipients : [DEFAULT_PO_RECIPIENT], ccSelf: data.ccSelf !== false, summary: data.summary ?? "",
    lines: Array.isArray(data.lines) ? data.lines.map((line: PoLine) => ({ ...line, unitCents: Number(line.unitCents) || 0 })) : [], attachProductionSheet: data.attachProductionSheet !== false, includeCustomer: data.includeCustomer !== false,
    artwork: Array.isArray(data.artwork) ? data.artwork : [], uploads: Array.isArray(data.uploads) ? data.uploads : [], requiredBy: data.requiredBy ?? "",
    sentAt: millis(data.sentAt), sentBy: data.sentBy ?? "", sentByEmail: data.sentByEmail ?? "", history: Array.isArray(data.history) ? data.history : [], createdAt: millis(data.createdAt),
    progress: isProgressStage(data.progress) ? data.progress : "new", progressAt: millis(data.progressAt), progressLog: Array.isArray(data.progressLog) ? data.progressLog : [],
    lastMessageAt: Number(data.lastMessageAt) || 0, lastMessageSide: data.lastMessageSide === "vendor" || data.lastMessageSide === "staff" ? data.lastMessageSide : "", staffReadAt: Number(data.staffReadAt) || 0, vendorReadAt: Number(data.vendorReadAt) || 0, chatCount: Number(data.chatCount) || 0,
  };
}

/** The quote a document belongs to: itself for a quote, the source quote for an invoice ("" for a stand-alone invoice). */
export const quoteIdFor = (doc: Pick<BillingDoc, "id" | "kind" | "fromQuoteId">) => (doc.kind === "quote" ? doc.id : doc.fromQuoteId || doc.id);

export async function getPurchaseOrder(quoteId: string) {
  if (!quoteId) return null;
  const snap = await orders().doc(quoteId).get();
  return snap.exists ? toPo(snap.id, snap.data()!) : null;
}

/** Project summary for the manufacturer: what the job is, for whom, and the notes on the quote. */
export function defaultSummary(doc: BillingDoc) {
  const lines = doc.items.filter((item) => !NOT_ORDERED.test(item.description.split("\n")[0]));
  return [
    `Project: ${doc.title || `Job for ${doc.customer.business || doc.customer.name}`}`,
    `Client: ${doc.customer.business || doc.customer.name}${doc.customer.address ? ` · Site: ${doc.customer.address}` : ""}`,
    "",
    "Scope:",
    ...lines.map((item) => `- ${Number(item.qty)} × ${item.description.split("\n")[0]}`),
    ...(doc.notes.trim() ? ["", `Notes: ${doc.notes.trim()}`] : []),
  ].join("\n");
}

async function nextPoNumber() {
  const ref = db().collection("system").doc("billingCounters");
  return db().runTransaction(async (tx) => {
    const current = (await tx.get(ref)).get("purchaseOrder") ?? 1000;
    tx.set(ref, { purchaseOrder: current + 1 }, { merge: true });
    return `PO-${current + 1}`;
  });
}

/**
 * The PO for a quote (or the invoice made from it), creating the draft if there isn't one yet: every line is
 * listed, ticked unless it's something Signs N Wraps pays for itself (lift, access, permits, installation…).
 */
export async function ensurePurchaseOrder(doc: BillingDoc, by: string, invoice?: { id: string; number: string }) {
  const quoteId = quoteIdFor(doc);
  const existing = await getPurchaseOrder(quoteId);
  if (existing) {
    const changes: Record<string, unknown> = {};
    if (invoice && !existing.invoiceId) Object.assign(changes, { invoiceId: invoice.id, invoiceNumber: invoice.number });
    // POs drafted before prices were added: take the prices from the (locked) quote lines.
    if (existing.lines.some((line) => !line.unitCents) && existing.lines.length === doc.items.length) changes.lines = existing.lines.map((line, index) => ({ ...line, unitCents: line.unitCents || doc.items[index].unitCents }));
    if (!Object.keys(changes).length) return existing;
    await orders().doc(quoteId).update(changes);
    return { ...existing, ...changes } as PurchaseOrder;
  }
  const number = await nextPoNumber();
  const vendor = await getVendor(DEFAULT_VENDOR_ID);
  const lines: PoLine[] = doc.items.map((item) => ({
    description: item.description, qty: Number(item.qty), unitCents: item.unitCents, code: item.code ?? "", production: item.production ?? "", include: !NOT_ORDERED.test(item.description.split("\n")[0]), note: "",
    ...(item.acp ? { acp: item.acp } : {}), ...(item.roll ? { roll: item.roll } : {}),
  }));
  const data = {
    number, quoteId, quoteNumber: doc.kind === "quote" ? doc.number : "", invoiceId: invoice?.id ?? (doc.kind === "invoice" ? doc.id : ""), invoiceNumber: invoice?.number ?? (doc.kind === "invoice" ? doc.number : ""),
    store: doc.store ?? null, status: "draft", vendorId: vendor?.id ?? DEFAULT_VENDOR_ID, discountPercent: vendor ? vendorDiscount(vendor, doc.store ?? null) : 0,
    supplier: vendor?.name ?? DEFAULT_SUPPLIER, recipients: vendor?.emails.length ? vendor.emails : [DEFAULT_PO_RECIPIENT], ccSelf: true, summary: defaultSummary(doc), lines,
    attachProductionSheet: true, includeCustomer: true, artwork: [], uploads: [], requiredBy: "", sentAt: 0, sentBy: "", sentByEmail: "", progress: "new", progressAt: 0, progressLog: [],
    history: [{ at: Date.now(), by, text: `Purchase order ${number} drafted from ${doc.kind === "quote" ? "quote" : "invoice"} ${doc.number}` }], createdAt: FieldValue.serverTimestamp(),
  };
  await orders().doc(quoteId).set(data);
  return toPo(quoteId, { ...data, createdAt: Date.now() });
}

export type PoChanges = Pick<PurchaseOrder, "vendorId" | "discountPercent" | "supplier" | "recipients" | "ccSelf" | "summary" | "attachProductionSheet" | "includeCustomer" | "artwork" | "uploads" | "requiredBy"> & { lines: Pick<PoLine, "include" | "note">[] };

export async function savePurchaseOrder(quoteId: string, changes: PoChanges, by: string, text = "Details updated") {
  await db().runTransaction(async (tx) => {
    const ref = orders().doc(quoteId), snap = await tx.get(ref);
    if (!snap.exists) throw new Error("Purchase order not found");
    const current = toPo(snap.id, snap.data()!);
    const lines = current.lines.map((line, index) => ({ ...line, include: changes.lines[index]?.include ?? line.include, note: (changes.lines[index]?.note ?? line.note).slice(0, 500) }));
    tx.update(ref, { ...changes, lines, updatedAt: FieldValue.serverTimestamp(), history: FieldValue.arrayUnion({ at: Date.now(), by, text }) });
  });
}

export async function markPurchaseOrderSent(quoteId: string, by: string, to: string[], byEmail = "") {
  await orders().doc(quoteId).update({ status: "sent", sentAt: FieldValue.serverTimestamp(), sentBy: by, sentByEmail: byEmail, history: FieldValue.arrayUnion({ at: Date.now(), by, text: `Sent to ${to.join(", ")}` }) });
}

/** A PO can be raised once the job is going ahead: an accepted (or invoiced) quote, or a live invoice. */
export const canRaisePurchaseOrder = (doc: Pick<BillingDoc, "kind" | "status">) => (doc.kind === "quote" ? doc.status === "accepted" || doc.status === "invoiced" : doc.status !== "void");

/** Purchase orders sent to a vendor, newest first (drafts are never shown to vendors). */
export async function listVendorJobs(vendorId: string) {
  const snap = await orders().where("vendorId", "==", vendorId).where("status", "==", "sent").get();
  return snap.docs.map((doc) => toPo(doc.id, doc.data())).sort((a, b) => b.sentAt - a.sentAt);
}

/** The vendor moves the job to a stage (with an optional note); staff see it on the PO and the quote/invoice history. */
export async function updatePoProgress(quoteId: string, stage: ProgressStage, note: string, by: string) {
  const at = Date.now(), clean = note.trim().slice(0, 1000);
  await orders().doc(quoteId).update({
    progress: stage, progressAt: at, progressLog: FieldValue.arrayUnion({ stage, note: clean, at, by }),
    history: FieldValue.arrayUnion({ at, by, text: `Progress: ${progressLabel(stage)}${clean ? ` (${clean})` : ""}` }),
  });
}

/** Every purchase order (or one store's), newest first: drafts by when they were made, sent ones by when they were sent. */
export async function listPurchaseOrders(store?: StoreId) {
  const snap = await (store ? orders().where("store", "==", store) : orders()).get();
  return snap.docs.map((doc) => toPo(doc.id, doc.data())).sort((a, b) => (b.sentAt || b.createdAt) - (a.sentAt || a.createdAt));
}
