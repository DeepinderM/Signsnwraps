import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { formatDate, getBillingSettings, isOverdue, listBillingDocs, statusLabel, todayIso } from "@/lib/billing";
import { formatAud } from "@/lib/shop/catalog";
import { isStoreId, storeLabel, stores } from "@/lib/staff";
import { AdminNav } from "../admin-nav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Quotes & invoices" };

const quoteTabs = [["open", "Open"], ["draft", "Drafts"], ["sent", "Awaiting reply"], ["accepted", "Accepted"], ["all", "All"]] as const;
const invoiceTabs = [["open", "Unpaid"], ["overdue", "Overdue"], ["draft", "Drafts"], ["paid", "Paid"], ["all", "All"]] as const;

export default async function BillingListPage({ searchParams }: { searchParams: Promise<{ kind?: string; view?: string; q?: string; store?: string }> }) {
  const admin = await requireAdmin();
  const { kind: rawKind, view = "open", q = "", store: rawStore = "" } = await searchParams;
  const kind = rawKind === "invoice" ? "invoice" : "quote";
  const storeFilter = admin.role === "super" && isStoreId(rawStore) ? rawStore : "";
  const [allDocs, settings] = await Promise.all([listBillingDocs(admin.role === "super" ? undefined : admin.store ?? undefined), getBillingSettings()]);
  const docs = storeFilter ? allDocs.filter((doc) => doc.store === storeFilter) : allDocs;
  const link = (next: Record<string, string>) => `/admin/billing?${new URLSearchParams({ kind, view, ...(q ? { q } : {}), ...(storeFilter ? { store: storeFilter } : {}), ...next })}`;
  const quotes = docs.filter((doc) => doc.kind === "quote"), invoices = docs.filter((doc) => doc.kind === "invoice");
  const unpaid = invoices.filter((doc) => doc.status === "sent");
  const month = todayIso().slice(0, 7);
  const stats = [
    ["Outstanding", formatAud(unpaid.reduce((sum, doc) => sum + doc.totalCents - doc.paidCents, 0)), `${unpaid.length} unpaid invoice${unpaid.length === 1 ? "" : "s"}`],
    ["Overdue", formatAud(unpaid.filter(isOverdue).reduce((sum, doc) => sum + doc.totalCents - doc.paidCents, 0)), `${unpaid.filter(isOverdue).length} past due date`],
    ["Quotes awaiting reply", String(quotes.filter((doc) => doc.status === "sent").length), formatAud(quotes.filter((doc) => doc.status === "sent").reduce((sum, doc) => sum + doc.totalCents, 0))],
    ["Paid this month", formatAud(invoices.filter((doc) => doc.status === "paid" && new Date(doc.paidAt).toISOString().slice(0, 7) === month).reduce((sum, doc) => sum + doc.totalCents, 0)), "incl. GST"],
  ];
  const query = q.trim().toLowerCase();
  const shown = (kind === "quote" ? quotes : invoices).filter((doc) => {
    if (query && !`${doc.number} ${doc.customer.name} ${doc.customer.business} ${doc.customer.email} ${doc.title}`.toLowerCase().includes(query)) return false;
    if (view === "all") return true;
    if (kind === "quote") return view === "open" ? ["draft", "sent", "accepted"].includes(doc.status) : doc.status === view;
    if (view === "overdue") return isOverdue(doc);
    return view === "open" ? doc.status === "sent" : doc.status === view;
  });

  return <>
    <AdminNav admin={{ email: admin.email, role: admin.role, store: admin.store }} />
    <div className="admin-head"><div><h1>Quotes & invoices</h1><p>{admin.role === "super" ? "All stores." : `${storeLabel(admin.store)} store.`} Prices are entered ex GST{settings.gstRegistered ? "; 10% GST is added" : ""}.</p></div>
      <div className="admin-head-actions"><Link className="button button-orange" href="/admin/billing/new?kind=quote">New quote</Link><Link className="button button-light" href="/admin/billing/new?kind=invoice">New invoice</Link><Link className="button button-light" href="/admin/reports">Sales report</Link>{admin.role === "super" && <Link className="button button-light" href="/admin/billing/settings">Business details</Link>}</div></div>
    {admin.role === "super" && (!settings.abn || !settings.bsb) && <p className="admin-error">Add your {[!settings.abn && "ABN", !settings.bsb && "bank details"].filter(Boolean).join(" and ")} in <Link href="/admin/billing/settings">Business details</Link> before sending invoices.</p>}
    <div className="bill-stats">{stats.map(([label, value, detail]) => <div key={label}><span>{label}</span><b>{value}</b><small>{detail}</small></div>)}</div>
    <nav className="admin-tabs bill-kind" aria-label="Document type"><Link href={link({ kind: "quote", view: "open" })} aria-current={kind === "quote" ? "page" : undefined}>Quotes ({quotes.length})</Link><Link href={link({ kind: "invoice", view: "open" })} aria-current={kind === "invoice" ? "page" : undefined}>Invoices ({invoices.length})</Link></nav>
    <nav className="admin-filters-row" aria-label="Filter by status"><span>Show:</span>{(kind === "quote" ? quoteTabs : invoiceTabs).map(([value, text]) => <Link key={value} href={link({ view: value })} aria-current={view === value ? "page" : undefined}>{text}</Link>)}</nav>
    {admin.role === "super" && <nav className="admin-filters-row" aria-label="Filter by store"><span>Store:</span>{[["", "All stores"], ...stores.map((item) => [item.value, item.label])].map(([value, text]) => <Link key={value} href={link({ store: value })} aria-current={storeFilter === value ? "page" : undefined}>{text}</Link>)}</nav>}
    <form className="admin-filters" action="/admin/billing"><input type="hidden" name="kind" value={kind} />{storeFilter && <input type="hidden" name="store" value={storeFilter} />}<input type="hidden" name="view" value="all" /><input name="q" defaultValue={q} placeholder="Search number, customer or project" aria-label="Search" /><button className="button button-orange" type="submit">Search</button></form>
    {shown.length === 0 ? <div className="admin-card"><p>Nothing here yet.</p></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Number</th><th>Customer</th><th>Project</th><th>Source</th>{admin.role === "super" && <th>Store</th>}<th>{kind === "quote" ? "Valid until" : "Due"}</th><th>Total</th><th>Status</th></tr></thead><tbody>
      {shown.map((doc) => <tr key={doc.id}>
        <td><Link href={`/admin/billing/${doc.id}`}><b>{doc.number}</b></Link><small>{formatDate(doc.issueDate)}</small></td>
        <td>{doc.customer.business || doc.customer.name}<small>{doc.customer.business ? doc.customer.name : doc.customer.email}</small></td>
        <td>{doc.title || "—"}</td>
        <td>{doc.origin.label}<small>{doc.origin.channel} · by {doc.origin.createdBy || doc.createdBy}</small></td>
        {admin.role === "super" && <td>{doc.store ? storeLabel(doc.store) : "—"}</td>}
        <td>{formatDate(doc.dueDate)}</td>
        <td>{formatAud(doc.totalCents)}</td>
        <td><span className={`bill-status is-${isOverdue(doc) ? "overdue" : doc.status}`}>{statusLabel(doc)}</span></td>
      </tr>)}
    </tbody></table></div>}
  </>;
}
