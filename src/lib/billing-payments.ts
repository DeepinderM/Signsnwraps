import "server-only";
import { getStripe } from "@/lib/stripe";
import { getBillingDocByToken, nextDueStage, updateStage, type StageKey } from "@/lib/billing";
import { billingViewUrl } from "@/lib/billing-links";
import { addEnquiryNote } from "@/lib/services/enquiries";

// Card payments for invoices through Stripe Checkout (only when Stripe is configured).
// The Checkout Session carries metadata.billingId; the webhook (and the return page) mark the invoice paid.

export async function createInvoiceCheckout(token: string) {
  const stripe = getStripe();
  const doc = await getBillingDocByToken(token);
  if (!stripe || !doc || doc.kind !== "invoice" || doc.status !== "sent") return null;
  // Customers pay one stage at a time: whichever payment has been requested.
  const stage = nextDueStage(doc);
  if (!stage || stage.amountCents <= 0) return null;
  const link = billingViewUrl(doc.token);
  const session = await stripe.checkout.sessions.create({
    mode: "payment", currency: "aud", locale: "en",
    line_items: [{ quantity: 1, price_data: { currency: "aud", unit_amount: stage.amountCents, tax_behavior: "inclusive", product_data: { name: `Invoice ${doc.number} · ${stage.label}${stage.percent < 100 ? ` (${stage.percent}%)` : ""}`, ...(doc.title ? { description: doc.title } : {}) } } }],
    ...(doc.customer.email ? { customer_email: doc.customer.email } : {}),
    metadata: { billingId: doc.id, stage: stage.key, source: "signsnwraps-invoice" },
    payment_intent_data: { metadata: { billingId: doc.id, invoice: doc.number, stage: stage.key } },
    success_url: `${link}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: link,
  });
  return session.url;
}

/** Marks an invoice paid from a completed Checkout Session. Idempotent. Returns true if the session was an invoice payment. */
export async function recordInvoicePayment(sessionId: string) {
  const stripe = getStripe();
  if (!stripe) return false;
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const billingId = session.metadata?.billingId;
  if (!billingId) return false;
  if (session.payment_status !== "paid") return true;
  // updateStage is transactional and ignores a stage that's already paid, so webhook retries are safe.
  const stage = (session.metadata?.stage ?? "full") as StageKey;
  const result = await updateStage(billingId, stage, "paid", "Stripe", `Paid online · ${typeof session.payment_intent === "string" ? session.payment_intent : session.id}`);
  if ("ok" in result && !("already" in result) && result.doc?.enquiryId) await addEnquiryNote(result.doc.enquiryId, `Invoice ${result.doc.number}: ${result.ok}`, "Stripe").catch(() => undefined);
  return true;
}
