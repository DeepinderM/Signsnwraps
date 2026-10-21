import "server-only";
import { cache } from "react";
import { FieldValue } from "firebase-admin/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase/admin";
import { serviceRegions } from "@/lib/data/content";

// Staff directory in Firestore `staff/{lowercase email}`.
// - super: sees everything, diverts leads to stores, manages products, orders and staff.
// - store: sees only the enquiries diverted to their store.
// Emails in ADMIN_EMAILS are always super admins (bootstrap; they can't be removed from the admin page).

export type StoreId = (typeof serviceRegions)[number]["value"];
export type StaffRole = "super" | "store";
export type StaffMember = { email: string; name: string; role: StaffRole; store: StoreId | null; fromEnv?: boolean };

export const stores = serviceRegions.map(({ value, label }) => ({ value: value as StoreId, label }));
export const isStoreId = (value: unknown): value is StoreId => stores.some((store) => store.value === value);
export const storeLabel = (value: string | null | undefined) => stores.find((store) => store.value === value)?.label ?? "Unassigned";
/** Store matching the region a customer picked on a form (enquiries store the region label). */
export const storeForRegion = (location: string) => stores.find((store) => store.label === location || store.value === location)?.value ?? null;

export function envSuperAdmins() {
  return (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
}

const staffCollection = () => db().collection("staff");

function toMember(email: string, data: FirebaseFirestore.DocumentData): StaffMember | null {
  const role: StaffRole | null = data.role === "super" ? "super" : data.role === "store" && isStoreId(data.store) ? "store" : null;
  return role ? { email, name: typeof data.name === "string" ? data.name : "", role, store: role === "store" ? data.store : null } : null;
}

/** Staff record for an email, or null. Cached per request. */
export const getStaffMember = cache(async (rawEmail: string): Promise<StaffMember | null> => {
  const email = rawEmail.trim().toLowerCase();
  if (!email) return null;
  if (envSuperAdmins().includes(email)) return { email, name: "", role: "super", store: null, fromEnv: true };
  if (!isFirebaseConfigured()) return null;
  const doc = await staffCollection().doc(email).get();
  return doc.exists ? toMember(email, doc.data()!) : null;
});

export async function listStaff(): Promise<StaffMember[]> {
  const snapshot = await staffCollection().get();
  const members = snapshot.docs.map((doc) => toMember(doc.id, doc.data())).filter((member): member is StaffMember => member !== null);
  const env = envSuperAdmins().filter((email) => !members.some((member) => member.email === email)).map((email): StaffMember => ({ email, name: "", role: "super", store: null, fromEnv: true }));
  return [...env, ...members.map((member) => envSuperAdmins().includes(member.email) ? { ...member, role: "super" as const, store: null, fromEnv: true } : member)]
    .sort((a, b) => (a.role === b.role ? 0 : a.role === "super" ? -1 : 1) || storeLabel(a.store).localeCompare(storeLabel(b.store)) || a.email.localeCompare(b.email));
}

/** Emails of the staff working at a store, used for assignment alerts. */
export async function storeStaffEmails(store: StoreId) {
  const snapshot = await staffCollection().where("store", "==", store).get();
  return snapshot.docs.filter((doc) => doc.data().role === "store").map((doc) => doc.id);
}

export async function saveStaffMember(member: { email: string; name: string; role: StaffRole; store: StoreId | null }, by: string) {
  await staffCollection().doc(member.email.toLowerCase()).set({ name: member.name, role: member.role, store: member.role === "store" ? member.store : null, updatedBy: by, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

export async function removeStaffMember(email: string) {
  await staffCollection().doc(email.toLowerCase()).delete();
}
