"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import type { BillingSettings } from "@/lib/billing";
import { saveSettings } from "../actions";

export function SettingsForm({ settings }: { settings: BillingSettings }) {
  const [state, action, pending] = useActionState(saveSettings, null);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); startTransition(() => action(form)); };
  const input = (name: keyof BillingSettings, label: string, extra: Record<string, string | number> = {}) => <div className="field"><label htmlFor={`s-${name}`}>{label}</label><input id={`s-${name}`} name={name} defaultValue={String(settings[name])} {...extra} /></div>;
  return <form onSubmit={submit} className="bill-editor">
    <section className="admin-card"><h2>Business</h2><div className="bill-grid">
      {input("businessName", "Business / trading name", { required: "required", maxLength: 120 })}
      {input("abn", "ABN", { inputMode: "numeric", placeholder: "11 digits" })}
      <div className="field bill-wide"><label htmlFor="s-address">Address</label><input id="s-address" name="address" defaultValue={settings.address} maxLength={300} /></div>
      {input("phone", "Phone")}{input("email", "Email", { type: "email" })}{input("website", "Website")}
      <label className="bill-check"><input type="checkbox" name="gstRegistered" defaultChecked={settings.gstRegistered} /> Registered for GST (adds 10% GST and titles invoices “Tax invoice”)</label>
    </div></section>
    <section className="admin-card"><h2>Payment details (printed on invoices)</h2><div className="bill-grid">
      {input("accountName", "Account name")}{input("bankName", "Bank")}{input("bsb", "BSB", { inputMode: "numeric", placeholder: "000-000" })}{input("accountNumber", "Account number", { inputMode: "numeric" })}
    </div></section>
    <section className="admin-card"><h2>Defaults & terms</h2><div className="bill-grid">
      {input("quoteValidDays", "Quotes valid for (days)", { type: "number", min: 0, max: 365 })}{input("paymentTermsDays", "Invoice payment terms (days)", { type: "number", min: 0, max: 365 })}
      <div className="field bill-wide"><label htmlFor="s-quoteTerms">Quote terms</label><textarea id="s-quoteTerms" name="quoteTerms" defaultValue={settings.quoteTerms} rows={3} maxLength={2000} /></div>
      <div className="field bill-wide"><label htmlFor="s-invoiceTerms">Invoice terms</label><textarea id="s-invoiceTerms" name="invoiceTerms" defaultValue={settings.invoiceTerms} rows={3} maxLength={2000} /></div>
    </div></section>
    <div className="bill-save">{state?.error && <p className="admin-error" role="alert">{state.error}</p>}{state?.ok && <p className="admin-ok" role="status">{state.ok}</p>}<button className="button button-orange" type="submit" disabled={pending}>{pending ? "Saving…" : "Save business details"}</button></div>
  </form>;
}
