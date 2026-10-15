import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { attachmentUrl, enquiryStatuses, getEnquiry } from "@/lib/services/enquiries";
import { AdminNav } from "../../admin-nav";
import { saveEnquiry } from "../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Enquiry" };

const formatSize = (bytes: number) => bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export default async function AdminEnquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const enquiry = await getEnquiry((await params).id);
  if (!enquiry) notFound();
  const files = await Promise.all(enquiry.files.map(async (file) => ({ ...file, url: await attachmentUrl(file).catch(() => null) })));
  const details = Object.entries(enquiry.details ?? {}).filter(([, value]) => value);
  const source = Object.entries(enquiry.attribution ?? {}).filter(([, value]) => value);

  return <>
    <AdminNav email={admin.email} />
    <Link className="text-link" href="/admin/enquiries">← Enquiries</Link>
    <div className="admin-head"><div><h1>{enquiry.type === "booking" ? "Appointment request" : "Quote request"} · {enquiry.name}</h1><p>{enquiry.service} · received {enquiry.createdAt ? new Intl.DateTimeFormat("en-AU", { dateStyle: "full", timeStyle: "short", timeZone: "Australia/Melbourne" }).format(enquiry.createdAt) : "—"}</p></div><a className="button button-light" href={`mailto:${enquiry.email}?subject=${encodeURIComponent(`Your ${enquiry.service} enquiry with Signsnwraps`)}`}>Email customer ↗</a></div>
    <div className="admin-order-grid">
      <section className="admin-card">
        <h2>Request</h2>
        {enquiry.type === "booking" && <p><b>Preferred appointment:</b> {enquiry.date} at {enquiry.time} · {enquiry.location}<br/><small>Not yet confirmed. Contact the customer to lock in a time, then set the status to “Appointment confirmed”.</small></p>}
        {details.length > 0 && <table className="admin-table"><tbody>{details.map(([key, value]) => <tr key={key}><th>{key}</th><td>{value}</td></tr>)}{enquiry.type === "quote" && enquiry.location && <tr><th>Project location</th><td>{enquiry.location}</td></tr>}</tbody></table>}
        <h2>Project description</h2>
        <p className="admin-pre">{enquiry.description || "—"}</p>
        {(files.length > 0 || enquiry.filesFailed > 0) && <><h2>Attachments</h2><ul className="admin-files">{files.map((file) => <li key={file.path}>{file.url ? <a href={file.url} target="_blank" rel="noreferrer">{file.name}</a> : file.name} <small>{formatSize(file.size)}</small></li>)}</ul>{enquiry.filesFailed > 0 && <p className="admin-error">{enquiry.filesFailed} attachment(s) could not be saved. Ask the customer to email them.</p>}</>}
      </section>
      <section className="admin-card"><h2>Customer</h2><p>{enquiry.name}{enquiry.business && <><br/>{enquiry.business}</>}<br/><a href={`mailto:${enquiry.email}`}>{enquiry.email}</a><br/><a href={`tel:${enquiry.phone.replace(/\s+/g, "")}`}>{enquiry.phone}</a></p>
        {source.length > 0 && <><h2>Source</h2><p><small>{source.map(([key, value]) => `${key.replace("utm_", "")}: ${value}`).join(" · ")}</small></p></>}</section>
      <section className="admin-card"><h2>Follow-up</h2><form action={saveEnquiry} className="admin-form"><input type="hidden" name="id" value={enquiry.id} />
        <div className="field"><label htmlFor="status">Status</label><select id="status" name="status" defaultValue={enquiry.status}>{enquiryStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
        <div className="field"><label htmlFor="staffNote">Staff note (internal)</label><textarea id="staffNote" name="staffNote" defaultValue={enquiry.staffNote} placeholder="Called 14 Oct, booked Tue 10am…" /></div>
        <button className="button button-orange" type="submit">Save</button>
      </form></section>
    </div>
  </>;
}
