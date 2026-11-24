import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { listBillingDocs } from "@/lib/billing";
import { listPurchaseOrders } from "@/lib/purchase-orders";
import { formatAud } from "@/lib/shop/catalog";
import { isStoreId, storeLabel, stores } from "@/lib/staff";
import { PROGRESS_STAGES, poTotals, progressLabel } from "@/lib/vendor-types";
import { listVendors } from "@/lib/vendors";
import { hasUnread } from "@/lib/po-chat-types";
import { AdminNav } from "../admin-nav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Purchase orders" };

const date = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "Australia/Melbourne" });
const tabs = [["open", "Open jobs"], ["draft", "Drafts to send"], ["installed", "Installed"], ["all", "All"]] as const;

/** All purchase orders: drafts waiting to be sent, jobs in progress at the vendor, and finished ones. */
export default async function PurchaseOrdersPage({ searchParams }: { searchParams: Promise<{ view?: string; q?: string; store?: string; vendor?: string; progress?: string }> }) {
  const admin = await requireAdmin();
  const { view = "open", q = "", store: rawStore = "", vendor: vendorFilter = "", progress = "" } = await searchParams;
  const storeFilter = admin.role === "super" && isStoreId(rawStore) ? rawStore : "";
  const scope = admin.role === "super" ? undefined : admin.store ?? undefined;
  const [all, docs, vendors] = await Promise.all([listPurchaseOrders(scope), listBillingDocs(scope), listVendors()]);
  const byId = new Map(docs.map((doc) => [doc.id, doc]));
  const vendorName = (id: string, fallback: string) => vendors.find((vendor) => vendor.id === id)?.name ?? fallback;
  const rows = all.filter((po) => !storeFilter || po.store === storeFilter).map((po) => ({ po, doc: byId.get(po.id), totals: poTotals(po.lines, po.discountPercent) }));
  const month = new Date().toISOString().slice(0, 7), inMonth = (at: number) => !!at && new Date(at).toISOString().slice(0, 7) === month;
  const sent = rows.filter(({ po }) => po.status === "sent");
  const stats = [
    ["Drafts to send", String(rows.filter(({ po }) => po.status === "draft").length), "Accepted jobs without a sent PO"],
    ["Open jobs", String(sent.filter(({ po }) => po.progress !== "installed").length), `${sent.filter(({ po }) => po.progress === "new").length} not opened by the vendor yet`],
    ["Sent this month", formatAud(sent.filter(({ po }) => inMonth(po.sentAt)).reduce((sum, row) => sum + row.totals.totalCents, 0)), `${sent.filter(({ po }) => inMonth(po.sentAt)).length} PO${sent.filter(({ po }) => inMonth(po.sentAt)).length === 1 ? "" : "s"}, incl. GST`],
    ["Unread messages", String(rows.filter(({ po }) => hasUnread(po, "staff")).length), "Jobs where the vendor wrote last"],
    ["Installed this month", String(sent.filter(({ po }) => po.progress === "installed" && inMonth(po.progressAt)).length), "Jobs completed"],
  ];
  const query = q.trim().toLowerCase();
  const shown = rows.filter(({ po, doc }) => {
    if (query && !`${po.number} ${po.quoteNumber} ${po.invoiceNumber} ${po.supplier} ${doc?.title ?? ""} ${doc?.customer.name ?? ""} ${doc?.customer.business ?? ""}`.toLowerCase().includes(query)) return false;
    if (vendorFilter && po.vendorId !== vendorFilter) return false;
    if (progress && (po.status !== "sent" || po.progress !== progress)) return false;
    if (view === "draft") return po.status === "draft";
    if (view === "installed") return po.status === "sent" && po.progress === "installed";
    if (view === "open") return po.status === "sent" && po.progress !== "installed";
    return true;
  });
  const link = (next: Record<string, string>) => `/admin/purchase-orders?${new URLSearchParams(Object.fromEntries(Object.entries({ view, q, store: storeFilter, vendor: vendorFilter, progress, ...next }).filter(([, value]) => value)))}`;

  return <>
    <AdminNav admin={{ email: admin.email, role: admin.role, store: admin.store }} />
    <div className="admin-head"><div><h1>Purchase orders</h1><p>{admin.role === "super" ? "All stores." : `${storeLabel(admin.store)} store.`} Orders to vendors for accepted jobs, and where each job is.</p></div>
      {admin.role === "super" && <div className="admin-head-actions"><Link className="button button-light" href="/admin/billing/vendors">Vendors</Link></div>}</div>
    <div className="bill-stats">{stats.map(([label, value, detail]) => <div key={label}><span>{label}</span><b>{value}</b><small>{detail}</small></div>)}</div>
    <nav className="admin-filters-row" aria-label="Filter by status"><span>Show:</span>{tabs.map(([value, text]) => <Link key={value} href={link({ view: value, progress: "" })} aria-current={view === value && !progress ? "page" : undefined}>{text}</Link>)}</nav>
    <nav className="admin-filters-row" aria-label="Filter by progress"><span>Progress:</span>{[["", "Any"], ...PROGRESS_STAGES.map((stage) => [stage.key, stage.label])].map(([value, text]) => <Link key={value} href={link({ progress: value, view: value ? "all" : view })} aria-current={progress === value ? "page" : undefined}>{text}</Link>)}</nav>
    {vendors.length > 1 && <nav className="admin-filters-row" aria-label="Filter by vendor"><span>Vendor:</span>{[["", "All vendors"], ...vendors.map((vendor) => [vendor.id, vendor.name])].map(([value, text]) => <Link key={value} href={link({ vendor: value })} aria-current={vendorFilter === value ? "page" : undefined}>{text}</Link>)}</nav>}
    {admin.role === "super" && <nav className="admin-filters-row" aria-label="Filter by store"><span>Store:</span>{[["", "All stores"], ...stores.map((item) => [item.value, item.label])].map(([value, text]) => <Link key={value} href={link({ store: value })} aria-current={storeFilter === value ? "page" : undefined}>{text}</Link>)}</nav>}
    <form className="admin-filters" action="/admin/purchase-orders"><input type="hidden" name="view" value="all" />{storeFilter && <input type="hidden" name="store" value={storeFilter} />}{vendorFilter && <input type="hidden" name="vendor" value={vendorFilter} />}<input name="q" defaultValue={q} placeholder="Search PO, quote, invoice, customer or project" aria-label="Search" /><button className="button button-orange" type="submit">Search</button></form>
    {shown.length === 0 ? <div className="admin-card"><p>{rows.length ? "No purchase orders match these filters." : "No purchase orders yet. A draft is made automatically when a quote is accepted."}</p></div>
      : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>PO</th><th>Job</th><th>Vendor</th>{admin.role === "super" && <th>Store</th>}<th>Sent</th><th>Required by</th><th>PO total</th><th>Status</th><th>Progress</th></tr></thead><tbody>
        {shown.map(({ po, doc, totals }) => <tr key={po.id}>
          <td><Link href={`/admin/billing/${po.invoiceId || po.id}/purchase-order`}><b>{po.number}</b></Link>{hasUnread(po, "staff") && <Link className="chat-unread" href={`/admin/billing/${po.invoiceId || po.id}/purchase-order#chat`}>New message</Link>}<small>{[po.quoteNumber, po.invoiceNumber].filter(Boolean).join(" / ")}</small></td>
          <td>{doc?.title || "—"}<small>{doc ? doc.customer.business || doc.customer.name : ""}</small></td>
          <td>{vendorName(po.vendorId, po.supplier)}<small>{po.discountPercent ? `${po.discountPercent}% franchise discount` : ""}</small></td>
          {admin.role === "super" && <td>{po.store ? storeLabel(po.store) : "—"}</td>}
          <td>{po.sentAt ? date.format(po.sentAt) : "—"}<small>{po.sentBy ? `by ${po.sentBy}` : ""}</small></td>
          <td>{po.requiredBy ? date.format(new Date(`${po.requiredBy}T00:00:00`)) : "—"}</td>
          <td>{formatAud(totals.totalCents)}<small>{po.lines.filter((line) => line.include).length} item{po.lines.filter((line) => line.include).length === 1 ? "" : "s"}</small></td>
          <td><span className={`bill-status is-${po.status === "sent" ? "accepted" : "draft"}`}>{po.status === "sent" ? "Sent" : "Draft"}</span></td>
          <td>{po.status === "sent" ? <span className={`progress-badge is-${po.progress}`}>{progressLabel(po.progress)}</span> : "—"}{po.status === "sent" && po.progressAt > 0 && <small>{date.format(po.progressAt)}</small>}</td>
        </tr>)}
      </tbody></table></div>}
  </>;
}
