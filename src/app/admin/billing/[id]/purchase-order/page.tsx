import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getBillingDoc } from "@/lib/billing";
import { emailMode, getThread } from "@/lib/email";
import { canRaisePurchaseOrder, ensurePurchaseOrder } from "@/lib/purchase-orders";
import { getEnquiry } from "@/lib/services/enquiries";
import { listVendors } from "@/lib/vendors";
import { storeLabel } from "@/lib/staff";
import { AdminNav } from "../../../admin-nav";
import { PurchaseOrderForm } from "./purchase-order-form";
import { PoChatPanel } from "@/components/chat/po-chat-panel";
import { listChat, markChatRead } from "@/lib/po-chat";
import { loadStaffChat, postStaffChat } from "./chat-actions";
import { ProgressTracker } from "@/app/vendor/jobs/[poId]/progress-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Purchase order" };

const stamp = new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Melbourne" });

/** Review and send the purchase order for a job to the manufacturer (draft made when the quote was accepted). */
export default async function PurchaseOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const doc = await getBillingDoc((await params).id);
  if (!doc || (admin.role !== "super" && doc.store !== admin.store)) notFound();
  const back = <Link className="text-link" href={`/admin/billing/${doc.id}`}>← Back to {doc.kind} {doc.number}</Link>;
  if (!canRaisePurchaseOrder(doc)) return <><AdminNav admin={{ email: admin.email, role: admin.role, store: admin.store }} />{back}
    <section className="admin-card"><h1>Purchase order</h1><p className="admin-hint">A purchase order can be raised once the quote is accepted.</p></section></>;
  // Jobs accepted before purchase orders existed get their draft now.
  const po = await ensurePurchaseOrder(doc, admin.name || admin.email);
  const chat = po.status === "sent" ? await listChat(po.id) : [];
  if (po.status === "sent") await markChatRead(po.id, "staff");
  const [enquiry, thread, vendors] = await Promise.all([doc.enquiryId ? getEnquiry(doc.enquiryId) : null, getThread({ type: "purchaseOrder", id: po.id }), listVendors()]);

  return <>
    <AdminNav admin={{ email: admin.email, role: admin.role, store: admin.store }} />
    {back}
    <div className="admin-head"><div><h1>Purchase order {po.number}</h1><p>{doc.customer.business || doc.customer.name}{doc.title && ` · ${doc.title}`} · {[po.quoteNumber, po.invoiceNumber].filter(Boolean).join(" / ")}</p></div>
      <div className="admin-head-badges"><span className={`bill-status is-${po.status === "sent" ? "accepted" : "draft"}`}>{po.status === "sent" ? `Sent ${po.sentAt ? stamp.format(po.sentAt) : ""}` : "Draft"}</span></div></div>
    {emailMode() === "log" && <p className="mail-note">Development mode: the email is written to the server log, not sent.</p>}
    {emailMode() === "off" && <p className="admin-error">Email isn't set up yet, so purchase orders can't be sent.</p>}
    {po.status === "sent" && <section className="admin-card"><PoChatPanel poId={po.id} side="staff" initial={chat} load={loadStaffChat} post={postStaffChat} otherName={po.supplier} /></section>}
    {po.status === "sent" && <ProgressTracker poId={po.id} stage={po.progress} log={po.progressLog} canUpdate={false} />}
    <PurchaseOrderForm id={doc.id} po={po} vendors={vendors.filter((vendor) => vendor.active || vendor.id === po.vendorId)} store={doc.store ?? null} storeName={storeLabel(doc.store)} canManageVendors={admin.role === "super"} artwork={(enquiry?.files ?? []).map((file) => ({ path: file.path, name: file.name, size: file.size }))} selfEmail={admin.email} />
    <section className="admin-card"><h2>History</h2><ul className="po-history">{[...po.history].reverse().map((event) => <li key={`${event.at}-${event.text}`}><b>{event.text}</b><small>{event.by} · {stamp.format(event.at)}</small></li>)}</ul>
      {thread.length > 0 && <><h3>Emails</h3><ul className="po-history">{thread.map((message) => <li key={message.id}><b>{message.subject}</b><small>{message.direction === "out" ? `To ${message.to}` : `From ${message.from}`} · {message.at ? stamp.format(message.at) : ""}{message.attachments.length ? ` · ${message.attachments.length} attachment${message.attachments.length === 1 ? "" : "s"}` : ""}</small></li>)}</ul></>}
    </section>
  </>;
}
