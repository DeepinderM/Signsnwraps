import type { Metadata } from "next";
import Link from "next/link";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { getBillingSettings } from "@/lib/billing";
import { AdminNav } from "../../admin-nav";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Business details" };

export default async function BillingSettingsPage() {
  const admin = await requireSuperAdmin();
  const settings = await getBillingSettings();
  return <>
    <AdminNav admin={{ email: admin.email, role: admin.role, store: admin.store }} />
    <Link className="text-link" href="/admin/billing">← Quotes & invoices</Link>
    <div className="admin-head"><div><h1>Business details</h1><p>Printed on every quote and invoice. A tax invoice must show your business name and ABN.</p></div></div>
    <SettingsForm settings={settings} />
  </>;
}
