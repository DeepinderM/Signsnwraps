import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { enquiryStatuses, listEnquiries } from "@/lib/services/enquiries";
import { fleetServices } from "@/lib/data/fleet";
import { AdminNav } from "../admin-nav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Enquiries" };

const dateFormat = new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Melbourne" });
const tabs = [["open", "Open"], ["new", "New"], ["booking", "Appointments"], ["quote", "Quotes"], ["fleet", "Fleet"], ["all", "All"]] as const;

export default async function AdminEnquiriesPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const admin = await requireAdmin();
  const { view = "open" } = await searchParams;
  const all = await listEnquiries(300);
  const closed = new Set(["won", "lost", "closed"]);
  const enquiries = all.filter((item) => {
    if (view === "all") return true;
    if (view === "new") return item.status === "new";
    if (view === "booking" || view === "quote") return item.type === view && !closed.has(item.status);
    if (view === "fleet") return fleetServices.includes(item.service);
    return !closed.has(item.status);
  });
  const label = (value: string) => enquiryStatuses.find((item) => item.value === value)?.label ?? value;

  return <>
    <AdminNav email={admin.email} />
    <div className="admin-head"><div><h1>Enquiries</h1><p>Appointment and quote requests from the website, newest first. {all.filter((item) => item.status === "new").length} new.</p></div></div>
    <nav className="admin-tabs" aria-label="Filter enquiries">{tabs.map(([value, text]) => <Link key={value} href={`/admin/enquiries?view=${value}`} aria-current={view === value ? "page" : undefined}>{text}</Link>)}</nav>
    {enquiries.length === 0 ? <div className="admin-card"><p>No enquiries here yet.</p></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Received</th><th>Customer</th><th>Request</th><th>Service</th><th>Status</th></tr></thead><tbody>
      {enquiries.map((item) => <tr key={item.id}>
        <td>{item.createdAt ? dateFormat.format(item.createdAt) : "—"}</td>
        <td><Link href={`/admin/enquiries/${item.id}`}><b>{item.name}</b></Link><small>{item.business || item.email}</small></td>
        <td>{item.type === "booking" ? <>Appointment<small>Prefers {item.date} · {item.time}</small></> : <>Quote{item.details?.["Fleet size"] && <small>{item.details["Fleet size"]}</small>}</>}</td>
        <td>{item.service}</td>
        <td><span className={`admin-status ${item.status === "new" ? "is-new" : ""}`}>{label(item.status)}</span></td>
      </tr>)}
    </tbody></table></div>}
  </>;
}
