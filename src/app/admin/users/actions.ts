"use server";

import { refresh } from "next/cache";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { envSuperAdmins, isStoreId, removeStaffMember, saveStaffMember, storeLabel } from "@/lib/staff";
import { getDirectoryUser, setUserDisabled } from "@/lib/users";

export type UserResult = { ok?: string; error?: string } | null;

const validUid = (value: string) => /^[A-Za-z0-9_-]{1,128}$/.test(value);

/** Loads the target account and refuses changes to yourself or to permanent (ADMIN_EMAILS) super admins. */
async function editableUser(form: FormData) {
  const admin = await requireSuperAdmin();
  const uid = String(form.get("uid") ?? "");
  const user = validUid(uid) ? await getDirectoryUser(uid) : null;
  if (!user) return { admin, user: null, error: "Account not found." };
  if (user.uid === admin.uid) return { admin, user: null, error: "You can't change your own access." };
  if (envSuperAdmins().includes(user.email.toLowerCase())) return { admin, user: null, error: "This is a permanent super admin (ADMIN_EMAILS)." };
  return { admin, user, error: null };
}

export async function changeRole(_: UserResult, form: FormData): Promise<UserResult> {
  const { admin, user, error } = await editableUser(form);
  if (!user) return { error: error ?? "Account not found." };
  const role = String(form.get("role") ?? "");
  const store = String(form.get("store") ?? "");
  if (!user.email) return { error: "This account has no email address, so it can't be staff." };
  if (role === "customer") {
    if (user.staff) await removeStaffMember(user.email);
    refresh();
    return { ok: "Now a customer only. Admin access removed." };
  }
  if (role !== "super" && role !== "store") return { error: "Choose a role." };
  if (role === "store" && !isStoreId(store)) return { error: "Choose the store." };
  if (!user.emailVerified) return { error: "Their email isn't verified yet. Staff need a verified email (Google sign-in is verified automatically)." };
  await saveStaffMember({ email: user.email, name: user.name, role, store: role === "store" && isStoreId(store) ? store : null }, admin.email);
  refresh();
  return { ok: role === "super" ? "Now a super admin." : `Now ${storeLabel(store)} store staff.` };
}

export async function toggleBlocked(_: UserResult, form: FormData): Promise<UserResult> {
  const { user, error } = await editableUser(form);
  if (!user?.uid) return { error: error ?? "Account not found." };
  await setUserDisabled(user.uid, !user.disabled);
  refresh();
  return { ok: user.disabled ? "Account unblocked. They can sign in again." : "Account blocked and signed out on all devices." };
}
