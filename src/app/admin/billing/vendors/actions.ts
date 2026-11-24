"use server";

import { refresh } from "next/cache";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { stores } from "@/lib/staff";
import { isEmail } from "@/lib/validation";
import type { Vendor } from "@/lib/vendor-types";
import { saveVendor } from "@/lib/vendors";

export type VendorResult = { ok?: string; error?: string } | null;

const percent = (raw: FormDataEntryValue | null) => {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  const value = Number(text);
  return Number.isFinite(value) && value >= 0 && value <= 100 ? Math.round(value * 100) / 100 : NaN;
};

/** Super admin: add or update a vendor (name, PO emails, franchise discount: default and per store). */
export async function saveVendorAction(_: VendorResult, form: FormData): Promise<VendorResult> {
  const admin = await requireSuperAdmin();
  const id = String(form.get("id") ?? "").trim();
  if (id && !/^[A-Za-z0-9_-]{1,64}$/.test(id)) return { error: "Unknown vendor." };
  const name = String(form.get("name") ?? "").trim().slice(0, 120);
  if (!name) return { error: "Give the vendor a name." };
  const emails = [...new Set(String(form.get("emails") ?? "").split(/[\s,;]+/).map((value) => value.trim().toLowerCase()).filter(Boolean))];
  if (!emails.length) return { error: "Add at least one email address for purchase orders." };
  const bad = emails.find((value) => !isEmail(value));
  if (bad) return { error: `${bad} isn't a valid email address.` };
  const loginEmails = [...new Set(String(form.get("loginEmails") ?? "").split(/[\s,;]+/).map((value) => value.trim().toLowerCase()).filter(Boolean))].slice(0, 20);
  const badLogin = loginEmails.find((value) => !isEmail(value));
  if (badLogin) return { error: `${badLogin} isn't a valid login email.` };
  const discountPercent = percent(form.get("discountPercent")) ?? 0;
  if (Number.isNaN(discountPercent)) return { error: "The default discount must be between 0 and 100%." };
  const storeDiscounts: Vendor["storeDiscounts"] = {};
  for (const store of stores) {
    const value = percent(form.get(`store-${store.value}`));
    if (Number.isNaN(value)) return { error: `The ${store.label} discount must be between 0 and 100% (or blank to use the default).` };
    if (value !== null) storeDiscounts[store.value] = value;
  }
  await saveVendor(id || null, { name, emails, loginEmails, discountPercent, storeDiscounts, active: form.get("active") === "on" }, admin.name || admin.email);
  refresh();
  return { ok: `${name} saved.` };
}
