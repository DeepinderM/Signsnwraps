import type { Metadata } from "next";
import Link from "next/link";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { listDirectory, roleLabel, type DirectoryUser } from "@/lib/users";
import { listOrders } from "@/lib/shop/orders";
import { listEnquiries } from "@/lib/services/enquiries";
import { formatAud } from "@/lib/shop/catalog";
import { stores } from "@/lib/staff";
import { AdminNav } from "../admin-nav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Users" };

const dateFormat = new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeZone: "Australia/Melbourne" });
const tabs = [["all", "All users"], ["customer", "Customers"], ["store", "Store staff"], ["super", "Super admins"], ["blocked", "Blocked"]] as const;

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ view?: string; q?: string; store?: string }> }) {
  const admin = await requireSuperAdmin();
  const { view = "all", q = "", store = "" } = await searchParams;
  const [users, orders, enquiries] = await Promise.all([listDirectory(), listOrders(1000), listEnquiries(1000)]);

  // Orders are linked by account, or by email for orders placed before signing in.
  const spend = new Map<string, { count: number; cents: number }>();
  for (const order of orders) {
    const key = order.userId || `email:${order.customer.email.toLowerCase()}`;
    const current = spend.get(key) ?? { count: 0, cents: 0 };
    spend.set(key, { count: current.count + 1, cents: current.cents + order.totalCents });
  }
  const orderStats = (user: DirectoryUser) => {
    const byUid = user.uid ? spend.get(user.uid) : undefined;
    const byEmail = user.emailVerified ? spend.get(`email:${user.email.toLowerCase()}`) : undefined;
    return { count: (byUid?.count ?? 0) + (byEmail?.count ?? 0), cents: (byUid?.cents ?? 0) + (byEmail?.cents ?? 0) };
  };
  const enquiryCount = new Map<string, number>();
  for (const item of enquiries) enquiryCount.set(item.email.toLowerCase(), (enquiryCount.get(item.email.toLowerCase()) ?? 0) + 1);

  const query = q.trim().toLowerCase();
  const counts = { all: users.length, customer: users.filter((u) => u.kind === "customer").length, store: users.filter((u) => u.kind === "store").length, super: users.filter((u) => u.kind === "super").length, blocked: users.filter((u) => u.disabled).length };
  const shown = users
    .filter((user) => view === "all" || (view === "blocked" ? user.disabled : user.kind === view))
    .filter((user) => view !== "store" || !store || user.staff?.store === store)
    .filter((user) => !query || `${user.name} ${user.email} ${user.phone}`.toLowerCase().includes(query));
  const link = (next: Record<string, string>) => `/admin/users?${new URLSearchParams({ view, ...(q ? { q } : {}), ...next })}`;

  return <>
    <AdminNav admin={{ email: admin.email, role: admin.role, store: admin.store }} />
    <div className="admin-head"><div><h1>Users</h1><p>Every account on the site: {counts.customer} customers, {counts.store} store staff, {counts.super} super admins.</p></div><Link className="button button-light" href="/admin/staff">Add staff by email</Link></div>
    <nav className="admin-tabs" aria-label="Filter users">{tabs.map(([value, text]) => <Link key={value} href={`/admin/users?${new URLSearchParams({ view: value, ...(q ? { q } : {}) })}`} aria-current={view === value ? "page" : undefined}>{text} ({counts[value]})</Link>)}</nav>
    {view === "store" && <nav className="admin-filters-row" aria-label="Filter by store"><span>Store:</span>{[["", "All stores"], ...stores.map((item) => [item.value, item.label])].map(([value, text]) => <Link key={value} href={link({ store: value })} aria-current={store === value ? "page" : undefined}>{text}</Link>)}</nav>}
    <form className="admin-filters" action="/admin/users"><input type="hidden" name="view" value={view} /><input name="q" defaultValue={q} placeholder="Search name, email or phone" aria-label="Search users" /><button className="button button-orange" type="submit">Search</button>{q && <Link className="button button-light" href={`/admin/users?view=${view}`}>Clear</Link>}</form>
    {shown.length === 0 ? <div className="admin-card"><p>No users match.</p></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>User</th><th>Access</th><th>Sign-in</th><th>Joined</th><th>Last active</th><th>Orders</th><th>Enquiries</th></tr></thead><tbody>
      {shown.map((user) => { const stats = orderStats(user); return <tr key={user.uid ?? user.email}>
        <td>{user.uid ? <Link href={`/admin/users/${user.uid}`}><b>{user.name || user.email || "No name"}</b></Link> : <b>{user.name || user.email}</b>}<small>{user.name ? user.email : ""}{user.phone ? `${user.name ? " · " : ""}${user.phone}` : ""}</small></td>
        <td><span className={`admin-role is-${user.kind}`}>{roleLabel(user)}</span>{user.disabled && <span className="admin-role is-blocked">Blocked</span>}</td>
        <td>{user.provider}{user.uid && !user.emailVerified && <small>Email not verified</small>}</td>
        <td>{user.createdAt ? dateFormat.format(user.createdAt) : "—"}</td>
        <td>{user.lastSignInAt ? dateFormat.format(user.lastSignInAt) : "—"}</td>
        <td>{stats.count ? <>{stats.count}<small>{formatAud(stats.cents)}</small></> : "—"}</td>
        <td>{enquiryCount.get(user.email.toLowerCase()) ?? "—"}</td>
      </tr>; })}
    </tbody></table></div>}
  </>;
}
