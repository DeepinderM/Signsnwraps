"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { autoInvoiceAcceptedQuote } from "@/lib/billing-auto";
import { getBillingDocByToken, setBillingStatus, todayIso } from "@/lib/billing";
import { createInvoiceCheckout } from "@/lib/billing-payments";
import { addEnquiryNote } from "@/lib/services/enquiries";

export type QuoteResponse = { ok?: string; error?: string } | null;

/** The customer accepts or declines a sent quote from its private link. */
export async function respondToQuote(_: QuoteResponse, form: FormData): Promise<QuoteResponse> {
  const doc = await getBillingDocByToken(String(form.get("token") ?? ""));
  const decision = String(form.get("decision") ?? "");
  const name = String(form.get("name") ?? "").trim().slice(0, 120);
  const note = String(form.get("note") ?? "").trim().slice(0, 1000);
  if (!doc || doc.kind !== "quote") return { error: "This quote couldn't be found." };
  if (doc.status !== "sent") return { error: "This quote can no longer be changed online. Please contact us." };
  if (doc.dueDate && doc.dueDate < todayIso()) return { error: "This quote has expired. Please contact us for an updated quote." };
  if (decision !== "accept" && decision !== "decline") return { error: "Choose accept or decline." };
  if (decision === "accept" && !name) return { error: "Type your name to accept." };
  const who = name || doc.customer.name || "Customer";
  const text = `${decision === "accept" ? "Accepted" : "Declined"} online by ${who}${note ? `: “${note}”` : ""}`;
  await setBillingStatus(doc.id, { status: decision === "accept" ? "accepted" : "declined", respondedAt: true }, who, text);
  if (doc.enquiryId) await addEnquiryNote(doc.enquiryId, `Quote ${doc.number} ${text.charAt(0).toLowerCase()}${text.slice(1)}`, who).catch(() => undefined);
  // Accepting creates the invoice and emails it (with the deposit to pay) once this response has gone back.
  if (decision === "accept") after(() => autoInvoiceAcceptedQuote(doc.id).catch((reason) => console.error("Automatic invoice failed", reason)));
  refresh();
  return { ok: decision === "accept" ? "Thank you! Your quote is accepted. We'll email your invoice in a moment so you can pay the deposit, and our team will be in touch to schedule the work." : "Thanks for letting us know. We've recorded your response." };
}

export async function payInvoice(form: FormData) {
  const url = await createInvoiceCheckout(String(form.get("token") ?? ""), form.get("mode") === "full" ? "full" : "stage");
  if (url) redirect(url);
}
