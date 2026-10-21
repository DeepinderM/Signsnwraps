import type { Metadata } from "next";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { listStaff, storeLabel, stores } from "@/lib/staff";
import { AdminNav } from "../admin-nav";
import { removeStaff } from "./actions";
import { StaffForm } from "./staff-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Staff" };

export default async function AdminStaffPage() {
  const admin = await requireSuperAdmin();
  const staff = await listStaff();
  return <>
    <AdminNav admin={{ email: admin.email, role: admin.role, store: admin.store }} />
    <div className="admin-head"><div><h1>Staff & stores</h1><p>Store staff only see the leads you divert to their store. Super admins see everything and manage orders, products and staff.</p></div></div>
    <section className="admin-card"><h2>Add or update a staff member</h2><p className="admin-hint">Use the Google account they'll sign in with. Saving an existing email updates their role or store.</p><StaffForm stores={stores} /></section>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Staff member</th><th>Role</th><th>Store</th><th></th></tr></thead><tbody>
      {staff.map((member) => <tr key={member.email}>
        <td><b>{member.name || member.email}</b>{member.name && <small>{member.email}</small>}</td>
        <td>{member.role === "super" ? "Super admin" : "Store staff"}</td>
        <td>{member.role === "super" ? "All stores" : storeLabel(member.store)}</td>
        <td className="admin-row-actions">{member.fromEnv ? <small>Permanent (ADMIN_EMAILS)</small> : member.email === admin.email.toLowerCase() ? <small>You</small> : <form action={removeStaff}><input type="hidden" name="email" value={member.email} /><button className="admin-status" type="submit">Remove</button></form>}</td>
      </tr>)}
    </tbody></table></div>
  </>;
}
