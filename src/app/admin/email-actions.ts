"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { emailMode, sendCustomerEmail, syncReplies, type EmailAttachment, type EmailContext } from "@/lib/email";
import { getBillingDoc, getBillingSettings, setBillingStatus } from "@/lib/billing";
import { renderBillingPdf } from "@/lib/billing-pdf";
import { billingViewUrl } from "@/lib/billing-links";
import { addEnquiryNote, getEnquiry } from "@/lib/services/enquiries";
import { getOrder } from "@/lib/shop/orders";
import { getDirectoryUser } from "@/lib/users";
import { isEmail } from "@/lib/validation";

export type EmailResult = { ok?: string; error?: string; sentAt?: number } | null;

/**
 * Sends a staff email to the customer behind an enquiry, order or account. The recipient always comes
 * from the record itself (never from the form), and access follows the admin roles:
 * store staff can email their store's enquiries; orders and accounts are super-admin only.
 */
export async function sendEmail(_: EmailResult, form: FormData): Promise<EmailResult> {
  const admin = await requireAdmin();
  const type = String(form.get("contextType") ?? "") as EmailContext["type"];
  const id = String(form.get("contextId") ?? "");
  const subject = String(form.get("subject") ?? "").trim();
  const body = String(form.get("body") ?? "").trim();
  if (!subject || subject.length > 200) return { error: "Add a subject (up to 200 characters)." };
  if (!body || body.length > 10000) return { error: "Write a message (up to 10,000 characters)." };
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) return { error: "Missing record." };

  let to = "";
  let attachments: EmailAttachment[] | undefined;
  let billing: Awaited<ReturnType<typeof getBillingDoc>> = null;
  if (type === "billing") {
    billing = await getBillingDoc(id);
    if (!billing || (admin.role !== "super" && billing.store !== admin.store)) return { error: "This document isn't available to you." };
    if (billing.status === "void") return { error: "This invoice is void." };
    to = billing.customer.email;
    if (form.get("attachPdf") === "on") {
      const pdf = await renderBillingPdf(billing, await getBillingSettings(), billingViewUrl(billing.token));
      attachments = [{ filename: `${billing.number}.pdf`, content: pdf, contentType: "application/pdf" }];
    }
  } else if (type === "enquiry") {
    const enquiry = await getEnquiry(id);
    if (!enquiry || (admin.role !== "super" && enquiry.store !== admin.store)) return { error: "This enquiry isn't available to you." };
    to = enquiry.email;
  } else if (type === "order" || type === "user") {
    if (admin.role !== "super") return { error: "Only super admins can email from here." };
    to = type === "order" ? (await getOrder(id))?.customer.email ?? "" : (await getDirectoryUser(id))?.email ?? "";
  } else return { error: "Missing record." };
  if (!isEmail(to)) return { error: "This customer has no valid email address." };

  const result = await sendCustomerEmail({ to, subject, body, sentBy: { name: admin.name, email: admin.email }, context: { type, id }, attachments });
  if ("error" in result) return { error: result.error };
  if (type === "enquiry") await addEnquiryNote(id, `Emailed customer: “${subject}”`, admin.name || admin.email, "email");
  if (billing && attachments) {
    // Sending the PDF moves a draft to "sent"; later sends are logged as re-sends.
    const label = billing.kind === "quote" ? "Quote" : "Invoice";
    await setBillingStatus(billing.id, billing.status === "draft" ? { status: "sent", sentAt: true } : {}, admin.name || admin.email, `${billing.status === "draft" ? "Sent" : "Re-sent"} to ${to}`);
    if (billing.enquiryId) await addEnquiryNote(billing.enquiryId, `${label} ${billing.number} emailed to the customer`, admin.name || admin.email, "email").catch(() => undefined);
  }
  refresh();
  return { ok: emailMode() === "log" ? `Dev mode: email to ${to} written to the server log (not sent).` : `Sent to ${to}.`, sentAt: Date.now() };
}

export type SyncResult = { ok?: string; error?: string; checkedAt?: number } | null;

/** Checks the shared inbox for customer replies (any signed-in staff member). */
export async function checkReplies(_: SyncResult, force: boolean): Promise<SyncResult> {
  await requireAdmin();
  const result = await syncReplies({ force });
  if ("error" in result) return { error: result.error, checkedAt: Date.now() };
  if (result.added) refresh();
  return { ok: result.skipped ? undefined : result.added ? `${result.added} new ${result.added === 1 ? "reply" : "replies"}.` : "No new replies.", checkedAt: Date.now() };
}
