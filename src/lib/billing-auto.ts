import "server-only";
import { addDays, createBillingDoc, formatDate, getBillingDoc, getBillingSettings, nextDueStage, setBillingStatus, todayIso, type BillingDoc, type BillingOrigin, type BillingSettings } from "@/lib/billing";
import { billingViewUrl } from "@/lib/billing-links";
import { renderBillingPdf } from "@/lib/billing-pdf";
import { emailMode, sendCustomerEmail } from "@/lib/email";
import { billingTemplates } from "@/lib/email-templates";
import { addEnquiryNote } from "@/lib/services/enquiries";
import { ensurePurchaseOrder } from "@/lib/purchase-orders";
import { ensureInstallation, needsInstallation } from "@/lib/installations";
import { formatAud } from "@/lib/shop/catalog";
import { isEmail } from "@/lib/validation";

type Creator = Pick<BillingOrigin, "createdBy" | "createdByEmail" | "createdByRole" | "createdByStore">;

/** Bank transfer line for emails ("" until the bank details are set). */
export const bankLine = (doc: Pick<BillingDoc, "number">, settings: BillingSettings) =>
  settings.bsb && settings.accountNumber ? `Bank transfer: ${settings.accountName || settings.businessName}, BSB ${settings.bsb}, account ${settings.accountNumber}. Please use ${doc.number} as the reference.` : "";

/** Turns a quote into a draft invoice with the same customer and lines; the quote is marked invoiced. */
export async function invoiceFromQuote(doc: BillingDoc, by: string, creator: Creator) {
  const settings = await getBillingSettings();
  const issueDate = todayIso();
  // The invoice keeps the quote's lead channel so the sale is credited to the original source.
  const origin: BillingOrigin = { ...doc.origin, kind: "quote", label: `Quote ${doc.number}${doc.origin.kind === "enquiry" ? ` (${doc.origin.label})` : ""}`, ...creator };
  const created = await createBillingDoc("invoice", { store: doc.store, customer: doc.customer, items: doc.items, discount: doc.discount, title: doc.title, notes: doc.notes, issueDate, dueDate: addDays(issueDate, settings.paymentTermsDays), enquiryId: doc.enquiryId, userId: doc.userId }, by, { fromQuoteId: doc.id, origin });
  await setBillingStatus(doc.id, { status: "invoiced", invoiceId: created.id }, by, `Converted to invoice ${created.number}`);
  if (doc.enquiryId) await addEnquiryNote(doc.enquiryId, `Quote ${doc.number} converted to invoice ${created.number}`, by).catch(() => undefined);
  // The job is going ahead: have a draft purchase order ready for the sales person to send to the manufacturer.
  await ensurePurchaseOrder(doc, by, created).catch((reason) => console.error("Purchase order draft failed", reason));
  // Jobs we install get an installation to schedule (lift and weather checks before the date is confirmed).
  if (needsInstallation(doc)) await ensureInstallation(doc, by, created).catch((reason) => console.error("Installation record failed", reason));
  return created;
}

const AUTO = "Automatic (quote accepted)";

/**
 * When a customer accepts a quote online: create the invoice and email it to them with the PDF and the payment link.
 * Runs after the acceptance is saved; any problem is written to the quote's history (and the invoice's) for staff to follow up.
 */
export async function autoInvoiceAcceptedQuote(quoteId: string) {
  const quote = await getBillingDoc(quoteId);
  if (!quote || quote.kind !== "quote" || quote.status !== "accepted") return;
  const created = await invoiceFromQuote(quote, AUTO, { createdBy: AUTO, createdByEmail: "", createdByRole: quote.origin.createdByRole, createdByStore: quote.store ?? quote.origin.createdByStore });
  const invoice = await getBillingDoc(created.id);
  if (!invoice) return;
  if (!isEmail(invoice.customer.email)) {
    await setBillingStatus(invoice.id, {}, AUTO, "Not emailed automatically: the customer has no valid email address");
    return;
  }
  try {
    const settings = await getBillingSettings();
    const link = billingViewUrl(invoice.token);
    const due = nextDueStage(invoice);
    const template = billingTemplates({
      kind: "invoice", number: invoice.number, name: invoice.customer.name, title: invoice.title, total: formatAud(invoice.totalCents), due: formatDate(invoice.dueDate), link,
      staff: "The Signsnwraps team", bank: bankLine(invoice, settings),
      schedule: invoice.schedule.map((stage) => ({ label: stage.label, percent: stage.percent, amount: formatAud(stage.amountCents), when: stage.when })),
      dueStage: due ? { label: due.label, percent: due.percent, amount: formatAud(due.amountCents) } : null,
    })[0];
    // The PDF shows what's due now, so render it as a sent invoice.
    const pdf = await renderBillingPdf({ ...invoice, status: "sent" }, settings, link);
    const result = await sendCustomerEmail({
      to: invoice.customer.email, subject: template.subject, body: template.body, sentBy: { name: AUTO, email: "" }, context: { type: "billing", id: invoice.id },
      attachments: [{ filename: `${invoice.number}.pdf`, content: pdf, contentType: "application/pdf" }],
    });
    if ("error" in result) throw new Error(result.error);
    await setBillingStatus(invoice.id, { status: "sent", sentAt: true }, AUTO, `${emailMode() === "log" ? "Dev mode: written to the server log, not sent" : "Sent"} to ${invoice.customer.email} automatically when quote ${quote.number} was accepted`);
    if (invoice.enquiryId) await addEnquiryNote(invoice.enquiryId, `Invoice ${invoice.number} emailed to the customer automatically`, AUTO, "email").catch(() => undefined);
  } catch (reason) {
    const message = `Invoice ${invoice.number} was created but couldn't be emailed automatically (${reason instanceof Error ? reason.message.slice(0, 200) : "unknown error"}). Send it from the invoice page.`;
    console.error(message, reason);
    await setBillingStatus(invoice.id, {}, AUTO, message).catch(() => undefined);
    await setBillingStatus(quote.id, {}, AUTO, message).catch(() => undefined);
  }
}
