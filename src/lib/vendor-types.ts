import type { StoreId } from "@/lib/staff";

// Client-safe vendor types and pricing helpers (shared by the PO form, the server and the PDFs).

export const DEFAULT_PO_RECIPIENT = "leads@quicksignage.com.au";
export const DEFAULT_SUPPLIER = "Quick Signage";
export const DEFAULT_VENDOR_ID = "quick-signage";

/** emails: where POs are sent. loginEmails: people who can sign in to the vendor dashboard (verified emails). */
export type Vendor = { id: string; name: string; emails: string[]; loginEmails: string[]; discountPercent: number; storeDiscounts: Partial<Record<StoreId, number>>; active: boolean };

/** The franchise discount a store gets from a vendor: the store's own % if set, else the vendor's default. */
export const vendorDiscount = (vendor: Pick<Vendor, "discountPercent" | "storeDiscounts">, store: StoreId | null) =>
  (store && vendor.storeDiscounts[store] !== undefined ? vendor.storeDiscounts[store]! : vendor.discountPercent);

/** PO amounts: the invoice price (ex GST) of the ticked lines, less the franchise discount, plus GST. */
export function poTotals(lines: { include: boolean; qty: number; unitCents: number }[], discountPercent: number, gstRegistered = true) {
  const subtotalCents = lines.filter((line) => line.include).reduce((sum, line) => sum + Math.round(line.qty * line.unitCents), 0);
  const discountCents = Math.round((subtotalCents * discountPercent) / 100);
  const netCents = subtotalCents - discountCents;
  const gstCents = gstRegistered ? Math.round(netCents / 10) : 0;
  return { subtotalCents, discountCents, netCents, gstCents, totalCents: netCents + gstCents };
}

/** Job progress, updated by the vendor from their dashboard (and visible to staff on the PO and invoice). */
export const PROGRESS_STAGES = [
  { key: "new", label: "New", detail: "Purchase order sent, not opened yet" },
  { key: "received", label: "Received", detail: "Vendor has the order" },
  { key: "designing", label: "Designing", detail: "Preparing artwork and production files" },
  { key: "proof", label: "Proof sent", detail: "Proof sent for approval" },
  { key: "production", label: "In production", detail: "Being made" },
  { key: "ready", label: "Ready", detail: "Made and ready for installation or dispatch" },
  { key: "booked", label: "Installation booked", detail: "Installation date booked" },
  { key: "installed", label: "Installed", detail: "Installed / job complete" },
] as const;
export type ProgressStage = (typeof PROGRESS_STAGES)[number]["key"];
export type ProgressEvent = { stage: ProgressStage; note: string; at: number; by: string };
export const isProgressStage = (value: unknown): value is ProgressStage => PROGRESS_STAGES.some((stage) => stage.key === value);
export const progressLabel = (stage: ProgressStage) => PROGRESS_STAGES.find((item) => item.key === stage)?.label ?? stage;
export const progressIndex = (stage: ProgressStage) => PROGRESS_STAGES.findIndex((item) => item.key === stage);

/** A quote line's description for the vendor: job details only (lines with a $ amount, like "Priced at $65 per m²", are left out). */
export const jobLines = (description: string) => description.split("\n").filter((line, index) => index === 0 || !/\$\s?\d/.test(line));
