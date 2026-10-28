import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { FileDown } from "lucide-react";
import { discountLabel, formatDate, getBillingDocByToken, getBillingSettings, isOverdue, nextDueStage, statusLabel, todayIso } from "@/lib/billing";
import { recordInvoicePayment } from "@/lib/billing-payments";
import { getStripe } from "@/lib/stripe";
import { getAdmin } from "@/lib/admin-auth";
import { formatAud } from "@/lib/shop/catalog";
import { payInvoice } from "./actions";
import { QuoteResponse } from "./quote-response";
import { CreditCard, Lock } from "lucide-react";
import { PaymentMarks } from "@/components/shop/payment-marks";
import { RollDiagram } from "@/components/billing/roll-diagram";
import { AcpDiagram } from "@/components/billing/acp-diagram";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your quote or invoice", robots: { index: false, follow: false } };

/** Customer view of a quote or invoice, reached by the private link in the email. */
export default async function BillingViewPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ session_id?: string }> }) {
  const { token } = await params;
  const { session_id: sessionId } = await searchParams;
  let doc = await getBillingDocByToken(token);
  if (!doc) notFound();
  // Drafts are hidden from customers; staff who can manage the document get a read-only preview.
  const admin = doc.status === "draft" ? await getAdmin() : null;
  const preview = doc.status === "draft";
  if (preview && !(admin && (admin.role === "super" || admin.store === doc.store))) notFound();
  // A link pasted with extra text on the end still finds the document; show it at its proper address.
  if (doc.token !== token) redirect(`/billing/${doc.token}${sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ""}`);
  // Back from Stripe: record the payment now rather than waiting for the webhook.
  if (sessionId && /^cs_[A-Za-z0-9_]+$/.test(sessionId) && doc.kind === "invoice" && doc.status === "sent") {
    await recordInvoicePayment(sessionId).catch((error) => console.error("Invoice payment check failed", error));
    doc = (await getBillingDocByToken(token))!;
  }
  const settings = await getBillingSettings();
  const isQuote = doc.kind === "quote";
  const heading = isQuote ? "Quote" : settings.gstRegistered ? "Tax invoice" : "Invoice";
  const balance = doc.totalCents - doc.paidCents;
  const canRespond = isQuote && doc.status === "sent" && doc.dueDate >= todayIso();
  const staffPreview = preview ? <div className="doc-preview" role="status"><b>Draft preview</b> · Only staff can see this. The customer can open this link once the {isQuote ? "quote" : "invoice"} is sent. <a href={`/admin/billing/${doc.id}`}>Back to admin</a></div> : null;
  const due = !isQuote && doc.status === "sent" ? nextDueStage(doc) : undefined;
  const canPay = !!due && balance > 0;
  const staged = doc.schedule.length > 1;
  const reference = due && staged ? `${doc.number}-${doc.schedule.indexOf(due) + 1}` : doc.number;

  return <section className="doc-page"><div className="container doc-wrap">
    {staffPreview}
    <header className="doc-head">
      <div><span className="eyebrow">{heading.toUpperCase()} · {doc.number}</span><h1 className="heading-lg">{doc.title || `${heading} ${doc.number}`}</h1>
        <p>For {doc.customer.business || doc.customer.name} · issued {formatDate(doc.issueDate)} · {isQuote ? "valid until" : "due"} {formatDate(doc.dueDate)}</p></div>
      <div className="doc-head-side"><span className={`doc-status is-${isOverdue(doc) ? "overdue" : doc.status}`}>{statusLabel(doc)}</span><a className="button button-light" href={`/billing/${token}/pdf`} target="_blank" rel="noreferrer"><FileDown aria-hidden /> Download PDF</a></div>
    </header>

    <div className="doc-grid">
      <div className="doc-card">
        <table className="doc-table"><thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>
          {doc.items.map((item, index) => <tr key={index}><td>{item.description}{item.code && <><br /><code className="prod-code doc-code">{item.code}</code></>}</td><td>{item.qty}</td><td>{formatAud(item.unitCents)}</td><td>{formatAud(Math.round(item.qty * item.unitCents))}</td></tr>)}
        </tbody></table>
        <dl className="doc-totals">
          <div><dt>Subtotal (ex GST)</dt><dd>{formatAud(doc.subtotalCents)}</dd></div>
          {doc.discountCents > 0 && <><div className="is-discount"><dt>{discountLabel(doc.discount)}</dt><dd>−{formatAud(doc.discountCents)}</dd></div><div><dt>Subtotal after discount</dt><dd>{formatAud(doc.subtotalCents - doc.discountCents)}</dd></div></>}
          {settings.gstRegistered && <div><dt>GST (10%)</dt><dd>{formatAud(doc.gstCents)}</dd></div>}
          <div className="is-total"><dt>Total{settings.gstRegistered ? " incl. GST" : ""}</dt><dd>{formatAud(doc.totalCents)}</dd></div>
          {!isQuote && doc.paidCents > 0 && <><div><dt>Paid</dt><dd>−{formatAud(doc.paidCents)}</dd></div><div className="is-total"><dt>Balance due</dt><dd>{formatAud(Math.max(balance, 0))}</dd></div></>}
        </dl>
        {doc.items.some((item) => item.roll?.showDiagram) && <div className="doc-rolls"><h2>How your vinyl is calculated</h2>
          {doc.items.map((item, index) => item.roll?.showDiagram ? <div key={index} className="doc-roll"><h3>{item.description.split("\n")[0]}</h3>
            <RollDiagram audience="customer" id={`roll-${index}`} widthMm={item.roll.widthMm} heightMm={item.roll.heightMm} rollWidthMm={item.roll.rollWidthMm} pricePerM2Cents={item.roll.pricePerM2Cents} />
          </div> : null)}
        </div>}
        {doc.items.some((item) => item.acp?.showDiagram) && <div className="doc-rolls"><h2>How your panels are cut</h2>
          {doc.items.map((item, index) => item.acp?.showDiagram ? <div key={index} className="doc-roll"><h3>{item.description.split("\n")[0]} · {item.acp.signs ?? item.qty} × {item.acp.widthMm} × {item.acp.heightMm} mm</h3>
            <AcpDiagram widthMm={item.acp.widthMm} heightMm={item.acp.heightMm} qty={item.acp.signs ?? Math.max(1, Math.round(item.qty))} showCost={false} id={`doc-acp-${index}`} panelSet={item.acp.panelSet} />
          </div> : null)}
        </div>}
        <div className="doc-schedule"><h2>Payment schedule</h2>
          <p>{staged ? doc.schedule.map((stage) => `${stage.label} (${stage.percent}%) ${stage.when.toLowerCase()}`).join(" · ") : "Paid in full before work starts."}</p>
          <ol>{doc.schedule.map((stage) => <li key={stage.key} className={isQuote ? "" : `is-${stage.status}`}>
            <span><b>{stage.label}{stage.percent < 100 ? ` · ${stage.percent}%` : ""}</b><small>{stage.when}</small></span>
            <span className="doc-stage-amount">{formatAud(stage.amountCents)}{!isQuote && <em>{stage.status === "paid" ? "Paid" : stage.status === "due" ? "Due now" : "Later"}</em>}</span>
          </li>)}</ol>
        </div>
        {doc.notes && <div className="doc-notes"><h2>Notes</h2><p>{doc.notes}</p></div>}
        {(isQuote ? settings.quoteTerms : settings.invoiceTerms) && <div className="doc-notes"><h2>Terms</h2><p>{isQuote ? settings.quoteTerms : settings.invoiceTerms}</p></div>}
      </div>

      <aside className="doc-card doc-side">
        {isQuote && canRespond && <><h2>Happy to go ahead?</h2><QuoteResponse token={token} name={doc.customer.name} /></>}
        {preview && <><h2>Not sent yet</h2><p>Accept and payment options appear here for the customer once this is sent.</p></>}
        {isQuote && !canRespond && !preview && <><h2>{statusLabel(doc)}</h2><p>{doc.status === "accepted" || doc.status === "invoiced" ? "Thanks, this quote has been accepted. We'll be in touch about scheduling." : doc.status === "declined" ? "This quote was declined. Contact us if you'd like an updated quote." : "This quote has expired. Contact us for an updated quote."}</p></>}
        {!isQuote && doc.status === "paid" && <><h2>Paid</h2><p>Thank you. This invoice has been paid in full.</p></>}
        {!isQuote && doc.status === "void" && <><h2>Cancelled</h2><p>This invoice has been cancelled. No payment is needed.</p></>}
        {!isQuote && doc.status === "sent" && !due && <><h2>Nothing due right now</h2><p>Thanks, you're up to date. We'll let you know when the next payment ({doc.schedule.find((stage) => stage.status === "upcoming")?.label.toLowerCase()}) is due.</p></>}
        {canPay && due && <><h2>Pay {formatAud(due.amountCents)}</h2><p className="doc-due-note">{due.label}{staged ? ` (${due.percent}%)` : ""} · {due.when.toLowerCase()}{doc.paidCents > 0 ? ` · ${formatAud(doc.paidCents)} paid so far` : ""}</p>
          {getStripe() && <div className="doc-paycard"><h3>Pay online</h3>
            <form action={payInvoice}><input type="hidden" name="token" value={token} /><button className="button button-orange doc-pay" type="submit"><CreditCard aria-hidden /> Pay by card or Apple Pay</button></form>
            <PaymentMarks />
            <p><Lock aria-hidden /> Secure checkout by Stripe. Apple Pay appears on iPhone, iPad and Mac (Safari); Google Pay on Chrome and Android.</p></div>}
          {settings.bsb && settings.accountNumber && <div className="doc-bank"><h3>Bank transfer</h3><dl><div><dt>Account name</dt><dd>{settings.accountName || settings.businessName}</dd></div>{settings.bankName && <div><dt>Bank</dt><dd>{settings.bankName}</dd></div>}<div><dt>BSB</dt><dd>{settings.bsb}</dd></div><div><dt>Account</dt><dd>{settings.accountNumber}</dd></div><div><dt>Reference</dt><dd>{reference}</dd></div><div><dt>Amount</dt><dd>{formatAud(due.amountCents)}</dd></div></dl></div>}
          {!getStripe() && !(settings.bsb && settings.accountNumber) && <p>Please contact us to arrange payment.</p>}</>}
        <div className="doc-from"><h3>From</h3><p><b>{settings.businessName}</b>{settings.abn && <><br />ABN {settings.abn}</>}{settings.address && <><br />{settings.address}</>}{settings.phone && <><br />{settings.phone}</>}{settings.email && <><br />{settings.email}</>}</p></div>
      </aside>
    </div>
  </div></section>;
}
