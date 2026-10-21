import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileDown } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { STAGED_THRESHOLD_CENTS, formatDate, getBillingDoc, getBillingSettings, isEditable, isOverdue, nextDueStage, statusLabel } from "@/lib/billing";
import { billingViewUrl } from "@/lib/billing-links";
import { emailMode, getThread } from "@/lib/email";
import { billingTemplates } from "@/lib/email-templates";
import { formatAud } from "@/lib/shop/catalog";
import { storeLabel, stores } from "@/lib/staff";
import { EmailThread } from "@/app/admin/email-composer";
import { AdminNav } from "../../admin-nav";
import { convertToInvoice } from "../actions";
import { BillingEditor } from "../billing-editor";
import { CopyLink, StatusButtons } from "./billing-actions";
import { PaymentSchedule } from "./payment-schedule";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Quote / invoice" };

const stamp = new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Melbourne" });

export default async function BillingDocPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const admin = await requireAdmin();
  const doc = await getBillingDoc((await params).id);
  if (!doc || (admin.role !== "super" && doc.store !== admin.store)) notFound();
  const { created } = await searchParams;
  const [settings, thread] = await Promise.all([getBillingSettings(), getThread({ type: "billing", id: doc.id })]);
  const link = billingViewUrl(doc.token);
  const label = doc.kind === "quote" ? "Quote" : settings.gstRegistered ? "Tax invoice" : "Invoice";
  const bank = settings.bsb && settings.accountNumber ? `Bank transfer: ${settings.accountName || settings.businessName}, BSB ${settings.bsb}, account ${settings.accountNumber}. Please use ${doc.number} as the reference.` : "";
  const buttons = doc.kind === "quote"
    ? doc.status === "draft" || doc.status === "sent" ? [{ action: "accepted", label: "Mark accepted", tone: "primary" as const }, { action: "declined", label: "Mark declined" }, { action: "expired", label: "Mark expired" }]
      : doc.status === "invoiced" ? [] : [{ action: "reopen", label: "Reopen" }]
    : doc.status === "draft" || doc.status === "sent" ? (doc.paidCents ? [] : [{ action: "void", label: "Void invoice", tone: "danger" as const }])
      : doc.status === "void" ? [{ action: "reopen", label: "Reopen" }] : [];

  return <>
    <AdminNav admin={{ email: admin.email, role: admin.role, store: admin.store }} />
    <Link className="text-link" href={`/admin/billing?kind=${doc.kind}`}>← {doc.kind === "quote" ? "Quotes" : "Invoices"}</Link>
    {created && <p className="admin-ok" role="status">{label} {doc.number} created. Check the details, then send it to the customer below.</p>}
    <div className="admin-head"><div><h1>{label} {doc.number}</h1><p>{doc.customer.business || doc.customer.name}{doc.title && ` · ${doc.title}`} · {formatAud(doc.totalCents)} incl. GST · {doc.kind === "quote" ? "valid until" : "due"} {formatDate(doc.dueDate)}</p></div>
      <div className="admin-head-badges"><span className={`bill-status is-${isOverdue(doc) ? "overdue" : doc.paidCents && doc.status === "sent" ? "part" : doc.status}`}>{statusLabel(doc)}</span>{doc.store && <span className="admin-store-badge">{storeLabel(doc.store)}</span>}</div></div>

    <section className="admin-card bill-toolbar">
      <a className="button button-light" href={`/admin/billing/${doc.id}/pdf`} target="_blank" rel="noreferrer"><FileDown aria-hidden /> View PDF</a>
      <StatusButtons id={doc.id} buttons={buttons} />
      {doc.kind === "quote" && (doc.status === "accepted" || doc.status === "sent" || doc.status === "draft") && <form action={convertToInvoice}><input type="hidden" name="id" value={doc.id} /><button className={`button ${doc.status === "accepted" ? "button-orange" : "button-light"}`} type="submit">Convert to invoice</button></form>}
      {doc.invoiceId && <Link className="button button-light" href={`/admin/billing/${doc.invoiceId}`}>Open invoice</Link>}
      {doc.fromQuoteId && <Link className="button button-light" href={`/admin/billing/${doc.fromQuoteId}`}>Open original quote</Link>}
      {doc.enquiryId && <Link className="button button-light" href={`/admin/enquiries/${doc.enquiryId}`}>Open enquiry</Link>}
      <div className="bill-share"><span>Customer link {doc.kind === "quote" ? "(view & accept)" : "(view & pay)"}{doc.status === "draft" ? " · works for the customer once sent. You can preview it now." : ""}</span><CopyLink url={link} /></div>
    </section>

    <section className="admin-card bill-origin"><h2>Origin & ownership <small>Internal only, not shown to the customer</small></h2>
      <dl>
        <div><dt>Managing store</dt><dd>{doc.store ? <span className="admin-store-badge">{storeLabel(doc.store)}</span> : <span className="admin-store-badge is-unassigned">No store</span>}</dd></div>
        <div><dt>Created from</dt><dd>{doc.origin.kind === "enquiry" && doc.enquiryId ? <Link href={`/admin/enquiries/${doc.enquiryId}`}>{doc.origin.label}</Link> : doc.origin.kind === "quote" && doc.fromQuoteId ? <Link href={`/admin/billing/${doc.fromQuoteId}`}>{doc.origin.label}</Link> : doc.origin.kind === "account" && doc.userId ? <Link href={`/admin/users/${doc.userId}`}>{doc.origin.label}</Link> : doc.origin.label}</dd></div>
        <div><dt>Lead source</dt><dd>{doc.origin.channel}{doc.origin.campaign && <small>Campaign: {doc.origin.campaign}</small>}{doc.origin.landingPage && <small>First page: {doc.origin.landingPage}</small>}</dd></div>
        <div><dt>Created by</dt><dd>{doc.origin.createdBy || doc.createdBy}<small>{doc.origin.createdByRole === "super" ? "Super admin" : `${storeLabel(doc.origin.createdByStore)} staff`}{doc.createdAt ? ` · ${stamp.format(doc.createdAt)}` : ""}</small></dd></div>
      </dl>
    </section>

    <section className="admin-card" id="payments"><h2>Payment schedule <small>{doc.totalCents >= STAGED_THRESHOLD_CENTS ? "$1,000+ · 50% deposit, 30% before installation, 20% on completion" : "Under $1,000 · paid in full upfront"}</small></h2>
      <PaymentSchedule id={doc.id} schedule={doc.schedule} editable={doc.kind === "invoice" && doc.status !== "void" && doc.status !== "draft"} isQuote={doc.kind === "quote"} />
      {doc.kind === "invoice" && doc.status === "draft" && <p className="admin-hint">Send the invoice to request the {doc.schedule[0]?.label.toLowerCase()}. Later payments are requested here when the job reaches that stage.</p>}
    </section>

    <section className="admin-card admin-card-wide" id="email"><h2>Send & emails</h2>
      {!doc.customer.email ? <p className="admin-hint">Add the customer's email below to send this {doc.kind}.</p> :
        <EmailThread to={doc.customer.email} name={doc.customer.name} contextType="billing" contextId={doc.id} mode={emailMode()} thread={thread} attachLabel={`${doc.number}.pdf`}
          templates={billingTemplates({ kind: doc.kind, number: doc.number, name: doc.customer.name, title: doc.title, total: formatAud(doc.totalCents), due: formatDate(doc.dueDate), link, staff: admin.name || "The Signsnwraps team", bank, schedule: doc.schedule.map((stage) => ({ label: stage.label, percent: stage.percent, amount: formatAud(stage.amountCents), when: stage.when })), dueStage: nextDueStage(doc) ? { label: nextDueStage(doc)!.label, percent: nextDueStage(doc)!.percent, amount: formatAud(nextDueStage(doc)!.amountCents) } : null })} />}
    </section>

    {isEditable(doc) ? <><h2 className="bill-section-title">Edit {doc.kind}</h2><BillingEditor id={doc.id} kind={doc.kind} gstRegistered={settings.gstRegistered} stores={admin.role === "super" ? stores : null} initial={{ ...doc, store: doc.store ?? "" }} /></>
      : <section className="admin-card"><h2>Items</h2><p className="admin-hint">This {doc.kind} is {statusLabel(doc).toLowerCase()}{doc.paidCents > 0 && doc.status !== "paid" ? " and has payments recorded" : ""}, so it can no longer be edited.</p>
        <table className="admin-table"><thead><tr><th>Description</th><th>Qty</th><th>Unit (ex GST)</th><th>Amount</th></tr></thead><tbody>{doc.items.map((item, index) => <tr key={index}><td className="admin-pre">{item.description}</td><td>{item.qty}</td><td>{formatAud(item.unitCents)}</td><td>{formatAud(Math.round(item.qty * item.unitCents))}</td></tr>)}</tbody>
          <tfoot><tr><td colSpan={3}>Subtotal</td><td>{formatAud(doc.subtotalCents)}</td></tr><tr><td colSpan={3}>GST</td><td>{formatAud(doc.gstCents)}</td></tr><tr><th colSpan={3}>Total</th><th>{formatAud(doc.totalCents)}</th></tr></tfoot></table></section>}

    <section className="admin-card"><h2>History</h2><ol className="admin-timeline">{[...doc.history].sort((a, b) => a.at - b.at).map((item, index) => <li key={index} className="kind-status"><p>{item.text}</p><small>{item.by} · {stamp.format(item.at)}</small></li>)}</ol></section>
  </>;
}
