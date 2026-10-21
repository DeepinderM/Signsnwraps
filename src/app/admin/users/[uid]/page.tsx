import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { getDirectoryUser, roleLabel } from "@/lib/users";
import { listOrdersForUser } from "@/lib/shop/orders";
import { enquiryStatuses, listEnquiries } from "@/lib/services/enquiries";
import { formatAud, orderStatuses } from "@/lib/shop/catalog";
import { envSuperAdmins, storeLabel, stores } from "@/lib/staff";
import { AdminNav } from "../../admin-nav";
import { EmailThread } from "@/app/admin/email-composer";
import { emailMode, getThread } from "@/lib/email";
import { userTemplates } from "@/lib/email-templates";
import { BlockForm, RoleForm } from "./user-forms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "User" };

const dateFormat = new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Melbourne" });

export default async function AdminUserPage({ params }: { params: Promise<{ uid: string }> }) {
  const admin = await requireSuperAdmin();
  const { uid } = await params;
  const user = /^[A-Za-z0-9_-]{1,128}$/.test(uid) ? await getDirectoryUser(uid) : null;
  if (!user?.uid) notFound();
  const [orders, enquiries, thread] = await Promise.all([
    listOrdersForUser({ uid: user.uid, email: user.email, emailVerified: user.emailVerified }),
    listEnquiries(1000).then((items) => items.filter((item) => item.email.toLowerCase() === user.email.toLowerCase())),
    // Everything this person has been emailed, from enquiries and orders too.
    user.email ? getThread({ type: "user", id: user.uid }, user.email) : [],
  ]);
  const locked = user.uid === admin.uid ? "This is your account." : envSuperAdmins().includes(user.email.toLowerCase()) ? "Permanent super admin (set in ADMIN_EMAILS)." : null;
  const statusLabel = (list: { value: string; label: string }[], value: string) => list.find((item) => item.value === value)?.label ?? value;

  return <>
    <AdminNav admin={{ email: admin.email, role: admin.role, store: admin.store }} />
    <Link className="text-link" href="/admin/users">← Users</Link>
    <div className="admin-head"><div><h1>{user.name || user.email || "No name"}</h1><p>{user.email}{user.phone && ` · ${user.phone}`}</p></div><div className="admin-head-badges"><span className={`admin-role is-${user.kind}`}>{roleLabel(user)}</span>{user.disabled && <span className="admin-role is-blocked">Blocked</span>}</div></div>
    <div className="admin-order-grid">
      <section className="admin-card"><h2>Account</h2><table className="admin-table"><tbody>
        <tr><th>Sign-in method</th><td>{user.provider}</td></tr>
        <tr><th>Email verified</th><td>{user.emailVerified ? "Yes" : "No"}</td></tr>
        <tr><th>Joined</th><td>{user.createdAt ? dateFormat.format(user.createdAt) : "—"}</td></tr>
        <tr><th>Last sign-in</th><td>{user.lastSignInAt ? dateFormat.format(user.lastSignInAt) : "—"}</td></tr>
        <tr><th>Orders</th><td>{orders.length} · {formatAud(orders.reduce((sum, order) => sum + order.totalCents, 0))}</td></tr>
        <tr><th>User ID</th><td><small>{user.uid}</small></td></tr>
      </tbody></table></section>
      <section className="admin-card"><h2>Access</h2>
        {locked ? <p className="admin-hint">{locked} Access can't be changed here.</p> : <>
          <p className="admin-hint">Store staff see only leads diverted to their store. Super admins see everything.</p>
          <RoleForm uid={user.uid} role={user.kind} store={user.staff?.store ?? null} stores={stores} />
          <h2 className="admin-subhead">Sign-in</h2>
          <p className="admin-hint">{user.disabled ? "This account is blocked and can't sign in." : "Blocking stops them signing in and signs them out on every device."}</p>
          <BlockForm uid={user.uid} disabled={user.disabled} />
        </>}
      </section>
      <section className="admin-card admin-card-wide" id="email"><h2>Emails</h2>{user.email ? <EmailThread to={user.email} name={user.name} contextType="user" contextId={user.uid} mode={emailMode()} thread={thread} templates={userTemplates({ name: user.name, staff: admin.name || "The Signsnwraps team" })} /> : <p className="admin-hint">No email address on this account.</p>}</section>
      <section className="admin-card"><h2>Orders</h2>{orders.length === 0 ? <p className="admin-hint">No orders.</p> : <table className="admin-table"><tbody>{orders.map((order) => <tr key={order.id}><td><Link href={`/admin/orders/${order.id}`}><b>{order.orderNumber}</b></Link><small>{dateFormat.format(order.createdAt)}</small></td><td>{formatAud(order.totalCents)}</td><td>{statusLabel(orderStatuses, order.status)}</td></tr>)}</tbody></table>}</section>
      <section className="admin-card"><h2>Enquiries</h2>{enquiries.length === 0 ? <p className="admin-hint">No enquiries with this email.</p> : <table className="admin-table"><tbody>{enquiries.map((item) => <tr key={item.id}><td><Link href={`/admin/enquiries/${item.id}`}><b>{item.service}</b></Link><small>{item.createdAt ? dateFormat.format(item.createdAt) : ""}</small></td><td>{storeLabel(item.store)}</td><td>{statusLabel(enquiryStatuses, item.status)}</td></tr>)}</tbody></table>}</section>
    </div>
  </>;
}
