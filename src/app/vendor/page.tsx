import type { Metadata } from "next";
import Link from "next/link";
import { getBillingDoc } from "@/lib/billing";
import { listVendorJobs } from "@/lib/purchase-orders";
import { storeLabel } from "@/lib/staff";
import { requireVendor } from "@/lib/vendor-auth";
import { progressLabel } from "@/lib/vendor-types";
import { hasUnread } from "@/lib/po-chat-types";
import { SignOutButton } from "@/app/account/account-controls";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Vendor dashboard", robots: { index: false, follow: false } };

const date = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "Australia/Melbourne" });

/** Every purchase order sent to the signed-in vendor, newest first. */
export default async function VendorDashboard({ searchParams }: { searchParams: Promise<{ vendor?: string }> }) {
  const preview = (await searchParams).vendor;
  const viewer = await requireVendor(preview);
  const jobs = await listVendorJobs(viewer.vendor.id);
  const docs = await Promise.all(jobs.map((po) => getBillingDoc(po.id)));
  const rows = jobs.map((po, index) => ({ po, doc: docs[index] }));
  const thisMonth = rows.filter(({ po }) => po.sentAt && new Date(po.sentAt).getMonth() === new Date().getMonth() && new Date(po.sentAt).getFullYear() === new Date().getFullYear());
  const q = preview ? `?vendor=${preview}` : "";

  return <section className="vendor-page"><div className="container">
    {viewer.preview && <p className="vendor-preview">Super admin preview: this is what {viewer.vendor.name} sees. <Link href="/admin/billing/vendors">Back to vendors</Link></p>}
    <div className="vendor-head"><div><span className="eyebrow">VENDOR DASHBOARD</span><h1 className="heading-lg">{viewer.vendor.name}</h1><p>Purchase orders from Signs N Wraps. Signed in as {viewer.email}.</p></div>{!viewer.preview && <SignOutButton />}</div>
    <div className="vendor-stats">
      <div><b>{rows.filter(({ po }) => po.progress !== "installed").length}</b><span>Open jobs</span></div>
      <div><b>{rows.filter(({ po }) => po.progress === "new").length}</b><span>New (not opened)</span></div>
      <div><b>{rows.filter(({ po }) => hasUnread(po, "vendor")).length}</b><span>Jobs with unread messages</span></div>
      <div><b>{thisMonth.length}</b><span>Sent this month</span></div>
    </div>
    {rows.length === 0 ? <p className="vendor-empty">No purchase orders yet. Jobs appear here as soon as Signs N Wraps sends you a purchase order.</p>
      : <div className="vendor-table-wrap"><table className="vendor-table">
        <thead><tr><th>PO</th><th>Job</th><th>Store</th><th>Sent</th><th>Required by</th><th>Items</th><th>Progress</th><th></th></tr></thead>
        <tbody>{rows.map(({ po, doc }) => <tr key={po.id}>
          <td><b>{po.number}</b></td>
          <td>{doc?.title || po.quoteNumber}{po.includeCustomer && doc && <small>{doc.customer.business || doc.customer.name}</small>}</td>
          <td>{storeLabel(po.store)}</td>
          <td>{po.sentAt ? date.format(po.sentAt) : "-"}</td>
          <td>{po.requiredBy ? date.format(new Date(`${po.requiredBy}T00:00:00`)) : "-"}</td>
          <td><span className={`progress-badge is-${po.progress}`}>{progressLabel(po.progress)}</span></td>
          <td>{po.lines.filter((line) => line.include).length}</td>
          <td><Link className="text-link" href={`/vendor/jobs/${po.id}${q}`}>Open</Link>{hasUnread(po, "vendor") && <span className="chat-unread">New message</span>}</td>
        </tr>)}</tbody>
      </table></div>}
  </div></section>;
}
