import "server-only";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
}

export function isAllowedAdmin(email: string | undefined, emailVerified: boolean | undefined) {
  return Boolean(email && emailVerified && adminEmails().includes(email.toLowerCase()));
}

/** The signed-in staff member, or null. Re-checks revocation and the allow-list on every call. */
export async function getAdmin() {
  const user = await getSessionUser();
  return user && isAllowedAdmin(user.email, user.emailVerified) ? { uid: user.uid, email: user.email } : null;
}

export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
