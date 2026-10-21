import "server-only";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getStaffMember, type StaffRole, type StoreId } from "@/lib/staff";

export type Admin = { uid: string; email: string; name: string; role: StaffRole; store: StoreId | null };

/** Staff record for a verified email, or null (staff list in Firestore `staff` plus ADMIN_EMAILS). */
export async function staffAccess(email: string | undefined, emailVerified: boolean | undefined) {
  return email && emailVerified ? getStaffMember(email) : null;
}

/** The signed-in staff member, or null. Re-checks revocation and the staff list on every request. */
export async function getAdmin(): Promise<Admin | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const member = await staffAccess(user.email, user.emailVerified).catch(() => null);
  return member ? { uid: user.uid, email: user.email, name: member.name || user.name, role: member.role, store: member.store } : null;
}

export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/** Super admins only (products, orders, staff, diverting leads). Store staff go back to their enquiries. */
export async function requireSuperAdmin() {
  const admin = await requireAdmin();
  if (admin.role !== "super") redirect("/admin/enquiries");
  return admin;
}
