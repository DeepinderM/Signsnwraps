import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { enquiryStatuses, listEnquiries } from "@/lib/services/enquiries";
import { fleetServices } from "@/lib/data/fleet";
import { AdminNav } from "../admin-nav";
import { isStoreId, storeLabel, stores } from "@/lib/staff";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Enquiries" };

const dateFormat = new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Melbourne" });
const tabs = [["open", "Open"], ["new", "New"], ["booking", "Appointments"], ["quote", "Quotes"], ["installer", "Installers"], ["fleet", "Fleet"], ["all", "All"]] as const;

export default async function AdminEnquiriesPage({ searchParams }: { searchParams: Promise<{ view?: string; store?: string }> }) {
  const admin = await requireAdmin();
  const isSuper = admin.role === "super";
  const { view = "open", store = "" } = await searchParams;
  // Store staff only ever load their own store's enquiries; super admins can filter by store or "unassigned".
  const all = await listEnquiries(300, isSuper ? undefined : admin.store ?? undefined);
  const storeFilter = isSuper && (store === "unassigned" || isStoreId(store)) ? store : "";
  const closed = new Set(["won", "lost", "closed"]);
  const unassigned = isSuper ? all.filter((item) => !item.store && !closed.has(item.status)).length : 0;
  const query = (next: { view?: string; store?: string }) => { const params = new URLSearchParams({ view: next.view ?? view, ...(next.store ?? storeFilter ? { store: next.store ?? storeFilter } : {}) }); return `/admin/enquiries?${params}`; };
  const enquiries = all.filter((item) => storeFilter === "" || (storeFilter === "unassigned" ? !item.store : item.store === storeFilter)).filter((item) => {
    if (view === "all") return true;
    if (view === "new") return item.status === "new";
    if (view === "booking" || view === "quote" || view === "installer") return item.type === view && !closed.has(item.status);
    if (view === "fleet") return fleetServices.includes(item.service);
    return !closed.has(item.status);
  });
  const label = (value: string) => enquiryStatuses.find((item) => item.value === value)?.label ?? value;

  return <>
    <AdminNav admin={{ email: admin.email, role: admin.role, store: admin.store }} />
    <div className="admin-head"><div><h1>{isSuper ? "Enquiries" : `${storeLabel(admin.store)} enquiries`}</h1><p>{isSuper ? "Every appointment, quote and installer request, newest first." : "Leads diverted to your store, newest first."} {all.filter((item) => item.status === "new").length} new{isSuper && <> · <Link className="text-link" href={query({ store: "unassigned", view: "open" })}>{unassigned} waiting to be diverted</Link></>}.</p></div></div>
    <nav className="admin-tabs" aria-label="Filter enquiries">{tabs.map(([value, text]) => <Link key={value} href={query({ view: value })} aria-current={view === value ? "page" : undefined}>{text}</Link>)}</nav>
    {isSuper && <nav className="admin-filters-row" aria-label="Filter by store"><span>Store:</span>{[["", "All stores"], ["unassigned", `Unassigned (${unassigned})`], ...stores.map((item) => [item.value, item.label])].map(([value, text]) => <Link key={value} href={query({ store: value })} aria-current={storeFilter === value ? "page" : undefined}>{text}</Link>)}</nav>}
    {enquiries.length === 0 ? <div className="admin-card"><p>No enquiries here yet.</p></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Received</th><th>Customer</th><th>Request</th><th>Service</th>{isSuper && <th>Store</th>}<th>Status</th></tr></thead><tbody>
      {enquiries.map((item) => <tr key={item.id}>
        <td>{item.createdAt ? dateFormat.format(item.createdAt) : "—"}</td>
        <td><Link href={`/admin/enquiries/${item.id}`}><b>{item.name}</b></Link><small>{item.business || item.email}</small></td>
        <td>{item.type === "installer" ? <>Installer application<small>{item.location}</small></> : item.type === "booking" ? <>Appointment<small>Prefers {item.date} · {item.time}</small></> : <>Quote{item.details?.["Fleet size"] && <small>{item.details["Fleet size"]}</small>}</>}</td>
        <td>{item.service}</td>
        {isSuper && <td>{item.store ? storeLabel(item.store) : <span className="admin-status is-new">Unassigned</span>}<small>{item.location ? `Customer: ${item.location}` : ""}</small></td>}
        <td><span className={`admin-status ${item.status === "new" ? "is-new" : ""}`}>{label(item.status)}</span></td>
      </tr>)}
    </tbody></table></div>}
  </>;
}
