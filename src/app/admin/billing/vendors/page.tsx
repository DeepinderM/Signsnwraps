import type { Metadata } from "next";
import Link from "next/link";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { stores } from "@/lib/staff";
import { listVendors } from "@/lib/vendors";
import { AdminNav } from "../../admin-nav";
import { VendorForm } from "./vendor-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Vendors" };

/** Super admin: the vendors purchase orders go to, and each store's franchise discount with them. */
export default async function VendorsPage() {
  const admin = await requireSuperAdmin();
  const vendors = await listVendors();
  const storeList = stores.map((store) => ({ value: store.value, label: store.label }));
  return <>
    <AdminNav admin={{ email: admin.email, role: admin.role, store: admin.store }} />
    <Link className="text-link" href="/admin/billing">← Quotes & invoices</Link>
    <div className="admin-head"><div><h1>Vendors</h1><p>Who purchase orders go to, and the franchise discount each store gets off the invoice price.</p></div></div>
    <div className="po-form">
      {vendors.map((vendor) => <VendorForm key={vendor.id} vendor={vendor} stores={storeList} />)}
      <VendorForm vendor={null} stores={storeList} />
    </div>
  </>;
}
