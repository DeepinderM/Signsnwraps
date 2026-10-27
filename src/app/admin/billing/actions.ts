"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireSuperAdmin, type Admin } from "@/lib/admin-auth";
import {
  addDays, channelFor, createBillingDoc, isEditable, updateStage, type BillingOrigin, type StageKey, getBillingDoc, getBillingSettings, saveBillingSettings, setBillingStatus, todayIso, updateBillingDoc,
  type BillingDoc, type BillingDraft, type BillingKind, type LineItem,
} from "@/lib/billing";
import { addEnquiryNote, getEnquiry } from "@/lib/services/enquiries";
import { isStoreId } from "@/lib/staff";
import { isEmail } from "@/lib/validation";

export type BillingResult = { ok?: string; error?: string } | null;

const who = (admin: Admin) => admin.name || admin.email;
const creator = (admin: Admin) => ({ createdBy: who(admin), createdByEmail: admin.email, createdByRole: admin.role, createdByStore: admin.store });
const canAccess = (admin: Admin, doc: Pick<BillingDoc, "store">) => admin.role === "super" || (!!admin.store && doc.store === admin.store);

function parseItems(raw: string): LineItem[] | null {
  try {
    const items = JSON.parse(raw) as unknown;
    if (!Array.isArray(items) || items.length === 0 || items.length > 100) return null;
    const parsed = items.map((item) => {
      const { description, qty, unitCents, gst, roll } = (item ?? {}) as Record<string, unknown>;
      if (typeof description !== "string" || description.trim().length === 0 || description.length > 2000) return null;
      if (typeof qty !== "number" || !Number.isFinite(qty) || qty <= 0 || qty > 100000) return null;
      if (typeof unitCents !== "number" || !Number.isInteger(unitCents) || Math.abs(unitCents) > 100_000_000) return null;
      const line: LineItem = { description: description.trim(), qty: Math.round(qty * 100) / 100, unitCents, gst: gst !== false };
      const { code, production } = (item ?? {}) as Record<string, unknown>;
      if (typeof code === "string" && code.trim()) line.code = code.trim().toUpperCase().replace(/[^A-Z0-9._/-]+/g, "").slice(0, 80);
      if (typeof production === "string" && production.trim()) line.production = production.trim().slice(0, 2000);
      const { acp } = (item ?? {}) as { acp?: { widthMm?: unknown; heightMm?: unknown; signs?: unknown; showDiagram?: unknown; panelSet?: unknown } };
      if (acp && typeof acp.widthMm === "number" && typeof acp.heightMm === "number" && acp.widthMm > 0 && acp.heightMm > 0 && acp.widthMm <= 30000 && acp.heightMm <= 30000) line.acp = { widthMm: Math.round(acp.widthMm), heightMm: Math.round(acp.heightMm), ...(typeof acp.signs === "number" && acp.signs >= 1 && acp.signs <= 200 ? { signs: Math.round(acp.signs) } : {}), ...(acp.showDiagram === true ? { showDiagram: true } : {}), ...(typeof acp.panelSet === "string" && /^pvc-(10|16|20)-(white|black)$/.test(acp.panelSet) ? { panelSet: acp.panelSet } : {}) };
      if (roll && typeof roll === "object") {
        const { widthMm, heightMm, rollWidthMm, pricePerM2Cents, showDiagram } = roll as Record<string, unknown>;
        const okNumber = (value: unknown, max: number) => typeof value === "number" && Number.isFinite(value) && value > 0 && value <= max;
        if (okNumber(widthMm, 20000) && okNumber(heightMm, 20000) && okNumber(rollWidthMm, 5000) && okNumber(pricePerM2Cents, 10_000_000)) {
          line.roll = { widthMm: Math.round(widthMm as number), heightMm: Math.round(heightMm as number), rollWidthMm: Math.round(rollWidthMm as number), pricePerM2Cents: Math.round(pricePerM2Cents as number), showDiagram: showDiagram === true };
        }
      }
      return line;
    });
    return parsed.every(Boolean) ? (parsed as LineItem[]) : null;
  } catch {
    return null;
  }
}

const isoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
const field = (form: FormData, key: string, max: number) => String(form.get(key) ?? "").trim().slice(0, max);

export async function saveBilling(_: BillingResult, form: FormData): Promise<BillingResult> {
  const admin = await requireAdmin();
  const id = field(form, "id", 40);
  const kind = field(form, "kind", 10) as BillingKind;
  const existing = id ? await getBillingDoc(id) : null;
  if (id && (!existing || !canAccess(admin, existing))) return { error: "This document isn't available to you." };
  if (existing && !isEditable(existing)) return { error: "This document is locked. Convert or duplicate it instead." };
  if (!existing && kind !== "quote" && kind !== "invoice") return { error: "Choose quote or invoice." };

  const items = parseItems(String(form.get("items") ?? ""));
  if (!items) return { error: "Add at least one line with a description, a quantity above 0 and a price." };
  const customer = { name: field(form, "name", 120), business: field(form, "business", 120), email: field(form, "email", 254).toLowerCase(), phone: field(form, "phone", 40), address: field(form, "address", 300), abn: field(form, "abn", 20) };
  if (!customer.name && !customer.business) return { error: "Add the customer's name or business." };
  if (customer.email && !isEmail(customer.email)) return { error: "The customer email doesn't look right." };
  const issueDate = field(form, "issueDate", 10), dueDate = field(form, "dueDate", 10);
  if (!isoDate(issueDate) || !isoDate(dueDate) || dueDate < issueDate) return { error: `Check the dates: the ${kind === "quote" || existing?.kind === "quote" ? "valid-until" : "due"} date can't be before the issue date.` };

  // Store staff always work within their own store; super admins choose (or leave unassigned).
  // Every document belongs to a store so sales can be reported per store.
  const storeRaw = field(form, "store", 40);
  const store = admin.role === "super" ? (isStoreId(storeRaw) ? storeRaw : null) : admin.store;
  if (!store) return { error: "Choose which store is managing this." };
  const enquiryId = existing?.enquiryId ?? field(form, "enquiryId", 40);
  const enquiry = !existing && enquiryId ? await getEnquiry(enquiryId) : null;
  if (!existing && enquiryId && (!enquiry || (admin.role !== "super" && enquiry.store !== admin.store))) return { error: "That enquiry isn't available to you." };
  const draft: BillingDraft = { store, customer, items, title: field(form, "title", 200), notes: field(form, "notes", 3000), issueDate, dueDate, enquiryId, userId: existing?.userId ?? field(form, "userId", 128) };

  if (existing) {
    await updateBillingDoc(existing.id, draft, who(admin), existing.store);
    refresh();
    return { ok: "Saved." };
  }
  const typeLabel = enquiry ? (enquiry.type === "booking" ? "Appointment request" : enquiry.type === "installer" ? "Installer application" : "Quote request") : "";
  const origin: BillingOrigin = {
    kind: enquiry ? "enquiry" : draft.userId ? "account" : "manual",
    label: enquiry ? `${typeLabel} · ${enquiry.service}` : draft.userId ? "Customer account" : "Created manually",
    channel: enquiry ? channelFor(enquiry.attribution) : "Direct (staff)", campaign: enquiry?.attribution?.utm_campaign ?? "", landingPage: enquiry?.attribution?.landing_page ?? "",
    ...creator(admin),
  };
  const created = await createBillingDoc(kind, draft, who(admin), { origin });
  if (enquiryId) await addEnquiryNote(enquiryId, `${kind === "quote" ? "Quote" : "Invoice"} ${created.number} created`, who(admin)).catch(() => undefined);
  redirect(`/admin/billing/${created.id}?created=1`);
}

async function accessible(form: FormData) {
  const admin = await requireAdmin();
  const doc = await getBillingDoc(field(form, "id", 40));
  return { admin, doc: doc && canAccess(admin, doc) ? doc : null };
}

/** Status changes staff make by hand (customer acceptance and card payments also arrive automatically). */
export async function updateBillingStatus(_: BillingResult, form: FormData): Promise<BillingResult> {
  const { admin, doc } = await accessible(form);
  if (!doc) return { error: "This document isn't available to you." };
  const action = field(form, "action", 20);
  const by = who(admin);
  const allowed: Record<string, () => Promise<string>> = doc.kind === "quote" ? {
    accepted: async () => { await setBillingStatus(doc.id, { status: "accepted", respondedAt: true }, by, "Marked accepted"); return "Marked as accepted."; },
    declined: async () => { await setBillingStatus(doc.id, { status: "declined", respondedAt: true }, by, "Marked declined"); return "Marked as declined."; },
    expired: async () => { await setBillingStatus(doc.id, { status: "expired" }, by, "Marked expired"); return "Marked as expired."; },
    reopen: async () => { await setBillingStatus(doc.id, { status: doc.sentAt ? "sent" : "draft" }, by, "Reopened"); return "Reopened."; },
  } : {
    // Payments are recorded per stage (see updatePaymentStage); here only void / un-void.
    void: async () => { await setBillingStatus(doc.id, { status: "void" }, by, "Voided"); return "Invoice voided."; },
    reopen: async () => { await setBillingStatus(doc.id, { status: doc.sentAt ? "sent" : "draft" }, by, "Reopened"); return "Reopened."; },
  };
  const run = allowed[action];
  if (!run) return { error: "That change isn't available." };
  if (action === "reopen" && doc.kind === "quote" && doc.status === "invoiced") return { error: "This quote has already been turned into an invoice." };
  if (action === "void" && doc.paidCents > 0) return { error: "Payments have been received on this invoice. Reverse them first (or refund in Stripe)." };
  const message = await run();
  if (doc.enquiryId && action !== "reopen") await addEnquiryNote(doc.enquiryId, `${doc.kind === "quote" ? "Quote" : "Invoice"} ${doc.number}: ${message.replace(/\.$/, "").toLowerCase()}`, by).catch(() => undefined);
  refresh();
  return { ok: message };
}

/** Turns a quote into a draft invoice with the same customer and lines. */
export async function convertToInvoice(form: FormData) {
  const { admin, doc } = await accessible(form);
  if (!doc || doc.kind !== "quote" || doc.status === "invoiced" || doc.status === "declined") return;
  const settings = await getBillingSettings();
  const issueDate = todayIso();
  // The invoice keeps the quote's lead channel so the sale is credited to the original source.
  const origin: BillingOrigin = { ...doc.origin, kind: "quote", label: `Quote ${doc.number}${doc.origin.kind === "enquiry" ? ` (${doc.origin.label})` : ""}`, ...creator(admin) };
  const created = await createBillingDoc("invoice", { store: doc.store, customer: doc.customer, items: doc.items, title: doc.title, notes: doc.notes, issueDate, dueDate: addDays(issueDate, settings.paymentTermsDays), enquiryId: doc.enquiryId, userId: doc.userId }, who(admin), { fromQuoteId: doc.id, origin });
  await setBillingStatus(doc.id, { status: "invoiced", invoiceId: created.id }, who(admin), `Converted to invoice ${created.number}`);
  if (doc.enquiryId) await addEnquiryNote(doc.enquiryId, `Quote ${doc.number} converted to invoice ${created.number}`, who(admin)).catch(() => undefined);
  redirect(`/admin/billing/${created.id}?created=1`);
}

export async function saveSettings(_: BillingResult, form: FormData): Promise<BillingResult> {
  const admin = await requireSuperAdmin();
  const days = (key: string, fallback: number) => { const value = Number(form.get(key)); return Number.isInteger(value) && value >= 0 && value <= 365 ? value : fallback; };
  const abn = field(form, "abn", 20).replace(/\s+/g, "");
  if (abn && !/^\d{11}$/.test(abn)) return { error: "An ABN is 11 digits." };
  const bsb = field(form, "bsb", 7).replace(/\s+/g, "");
  if (bsb && !/^\d{3}-?\d{3}$/.test(bsb)) return { error: "A BSB is 6 digits, e.g. 063-000." };
  const email = field(form, "email", 254);
  if (email && !isEmail(email)) return { error: "The business email doesn't look right." };
  await saveBillingSettings({
    businessName: field(form, "businessName", 120) || "Signsnwraps", abn: abn.replace(/^(\d{2})(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3 $4"), address: field(form, "address", 300), phone: field(form, "phone", 40), email, website: field(form, "website", 120),
    gstRegistered: form.get("gstRegistered") === "on", quoteValidDays: days("quoteValidDays", 30), paymentTermsDays: days("paymentTermsDays", 14),
    bankName: field(form, "bankName", 80), bsb: bsb.replace(/^(\d{3})-?(\d{3})$/, "$1-$2"), accountNumber: field(form, "accountNumber", 20), accountName: field(form, "accountName", 120),
    quoteTerms: field(form, "quoteTerms", 2000), invoiceTerms: field(form, "invoiceTerms", 2000),
  }, who(admin));
  refresh();
  return { ok: "Business details saved. They'll appear on every quote and invoice." };
}

/** Request, record or reverse one stage of an invoice's payment schedule. */
export async function updatePaymentStage(_: BillingResult, form: FormData): Promise<BillingResult> {
  const { admin, doc } = await accessible(form);
  if (!doc || doc.kind !== "invoice") return { error: "This invoice isn't available to you." };
  const key = field(form, "stage", 20) as StageKey;
  const action = field(form, "action", 10);
  if (!["full", "deposit", "installation", "completion"].includes(key) || !["request", "paid", "unpaid"].includes(action)) return { error: "That change isn't available." };
  if (doc.status === "draft" && action !== "request") return { error: "Send the invoice before recording payments." };
  const reference = field(form, "reference", 80);
  const result = await updateStage(doc.id, key, action as "request" | "paid" | "unpaid", who(admin), action === "paid" ? reference || "Recorded by staff" : "");
  if ("error" in result) return { error: result.error };
  if (doc.enquiryId && !("already" in result)) await addEnquiryNote(doc.enquiryId, `Invoice ${doc.number}: ${result.ok}`, who(admin)).catch(() => undefined);
  refresh();
  return { ok: action === "request" ? `${result.ok}. Use the email box to send the payment request.` : result.ok };
}
