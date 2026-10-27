import "server-only";
import { randomBytes } from "node:crypto";
import { FieldValue, Timestamp, type DocumentData } from "firebase-admin/firestore";
import { db } from "@/lib/firebase/admin";
import { storeLabel, type StoreId } from "@/lib/staff";
import type { Attribution } from "@/lib/services/crm";

// Quotes and tax invoices created in the admin portal (Firestore `billing`).
// Prices are entered excluding GST; GST (10%) is added per taxable line.
// Each document has an unguessable `token` for the customer's online view (/billing/<token>).

export type BillingKind = "quote" | "invoice";
export type QuoteStatus = "draft" | "sent" | "accepted" | "declined" | "expired" | "invoiced";
export type InvoiceStatus = "draft" | "sent" | "paid" | "void";
/** Roll-priced vinyl details kept with a line so the costing diagram can be shown (to the customer only if showDiagram). */
export type RollDetails = { widthMm: number; heightMm: number; rollWidthMm: number; pricePerM2Cents: number; showDiagram: boolean };
/**
 * A quote/invoice line. `code` is the product code everyone reads (e.g. 3DL-LF-H300-D45-ACR-ALU-PVC), shown to the
 * client and production; `production` is build instructions for the job sheet only (never shown to the client).
 */
export type LineItem = { description: string; qty: number; unitCents: number; gst: boolean; roll?: RollDetails; code?: string; production?: string; acp?: { widthMm: number; heightMm: number; signs?: number; showDiagram?: boolean; panelSet?: string } };
export type BillingCustomer = { name: string; business: string; email: string; phone: string; address: string; abn: string };
export type BillingEvent = { at: number; by: string; text: string };

/**
 * Payment schedule for every job: 40% deposit before production, 40% progress payment before installation,
 * 20% final payment on completion. ("Payment in full" only appears on older, already-paid documents.)
 * A stage is "upcoming" until staff request it, "due" once requested (the first is due straight away), then "paid".
 */
export type StageKey = "full" | "deposit" | "installation" | "completion";
export type PaymentStage = { key: StageKey; label: string; percent: number; amountCents: number; when: string; status: "upcoming" | "due" | "paid"; requestedAt: number; paidAt: number; reference: string };

const stagePlan: Record<"full" | "staged", { key: StageKey; label: string; percent: number; when: string }[]> = {
  full: [{ key: "full", label: "Payment in full", percent: 100, when: "Before work starts" }],
  staged: [
    { key: "deposit", label: "Deposit", percent: 40, when: "Before production" },
    { key: "installation", label: "Progress payment", percent: 40, when: "Before installation" },
    { key: "completion", label: "Final payment", percent: 20, when: "On completion" },
  ],
};

/** Fresh schedule for a total; the last stage absorbs rounding so the stages add up exactly. */
export function buildSchedule(totalCents: number): PaymentStage[] {
  const plan = stagePlan.staged;
  let allocated = 0;
  return plan.map((stage, index) => {
    const amountCents = index === plan.length - 1 ? totalCents - allocated : Math.round((totalCents * stage.percent) / 100);
    allocated += amountCents;
    return { ...stage, amountCents, status: index === 0 ? "due" : "upcoming", requestedAt: 0, paidAt: 0, reference: "" };
  });
}

/** The stage the customer should pay next (requested and unpaid), if any. */
export const nextDueStage = (doc: Pick<BillingDoc, "schedule">) => doc.schedule.find((stage) => stage.status === "due");

/** Where a quote/invoice came from and who raised it (internal only; never on the customer's PDF or page). */
export type BillingOrigin = {
  kind: "enquiry" | "quote" | "account" | "manual";
  /** e.g. "Quote request · Vehicle wraps", "Quote Q-1004", "Customer account", "Created manually" */
  label: string;
  /** Marketing channel of the original lead: utm source/medium, or "Website" / "Direct". */
  channel: string;
  campaign: string;
  landingPage: string;
  createdBy: string; createdByEmail: string; createdByRole: "super" | "store"; createdByStore: StoreId | null;
};

/** Marketing channel for a lead's attribution. */
export function channelFor(attribution: Attribution | undefined) {
  const source = attribution?.utm_source?.trim(), medium = attribution?.utm_medium?.trim();
  if (source) return medium ? `${source} / ${medium}` : source;
  return attribution?.landing_page ? "Website (organic / direct)" : "Not tracked";
}

export type BillingDoc = {
  id: string; kind: BillingKind; number: string; status: QuoteStatus | InvoiceStatus; token: string;
  store: StoreId | null; customer: BillingCustomer; items: LineItem[];
  title: string; notes: string; issueDate: string; dueDate: string;
  subtotalCents: number; gstCents: number; totalCents: number; paidCents: number;
  enquiryId: string; userId: string; fromQuoteId: string; invoiceId: string;
  createdBy: string; createdAt: number; updatedAt: number; sentAt: number; respondedAt: number; paidAt: number;
  history: BillingEvent[];
  origin: BillingOrigin;
  schedule: PaymentStage[];
};

export type BillingSettings = {
  businessName: string; abn: string; address: string; phone: string; email: string; website: string;
  gstRegistered: boolean; quoteValidDays: number; paymentTermsDays: number;
  bankName: string; bsb: string; accountNumber: string; accountName: string;
  quoteTerms: string; invoiceTerms: string;
};

export const quoteStatuses: { value: QuoteStatus; label: string }[] = [
  { value: "draft", label: "Draft" }, { value: "sent", label: "Sent" }, { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" }, { value: "expired", label: "Expired" }, { value: "invoiced", label: "Invoiced" },
];
export const invoiceStatuses: { value: InvoiceStatus; label: string }[] = [
  { value: "draft", label: "Draft" }, { value: "sent", label: "Awaiting payment" }, { value: "paid", label: "Paid" }, { value: "void", label: "Void" },
];
export const statusLabel = (doc: Pick<BillingDoc, "kind" | "status" | "dueDate"> & Partial<Pick<BillingDoc, "paidCents" | "totalCents">>) => {
  if (doc.kind === "invoice" && doc.status === "sent" && isOverdue(doc)) return "Overdue";
  if (doc.kind === "invoice" && doc.status === "sent" && doc.paidCents && doc.totalCents) return `Part paid (${Math.round((doc.paidCents / doc.totalCents) * 100)}%)`;
  return (doc.kind === "quote" ? quoteStatuses : invoiceStatuses).find((item) => item.value === doc.status)?.label ?? doc.status;
};

/** Today's date in Melbourne as YYYY-MM-DD. */
export const todayIso = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne" }).format(new Date());
export const addDays = (iso: string, days: number) => { const date = new Date(`${iso}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10); };
export const isOverdue = (doc: Pick<BillingDoc, "kind" | "status" | "dueDate">) => doc.kind === "invoice" && doc.status === "sent" && !!doc.dueDate && doc.dueDate < todayIso();
/** Draft and sent documents can be edited; accepted, invoiced, paid and void ones are locked. */
export const isEditable = (doc: Pick<BillingDoc, "status"> & Partial<Pick<BillingDoc, "paidCents">>) => (doc.status === "draft" || doc.status === "sent") && !doc.paidCents;
export const formatDate = (iso: string) => iso ? new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`)) : "";

const withSchedule = (sums: ReturnType<typeof totals>) => ({ ...sums, schedule: buildSchedule(sums.totalCents) });

export function totals(items: LineItem[], gstRegistered = true) {
  const subtotalCents = items.reduce((sum, item) => sum + Math.round(item.qty * item.unitCents), 0);
  const gstCents = gstRegistered ? items.reduce((sum, item) => sum + (item.gst ? Math.round(Math.round(item.qty * item.unitCents) * 0.1) : 0), 0) : 0;
  return { subtotalCents, gstCents, totalCents: subtotalCents + gstCents };
}

const billing = () => db().collection("billing");
const settingsDoc = () => db().collection("system").doc("billingSettings");

const defaultSettings: BillingSettings = {
  businessName: "Signsnwraps", abn: "", address: "", phone: "", email: "", website: (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/^https?:\/\//, "").replace(/\/$/, ""),
  gstRegistered: true, quoteValidDays: 30, paymentTermsDays: 14,
  bankName: "", bsb: "", accountNumber: "", accountName: "",
  quoteTerms: "This quote is valid for the period shown. Prices include GST where shown. Work is scheduled once the quote is accepted.",
  invoiceTerms: "Please pay by the due date using the invoice number as your payment reference.",
};

export async function getBillingSettings(): Promise<BillingSettings> {
  const data = (await settingsDoc().get()).data() ?? {};
  return { ...defaultSettings, ...Object.fromEntries(Object.entries(data).filter(([key]) => key in defaultSettings)) } as BillingSettings;
}

export async function saveBillingSettings(settings: BillingSettings, by: string) {
  await settingsDoc().set({ ...settings, updatedBy: by, updatedAt: FieldValue.serverTimestamp() });
}

const millis = (value: unknown) => (value instanceof Timestamp ? value.toMillis() : typeof value === "number" ? value : 0);

function toDoc(id: string, data: DocumentData): BillingDoc {
  return {
    id, kind: data.kind === "invoice" ? "invoice" : "quote", number: data.number ?? "", status: data.status ?? "draft", token: data.token ?? "",
    store: data.store ?? null, customer: { name: "", business: "", email: "", phone: "", address: "", abn: "", ...data.customer }, items: Array.isArray(data.items) ? data.items : [],
    title: data.title ?? "", notes: data.notes ?? "", issueDate: data.issueDate ?? "", dueDate: data.dueDate ?? "",
    subtotalCents: data.subtotalCents ?? 0, gstCents: data.gstCents ?? 0, totalCents: data.totalCents ?? 0, paidCents: data.paidCents ?? 0,
    enquiryId: data.enquiryId ?? "", userId: data.userId ?? "", fromQuoteId: data.fromQuoteId ?? "", invoiceId: data.invoiceId ?? "",
    createdBy: data.createdBy ?? "", createdAt: millis(data.createdAt), updatedAt: millis(data.updatedAt), sentAt: millis(data.sentAt), respondedAt: millis(data.respondedAt), paidAt: millis(data.paidAt),
    history: Array.isArray(data.history) ? data.history : [],
    // Documents created before origins were recorded get a best-effort origin.
    // Older documents without a stored schedule get one from their total (fully paid ones show as paid).
    schedule: Array.isArray(data.schedule) ? data.schedule
      : data.status === "paid" ? [{ key: "full" as const, label: "Payment in full", percent: 100, amountCents: data.totalCents ?? 0, when: "Before work starts", status: "paid" as const, requestedAt: 0, paidAt: millis(data.paidAt), reference: "" }]
      : buildSchedule(data.totalCents ?? 0),
    origin: data.origin ?? { kind: data.fromQuoteId ? "quote" : data.enquiryId ? "enquiry" : data.userId ? "account" : "manual", label: data.fromQuoteId ? "Converted from a quote" : data.enquiryId ? "Website enquiry" : data.userId ? "Customer account" : "Created manually", channel: "Not tracked", campaign: "", landingPage: "", createdBy: data.createdBy ?? "", createdByEmail: "", createdByRole: "super", createdByStore: null },
  };
}

/** Next number for a kind (Q-1001, INV-1001 …), allocated in a transaction so numbers are never reused. */
async function nextNumber(kind: BillingKind) {
  const ref = db().collection("system").doc("billingCounters");
  return db().runTransaction(async (tx) => {
    const current = (await tx.get(ref)).get(kind) ?? 1000;
    tx.set(ref, { [kind]: current + 1 }, { merge: true });
    return `${kind === "quote" ? "Q" : "INV"}-${current + 1}`;
  });
}

const event = (by: string, text: string): BillingEvent => ({ at: Date.now(), by, text });

export type BillingDraft = Pick<BillingDoc, "store" | "customer" | "items" | "title" | "notes" | "issueDate" | "dueDate" | "enquiryId" | "userId">;

export async function createBillingDoc(kind: BillingKind, draft: BillingDraft, by: string, extra: { fromQuoteId?: string; origin: BillingOrigin }) {
  const settings = await getBillingSettings();
  const ref = billing().doc();
  const number = await nextNumber(kind);
  await ref.set({
    // Customer link token: letters and digits only, so it survives copy/paste and PDF line wraps.
    kind, number, status: "draft", token: randomBytes(20).toString("hex"), ...draft, ...withSchedule(totals(draft.items, settings.gstRegistered)), paidCents: 0,
    fromQuoteId: extra.fromQuoteId ?? "", invoiceId: "", createdBy: by, origin: extra.origin, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    history: [event(by, `${kind === "quote" ? "Quote" : "Invoice"} ${number} created (${extra.origin.label}) · managed by ${storeLabel(draft.store)}`)],
  });
  return { id: ref.id, number };
}

export async function updateBillingDoc(id: string, draft: BillingDraft, by: string, previousStore: StoreId | null) {
  const settings = await getBillingSettings();
  const events = [event(by, "Details updated")];
  if (previousStore !== draft.store) events.push({ ...event(by, `Managing store changed from ${storeLabel(previousStore)} to ${storeLabel(draft.store)}`), at: Date.now() + 1 });
  // Only called while nothing has been paid (see isEditable), so the schedule can be rebuilt from the new total.
  await billing().doc(id).update({ ...draft, ...withSchedule(totals(draft.items, settings.gstRegistered)), updatedAt: FieldValue.serverTimestamp(), history: FieldValue.arrayUnion(...events) });
}

export async function setBillingStatus(id: string, changes: Partial<Pick<BillingDoc, "status" | "paidCents" | "invoiceId">> & { sentAt?: boolean; respondedAt?: boolean; paidAt?: boolean }, by: string, text: string) {
  const { sentAt, respondedAt, paidAt, ...rest } = changes;
  await billing().doc(id).update({
    ...rest, ...(sentAt ? { sentAt: FieldValue.serverTimestamp() } : {}), ...(respondedAt ? { respondedAt: FieldValue.serverTimestamp() } : {}), ...(paidAt ? { paidAt: FieldValue.serverTimestamp() } : {}),
    updatedAt: FieldValue.serverTimestamp(), history: FieldValue.arrayUnion(event(by, text)),
  });
}

export async function getBillingDoc(id: string) {
  if (!/^[A-Za-z0-9]{1,40}$/.test(id)) return null;
  const doc = await billing().doc(id).get();
  return doc.exists ? toDoc(doc.id, doc.data()!) : null;
}

export async function getBillingDocByToken(raw: string) {
  const token = decodeURIComponent(raw).trim();
  if (!/^[A-Za-z0-9_-]{20,80}$/.test(token)) return null;
  // Exact match, then (for links pasted with extra text glued on, e.g. "…abc-Or") the length of a real token:
  // 40 for current hex tokens, 32 for older base64url ones.
  for (const candidate of new Set([token, token.slice(0, 40), token.slice(0, 32)])) {
    if (candidate.length < 32) continue;
    const snapshot = await billing().where("token", "==", candidate).limit(1).get();
    if (!snapshot.empty) return toDoc(snapshot.docs[0].id, snapshot.docs[0].data());
  }
  return null;
}

/** Newest first. Store staff get only their store's documents (sorted here to avoid a composite index). */
export async function listBillingDocs(store?: StoreId) {
  const snapshot = store ? await billing().where("store", "==", store).limit(1000).get() : await billing().orderBy("createdAt", "desc").limit(1000).get();
  return snapshot.docs.map((doc) => toDoc(doc.id, doc.data())).sort((a, b) => b.createdAt - a.createdAt);
}

export async function listBillingForEnquiry(enquiryId: string) {
  const snapshot = await billing().where("enquiryId", "==", enquiryId).limit(50).get();
  return snapshot.docs.map((doc) => toDoc(doc.id, doc.data())).sort((a, b) => a.createdAt - b.createdAt);
}

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Updates one payment stage in a transaction (safe against double-recording a card payment):
 * "request" makes an upcoming stage due, "paid" records it, "unpaid" reverses a payment.
 * The invoice becomes "paid" once every stage is paid.
 */
export async function updateStage(id: string, key: StageKey, action: "request" | "paid" | "unpaid", by: string, reference = "") {
  const ref = billing().doc(id);
  return db().runTransaction(async (tx) => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists) return { error: "Not found." };
    const doc = toDoc(snapshot.id, snapshot.data()!);
    const stage = doc.schedule.find((item) => item.key === key);
    if (!stage || doc.kind !== "invoice" || doc.status === "void" || doc.status === "draft" && action !== "request") return { error: "That payment can't be changed." };
    if (action === "paid" && stage.status === "paid") return { ok: "Already recorded.", already: true };
    if (action === "request" && stage.status !== "upcoming") return { error: "That payment has already been requested." };
    if (action === "unpaid" && stage.status !== "paid") return { error: "That payment isn't recorded as paid." };
    const now = Date.now();
    const schedule = doc.schedule.map((item) => item.key !== key ? item
      : action === "request" ? { ...item, status: "due" as const, requestedAt: now }
      : action === "paid" ? { ...item, status: "paid" as const, paidAt: now, reference }
      : { ...item, status: "due" as const, paidAt: 0, reference: "" });
    const paidCents = schedule.filter((item) => item.status === "paid").reduce((sum, item) => sum + item.amountCents, 0);
    const allPaid = schedule.every((item) => item.status === "paid");
    const text = action === "request" ? `${stage.label} (${stage.percent}%, ${money(stage.amountCents)}) requested`
      : action === "paid" ? `${stage.label} (${stage.percent}%, ${money(stage.amountCents)}) paid${reference ? ` · ${reference}` : ""}`
      : `${stage.label} payment reversed`;
    tx.update(ref, {
      schedule, paidCents, status: allPaid ? "paid" : doc.status === "paid" ? "sent" : doc.status,
      ...(allPaid ? { paidAt: FieldValue.serverTimestamp() } : {}),
      updatedAt: FieldValue.serverTimestamp(), history: FieldValue.arrayUnion(event(by, allPaid && action === "paid" ? `${text}. Invoice paid in full` : text)),
    });
    return { ok: text, allPaid, stage, doc };
  });
}
