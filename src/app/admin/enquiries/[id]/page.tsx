import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { enquiryStatuses, getEnquiry } from "@/lib/services/enquiries";
import { Download } from "lucide-react";
import { AdminNav } from "../../admin-nav";
import { EmailThread } from "@/app/admin/email-composer";
import { emailMode, getThread } from "@/lib/email";
import { enquiryTemplates } from "@/lib/email-templates";
import { DivertForm, NoteForm, StatusForm } from "./enquiry-forms";
import { formatDate, listBillingForEnquiry, statusLabel as billingStatus } from "@/lib/billing";
import { formatAud } from "@/lib/shop/catalog";
import { storeForRegion, storeLabel, stores } from "@/lib/staff";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Enquiry" };

const shortDate = new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Melbourne" });
const formatSize = (bytes: number) => bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export default async function AdminEnquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const enquiry = await getEnquiry((await params).id);
  // Store staff only reach enquiries diverted to their store.
  if (!enquiry || (admin.role !== "super" && enquiry.store !== admin.store)) notFound();
  const isSuper = admin.role === "super";
  const [thread, billingDocs] = await Promise.all([getThread({ type: "enquiry", id: enquiry.id }), listBillingForEnquiry(enquiry.id)]);
  const files = enquiry.files;
  const details = Object.entries(enquiry.details ?? {}).filter(([, value]) => value);
  const source = Object.entries(enquiry.attribution ?? {}).filter(([, value]) => value);

  return <>
    <AdminNav admin={{ email: admin.email, role: admin.role, store: admin.store }} />
    <Link className="text-link" href="/admin/enquiries">← Enquiries</Link>
    <div className="admin-head"><div><h1>{enquiry.type === "booking" ? "Appointment request" : enquiry.type === "installer" ? "Installer application" : "Quote request"} · {enquiry.name}</h1><p>{enquiry.service} · received {enquiry.createdAt ? new Intl.DateTimeFormat("en-AU", { dateStyle: "full", timeStyle: "short", timeZone: "Australia/Melbourne" }).format(enquiry.createdAt) : "—"}</p></div><span className={`admin-store-badge${enquiry.store ? "" : " is-unassigned"}`}>{storeLabel(enquiry.store)}</span><a className="button button-light" href="#email">Email customer</a></div>
    <div className="admin-order-grid">
      <section className="admin-card">
        <h2>Request</h2>
        {enquiry.type === "booking" && <p><b>Preferred appointment:</b> {enquiry.date} at {enquiry.time} · {enquiry.location}<br/><small>Not yet confirmed. Contact the customer to lock in a time, then set the status to “Appointment confirmed”.</small></p>}
        {details.length > 0 && <table className="admin-table"><tbody>{details.map(([key, value]) => <tr key={key}><th>{key}</th><td>{value}</td></tr>)}{enquiry.type !== "booking" && enquiry.location && <tr><th>{enquiry.type === "installer" ? "Region" : "Project region"}</th><td>{enquiry.location}</td></tr>}</tbody></table>}
        <h2>Project description</h2>
        <p className="admin-pre">{enquiry.description || "—"}</p>
        {(files.length > 0 || enquiry.filesFailed > 0) && <div className="admin-attachments"><div className="admin-attachments-head"><h2>Attachments ({files.length})</h2>{files.length > 1 && <a className="button button-light" href={`/admin/enquiries/${enquiry.id}/files/all`}><Download aria-hidden /> Download all (.zip)</a>}</div>
          <ul>{files.map((file, index) => { const href = `/admin/enquiries/${enquiry.id}/files/${index}`; const previewable = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.contentType); const viewable = previewable || file.contentType === "application/pdf"; return <li key={file.path}>
            {previewable ? <a href={href} target="_blank" rel="noreferrer" className="admin-attachment-thumb">{/* eslint-disable-next-line @next/next/no-img-element -- authenticated admin route, not optimisable */}<img src={href} alt={file.name} loading="lazy" /></a> : <span className="admin-attachment-thumb is-file">{file.name.split(".").pop()?.toUpperCase().slice(0, 4) || "FILE"}</span>}
            <div><b title={file.name}>{file.name}</b><small>{formatSize(file.size)} · {file.contentType || "file"}</small></div>
            <div className="admin-attachment-actions">{viewable && <a href={href} target="_blank" rel="noreferrer">View</a>}<a className="button button-orange" href={`${href}?download=1`}><Download aria-hidden /> Download</a></div>
          </li>; })}</ul>
          {enquiry.filesFailed > 0 && <p className="admin-error">{enquiry.filesFailed} attachment(s) could not be saved. Ask the customer to email them.</p>}</div>}
      </section>
      <section className="admin-card"><h2>Customer</h2><p>{enquiry.name}{enquiry.business && <><br/>{enquiry.business}</>}<br/><a href={`mailto:${enquiry.email}`}>{enquiry.email}</a><br/><a href={`tel:${enquiry.phone.replace(/\s+/g, "")}`}>{enquiry.phone}</a></p>
        {source.length > 0 && <><h2>Source</h2><p><small>{source.map(([key, value]) => `${key.replace("utm_", "")}: ${value}`).join(" · ")}</small></p></>}</section>
      {isSuper && <section className="admin-card"><h2>Store assignment</h2>
        <p className="admin-hint">{enquiry.store ? <>With <b>{storeLabel(enquiry.store)}</b>{enquiry.assignedAt ? ` since ${shortDate.format(enquiry.assignedAt)}` : ""}. Only that store's staff (and super admins) can see this lead.</> : <>Not with a store yet. Customer chose <b>{enquiry.location || "no region"}</b>. Divert it so the store's staff can follow it up.</>}</p>
        <DivertForm id={enquiry.id} store={enquiry.store} suggested={storeForRegion(enquiry.location)} stores={stores} />
      </section>}
      <section className="admin-card"><h2>Quotes & invoices</h2>
        {billingDocs.length > 0 && <table className="admin-table"><tbody>{billingDocs.map((doc) => <tr key={doc.id}><td><a href={`/admin/billing/${doc.id}`}><b>{doc.number}</b></a><small>{formatDate(doc.issueDate)}</small></td><td>{formatAud(doc.totalCents)}</td><td><span className={`bill-status is-${doc.status}`}>{billingStatus(doc)}</span></td></tr>)}</tbody></table>}
        <div className="bill-actions-row"><a className="button button-orange" href={`/admin/billing/new?kind=quote&enquiry=${enquiry.id}`}>Create quote</a><a className="button button-light" href={`/admin/billing/new?kind=invoice&enquiry=${enquiry.id}`}>Create invoice</a></div>
      </section>
      <section className="admin-card"><h2>Status</h2><StatusForm id={enquiry.id} status={enquiry.status} statuses={enquiryStatuses} /></section>
      <section className="admin-card admin-card-wide" id="email"><h2>Emails</h2><EmailThread to={enquiry.email} name={enquiry.name} contextType="enquiry" contextId={enquiry.id} mode={emailMode()} thread={thread} templates={enquiryTemplates({ name: enquiry.name, service: enquiry.service, type: enquiry.type, date: enquiry.date, time: enquiry.time, staff: admin.name || "The Signsnwraps team" })} /></section>
      <section className="admin-card admin-notes"><h2>Internal notes</h2><p className="admin-hint">Visible to staff only, never to the customer.</p>
        {enquiry.notes.length === 0 && !enquiry.staffNote ? <p className="admin-hint">No notes yet.</p> : <ol className="admin-timeline">
          {enquiry.staffNote && <li className="kind-note"><p className="admin-pre">{enquiry.staffNote}</p><small>Earlier staff note</small></li>}
          {enquiry.notes.map((note) => <li key={note.id} className={`kind-${note.kind}`}><p className="admin-pre">{note.text}</p><small>{note.by} · {shortDate.format(note.at)}</small></li>)}
        </ol>}
        <NoteForm id={enquiry.id} />
      </section>
    </div>
  </>;
}
