"use server";

import { refresh } from "next/cache";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { envSuperAdmins, isStoreId, removeStaffMember, saveStaffMember, storeLabel } from "@/lib/staff";
import { isEmail } from "@/lib/validation";

export type StaffResult = { ok?: string; error?: string } | null;

export async function saveStaff(_: StaffResult, form: FormData): Promise<StaffResult> {
  const admin = await requireSuperAdmin();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const name = String(form.get("name") ?? "").trim().slice(0, 80);
  const role = String(form.get("role") ?? "");
  const store = String(form.get("store") ?? "");
  if (!isEmail(email) || email.length > 254) return { error: "Enter the staff member's Google account email." };
  if (envSuperAdmins().includes(email)) return { error: "That email is a permanent super admin (ADMIN_EMAILS)." };
  if (role !== "super" && role !== "store") return { error: "Choose a role." };
  if (role === "store" && !isStoreId(store)) return { error: "Choose the store they work at." };
  await saveStaffMember({ email, name, role, store: role === "store" && isStoreId(store) ? store : null }, admin.email);
  refresh();
  return { ok: `${email} saved as ${role === "super" ? "super admin" : `${storeLabel(store)} staff`}. They can sign in at /admin/login with Google.` };
}

export async function removeStaff(form: FormData) {
  const admin = await requireSuperAdmin();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!email || email === admin.email.toLowerCase() || envSuperAdmins().includes(email)) return;
  await removeStaffMember(email);
  refresh();
}
