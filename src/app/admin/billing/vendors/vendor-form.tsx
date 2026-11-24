"use client";

import { useActionState } from "react";
import type { Vendor } from "@/lib/vendor-types";
import { saveVendorAction } from "./actions";

/** One vendor's details: name, PO emails, the franchise discount (default, and per store when it differs). */
export function VendorForm({ vendor, stores }: { vendor: Vendor | null; stores: { value: string; label: string }[] }) {
  const [state, save, saving] = useActionState(saveVendorAction, null);
  const key = vendor?.id ?? "new";
  return <form action={save} className="admin-card vendor-form">
    <input type="hidden" name="id" value={vendor?.id ?? ""} />
    <h2>{vendor ? vendor.name : "Add a vendor"}</h2>
    <div className="po-grid">
      <div className="field"><label htmlFor={`v-name-${key}`}>Name</label><input id={`v-name-${key}`} name="name" defaultValue={vendor?.name ?? ""} required maxLength={120} /></div>
      <div className="field"><label htmlFor={`v-emails-${key}`}>Purchase order emails</label><input id={`v-emails-${key}`} name="emails" defaultValue={vendor?.emails.join(", ") ?? ""} placeholder="orders@vendor.com.au, production@vendor.com.au" required /><small>Separate several with commas. Sales can still add or remove addresses on each PO.</small></div>
    </div>
    <div className="field"><label htmlFor={`v-login-${key}`}>Dashboard login emails</label><input id={`v-login-${key}`} name="loginEmails" defaultValue={vendor?.loginEmails.join(", ") ?? ""} placeholder="name@vendor.com.au" />
      <small>People who can sign in at /vendor/login to see this vendor's jobs. They sign in with Google or create an account with this email and verify it.{vendor && <> <a href={`/vendor?vendor=${vendor.id}`} target="_blank" rel="noreferrer">Preview their dashboard</a></>}</small></div>
    <h3>Franchise discount off the invoice price</h3>
    <div className="vendor-discounts">
      <div className="field"><label htmlFor={`v-default-${key}`}>Default (%)</label><input id={`v-default-${key}`} name="discountPercent" inputMode="decimal" defaultValue={vendor ? String(vendor.discountPercent) : "0"} /></div>
      {stores.map((store) => <div key={store.value} className="field"><label htmlFor={`v-${store.value}-${key}`}>{store.label} (%)</label><input id={`v-${store.value}-${key}`} name={`store-${store.value}`} inputMode="decimal" defaultValue={vendor?.storeDiscounts[store.value as keyof Vendor["storeDiscounts"]]?.toString() ?? ""} placeholder={`Default${vendor ? ` (${vendor.discountPercent})` : ""}`} /></div>)}
    </div>
    <small className="admin-hint">Leave a store blank to use the default. The discount is applied on every PO for that store and can't be changed by sales.</small>
    <label className="vendor-active"><input type="checkbox" name="active" defaultChecked={vendor ? vendor.active : true} /> Available on purchase orders</label>
    {state?.error && <p className="admin-error" role="alert">{state.error}</p>}
    {state?.ok && <p className="admin-ok" role="status">{state.ok}</p>}
    <button type="submit" className="button button-orange" disabled={saving}>{saving ? "Saving…" : vendor ? "Save" : "Add vendor"}</button>
  </form>;
}
