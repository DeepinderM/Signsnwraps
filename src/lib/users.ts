import "server-only";
import type { UserRecord } from "firebase-admin/auth";
import { adminAuth, db } from "@/lib/firebase/admin";
import { listStaff, storeLabel, type StaffMember } from "@/lib/staff";

// Super-admin view of every account: Firebase Auth users joined with their profile (users/{uid})
// and their staff record, plus staff who were added but haven't signed in yet.

export type UserKind = "customer" | "store" | "super";

export type DirectoryUser = {
  uid: string | null;
  email: string;
  name: string;
  phone: string;
  emailVerified: boolean;
  disabled: boolean;
  provider: string;
  createdAt: number;
  lastSignInAt: number;
  kind: UserKind;
  staff: StaffMember | null;
};

export const roleLabel = (user: Pick<DirectoryUser, "kind" | "staff">) => user.kind === "super" ? "Super admin" : user.kind === "store" ? `${storeLabel(user.staff?.store)} staff` : "Customer";

const MAX_USERS = 5000;

async function allAuthUsers() {
  const users: UserRecord[] = [];
  let pageToken: string | undefined;
  do {
    const page = await adminAuth().listUsers(1000, pageToken);
    users.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken && users.length < MAX_USERS);
  return users;
}

const providerName = (user: UserRecord) => {
  const ids = user.providerData.map((item) => item.providerId);
  return ids.includes("google.com") ? "Google" : ids.includes("password") ? "Email & password" : ids[0] ?? "—";
};

const toMillis = (value: string | undefined) => (value ? new Date(value).getTime() || 0 : 0);

async function profilesFor(uids: string[]) {
  const map = new Map<string, { name: string; phone: string }>();
  for (let index = 0; index < uids.length; index += 300) {
    const refs = uids.slice(index, index + 300).map((uid) => db().collection("users").doc(uid));
    if (!refs.length) continue;
    for (const doc of await db().getAll(...refs)) if (doc.exists) map.set(doc.id, { name: doc.get("name") ?? "", phone: doc.get("phone") ?? "" });
  }
  return map;
}

function toDirectoryUser(user: UserRecord, profile: { name: string; phone: string } | undefined, staff: StaffMember | undefined): DirectoryUser {
  // Staff access needs a verified email (see admin-auth.ts), so an unverified account stays a customer.
  const member = staff && user.emailVerified ? staff : null;
  return {
    uid: user.uid, email: user.email ?? "", name: profile?.name || user.displayName || member?.name || "", phone: profile?.phone || user.phoneNumber || "",
    emailVerified: user.emailVerified, disabled: user.disabled, provider: providerName(user),
    createdAt: toMillis(user.metadata.creationTime), lastSignInAt: toMillis(user.metadata.lastSignInTime),
    kind: member?.role ?? "customer", staff: member,
  };
}

export async function listDirectory(): Promise<DirectoryUser[]> {
  const [authUsers, staff] = await Promise.all([allAuthUsers(), listStaff()]);
  const staffByEmail = new Map(staff.map((member) => [member.email, member]));
  const profiles = await profilesFor(authUsers.map((user) => user.uid));
  const users = authUsers.map((user) => toDirectoryUser(user, profiles.get(user.uid), staffByEmail.get((user.email ?? "").toLowerCase())));
  const signedUp = new Set(users.map((user) => user.email.toLowerCase()));
  // Staff added on the Staff page who haven't created their login yet.
  const pending = staff.filter((member) => !signedUp.has(member.email)).map((member): DirectoryUser => ({
    uid: null, email: member.email, name: member.name, phone: "", emailVerified: false, disabled: false, provider: "Not signed in yet",
    createdAt: 0, lastSignInAt: 0, kind: member.role, staff: member,
  }));
  return [...users, ...pending].sort((a, b) => b.createdAt - a.createdAt);
}

export async function getDirectoryUser(uid: string): Promise<DirectoryUser | null> {
  const user = await adminAuth().getUser(uid).catch(() => null);
  if (!user) return null;
  const [profiles, staff] = await Promise.all([profilesFor([uid]), listStaff()]);
  return toDirectoryUser(user, profiles.get(uid), staff.find((member) => member.email === (user.email ?? "").toLowerCase()));
}

/** Blocks or restores sign-in. Blocking also signs the user out everywhere. */
export async function setUserDisabled(uid: string, disabled: boolean) {
  await adminAuth().updateUser(uid, { disabled });
  if (disabled) await adminAuth().revokeRefreshTokens(uid);
}
