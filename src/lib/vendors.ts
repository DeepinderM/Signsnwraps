import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase/admin";
import { isStoreId, type StoreId } from "@/lib/staff";
import { DEFAULT_PO_RECIPIENT, DEFAULT_SUPPLIER, DEFAULT_VENDOR_ID, type Vendor } from "@/lib/vendor-types";

// Vendors (manufacturers) that purchase orders go to, managed by the super admin. Each vendor has the emails POs
// are sent to and the franchise discount off the invoice price: one default %, optionally a different % per store.

const vendors = () => db().collection("vendors");
const percent = (value: unknown) => (typeof value === "number" && value >= 0 && value <= 100 ? Math.round(value * 100) / 100 : 0);

/** Quick Signage is always available until the super admin sets vendors up. */
const QUICK_SIGNAGE: Vendor = { id: DEFAULT_VENDOR_ID, name: DEFAULT_SUPPLIER, emails: [DEFAULT_PO_RECIPIENT], loginEmails: [], discountPercent: 40, storeDiscounts: {}, active: true };

function toVendor(id: string, data: FirebaseFirestore.DocumentData): Vendor {
  const storeDiscounts: Partial<Record<StoreId, number>> = {};
  for (const [store, value] of Object.entries(data.storeDiscounts ?? {})) if (isStoreId(store) && typeof value === "number") storeDiscounts[store] = percent(value);
  return { id, name: data.name ?? id, emails: Array.isArray(data.emails) ? data.emails : [], loginEmails: Array.isArray(data.loginEmails) ? data.loginEmails : [], discountPercent: percent(data.discountPercent), storeDiscounts, active: data.active !== false };
}

/** All vendors, Quick Signage first (and always present: the saved record if there is one, else the default). */
export async function listVendors({ activeOnly = false } = {}) {
  const snap = await vendors().get();
  const list = snap.docs.map((doc) => toVendor(doc.id, doc.data()));
  if (!list.some((vendor) => vendor.id === QUICK_SIGNAGE.id)) list.unshift(QUICK_SIGNAGE);
  list.sort((a, b) => (a.id === QUICK_SIGNAGE.id ? -1 : b.id === QUICK_SIGNAGE.id ? 1 : a.name.localeCompare(b.name)));
  return activeOnly ? list.filter((vendor) => vendor.active) : list;
}

export async function getVendor(id: string) {
  return (await listVendors()).find((vendor) => vendor.id === id) ?? null;
}

export async function saveVendor(id: string | null, vendor: Omit<Vendor, "id">, by: string) {
  const ref = id ? vendors().doc(id) : vendors().doc();
  await ref.set({ ...vendor, updatedBy: by, updatedAt: FieldValue.serverTimestamp() });
  return ref.id;
}

/** The active vendor a (lowercase) login email belongs to, or null. */
export async function vendorForLogin(email: string) {
  if (!email) return null;
  return (await listVendors({ activeOnly: true })).find((vendor) => vendor.loginEmails.includes(email.toLowerCase())) ?? null;
}
