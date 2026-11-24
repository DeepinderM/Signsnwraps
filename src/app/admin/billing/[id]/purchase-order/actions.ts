"use server";

import { refresh } from "next/cache";
import { requireAdmin, type Admin } from "@/lib/admin-auth";
import { getBillingDoc, getBillingSettings, setBillingStatus, type BillingDoc } from "@/lib/billing";
import { emailMode, sendCustomerEmail, type EmailAttachment } from "@/lib/email";
import { bucket, db } from "@/lib/firebase/admin";
import { renderProductionSheetPdf, renderPurchaseOrderPdf } from "@/lib/po-pdf";
import { getPurchaseOrder, markPurchaseOrderSent, quoteIdFor, savePurchaseOrder, type PoChanges, type PurchaseOrder } from "@/lib/purchase-orders";
import { addEnquiryNote, getEnquiry, type StoredFile } from "@/lib/services/enquiries";
import { isEmail } from "@/lib/validation";
import { vendorDiscount } from "@/lib/vendor-types";
import { getVendor } from "@/lib/vendors";

export type PoResult = { ok?: string; error?: string; at?: number } | null;

const MAX_ATTACH_BYTES = 15 * 1024 * 1024;
const who = (admin: Admin) => admin.name || admin.email;

async function load(id: string) {
  const admin = await requireAdmin();
  const doc = await getBillingDoc(id);
  if (!doc || (admin.role !== "super" && doc.store !== admin.store)) return { admin, doc: null, po: null };
  return { admin, doc, po: await getPurchaseOrder(quoteIdFor(doc)) };
}

/** The form's JSON, checked: recipients are emails, artwork is the job's enquiry files, uploads are this session's staff files. */
async function parse(form: FormData, doc: BillingDoc, po: PurchaseOrder): Promise<PoChanges | { error: string }> {
  let raw: Record<string, unknown>;
  try { raw = JSON.parse(String(form.get("po") ?? "{}")); } catch { return { error: "The purchase order couldn't be read. Reload the page and try again." }; }
  const recipients = [...new Set((Array.isArray(raw.recipients) ? raw.recipients : []).map((value) => String(value).trim().toLowerCase()).filter(Boolean))];
  if (!recipients.length) return { error: "Add at least one email address to send the purchase order to." };
  if (recipients.length > 10) return { error: "Up to 10 recipients." };
  const bad = recipients.find((value) => !isEmail(value));
  if (bad) return { error: `${bad} isn't a valid email address.` };
  const enquiry = doc.enquiryId ? await getEnquiry(doc.enquiryId) : null;
  const enquiryPaths = new Set((enquiry?.files ?? []).map((file) => file.path));
  const artwork = (Array.isArray(raw.artwork) ? raw.artwork : []).map(String).filter((path) => enquiryPaths.has(path));
  // Uploads: files already on the PO, plus new ones from a staff upload session.
  const kept = new Map(po.uploads.map((file) => [file.path, file]));
  const uploads: StoredFile[] = [];
  const session = String(form.get("fileSession") ?? "");
  const sessionOk = /^[a-f0-9]{32}$/.test(session) && (await db().collection("uploadSessions").doc(session).get()).get("staff") === true;
  for (const item of Array.isArray(raw.uploads) ? raw.uploads.slice(0, 10) : []) {
    const path = String((item as { path?: unknown })?.path ?? ""), name = String((item as { name?: unknown })?.name ?? "").slice(0, 160);
    if (kept.has(path)) { uploads.push(kept.get(path)!); continue; }
    if (!sessionOk || !path.startsWith(`staff-uploads/${session}/`) || path.includes("..")) return { error: "One of the uploaded files isn't valid. Remove it and upload it again." };
    const [metadata] = await bucket().file(path).getMetadata().catch(() => [null]);
    if (!metadata) return { error: `${name || "A file"} didn't finish uploading. Remove it and upload it again.` };
    uploads.push({ name: name || path.split("/").pop()!, path, size: Number(metadata.size ?? 0), contentType: metadata.contentType || "application/octet-stream" });
  }
  const lines = (Array.isArray(raw.lines) ? raw.lines : []).map((line) => ({ include: !!(line as { include?: unknown })?.include, note: String((line as { note?: unknown })?.note ?? "") }));
  if (!lines.some((line) => line.include)) return { error: "Tick at least one line to order." };
  const requiredBy = /^\d{4}-\d{2}-\d{2}$/.test(String(raw.requiredBy ?? "")) ? String(raw.requiredBy) : "";
  // The vendor's name and franchise discount come from the vendor list (super admin), never from the form.
  const vendor = await getVendor(String(raw.vendorId ?? po.vendorId));
  if (!vendor || (!vendor.active && vendor.id !== po.vendorId)) return { error: "Choose a vendor from the list." };
  return {
    vendorId: vendor.id, discountPercent: vendorDiscount(vendor, doc.store ?? null), supplier: vendor.name, recipients, ccSelf: !!raw.ccSelf, summary: String(raw.summary ?? "").slice(0, 5000),
    attachProductionSheet: !!raw.attachProductionSheet, includeCustomer: !!raw.includeCustomer, artwork, uploads, requiredBy, lines,
  };
}

export async function savePurchaseOrderDraft(_: PoResult, form: FormData): Promise<PoResult> {
  const { admin, doc, po } = await load(String(form.get("id") ?? ""));
  if (!doc || !po) return { error: "This purchase order isn't available to you." };
  const changes = await parse(form, doc, po);
  if ("error" in changes) return changes;
  await savePurchaseOrder(po.id, changes, who(admin), "Draft saved");
  refresh();
  return { ok: "Draft saved.", at: Date.now() };
}

/** Saves, then emails the PO PDF, the production sheet PDF and the artwork to the recipients (and the sales person, if ticked). */
export async function sendPurchaseOrder(_: PoResult, form: FormData): Promise<PoResult> {
  const { admin, doc, po } = await load(String(form.get("id") ?? ""));
  if (!doc || !po) return { error: "This purchase order isn't available to you." };
  const changes = await parse(form, doc, po);
  if ("error" in changes) return changes;
  await savePurchaseOrder(po.id, changes, who(admin), "Saved before sending");
  const saved = (await getPurchaseOrder(po.id))!;
  const settings = await getBillingSettings();
  const attachments: EmailAttachment[] = [
    { filename: `${saved.number}.pdf`, content: await renderPurchaseOrderPdf(saved, doc.customer, doc.title, settings), contentType: "application/pdf" },
    ...(saved.attachProductionSheet ? [{ filename: `${saved.number}-production-sheet.pdf`, content: await renderProductionSheetPdf(saved, doc.customer, doc.title, settings), contentType: "application/pdf" }] : []),
  ];
  const enquiry = doc.enquiryId ? await getEnquiry(doc.enquiryId) : null;
  const files = [...(enquiry?.files ?? []).filter((file) => saved.artwork.includes(file.path)), ...saved.uploads];
  let total = attachments.reduce((sum, item) => sum + item.content.length, 0);
  for (const file of files) {
    total += file.size;
    if (total > MAX_ATTACH_BYTES) return { error: "The attachments are over 15 MB in total. Untick some artwork (or send large files as a link in the summary)." };
    const [content] = await bucket().file(file.path).download().catch(() => [null]);
    if (!content) return { error: `${file.name} couldn't be read from storage. Untick it and try again.` };
    attachments.push({ filename: file.name, content: new Uint8Array(content), contentType: file.contentType || "application/octet-stream" });
  }
  const to = [...saved.recipients, ...(saved.ccSelf && isEmail(admin.email) && !saved.recipients.includes(admin.email.toLowerCase()) ? [admin.email.toLowerCase()] : [])];
  const ordered = saved.lines.filter((line) => line.include);
  const body = [
    `Hi ${saved.supplier} team,`, "",
    `Please find attached purchase order ${saved.number}${doc.title ? ` for ${doc.title}` : ""}${saved.requiredBy ? `, required by ${new Date(`${saved.requiredBy}T00:00:00`).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}` : ""}.`, "",
    saved.summary.trim(), "",
    // Job details only: no prices or totals go to the vendor.
    `Items (${ordered.length}):`, ...ordered.map((line) => `- ${line.qty} × ${line.description.split("\n")[0]}${line.code ? ` [${line.code}]` : ""}${line.note.trim() ? ` (${line.note.trim()})` : ""}`), "",
    `Attached: purchase order${saved.attachProductionSheet ? ", production sheet" : ""}${files.length ? `, ${files.length} artwork file${files.length === 1 ? "" : "s"}` : ""}.`,
    `Please confirm receipt and the expected completion date, and quote ${saved.number} in all correspondence.`, "",
    "Kind regards,", who(admin), settings.businessName, [settings.phone, settings.email].filter(Boolean).join(" · "),
  ].join("\n");
  const result = await sendCustomerEmail({
    to: to.join(", "), subject: `Purchase order ${saved.number}${doc.title ? `: ${doc.title}` : ""} (${settings.businessName})`, body,
    sentBy: { name: admin.name, email: admin.email }, context: { type: "purchaseOrder", id: saved.id }, attachments,
    files: saved.uploads.map((file) => ({ name: file.name, path: file.path, size: file.size, contentType: file.contentType })),
  });
  if ("error" in result) return { error: result.error };
  await markPurchaseOrderSent(saved.id, who(admin), to, admin.email);
  const note = `Purchase order ${saved.number} ${saved.status === "sent" ? "re-sent" : "sent"} to ${saved.recipients.join(", ")}`;
  await setBillingStatus(doc.id, {}, who(admin), note).catch(() => undefined);
  if (doc.enquiryId) await addEnquiryNote(doc.enquiryId, note, who(admin), "email").catch(() => undefined);
  refresh();
  return { ok: emailMode() === "log" ? `Dev mode: purchase order email to ${to.join(", ")} written to the server log (not sent).` : `Purchase order sent to ${to.join(", ")}.`, at: Date.now() };
}
