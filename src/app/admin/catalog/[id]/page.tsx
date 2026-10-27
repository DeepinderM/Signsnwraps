import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { getCatalogItem, listCatalog } from "@/lib/catalog";
import { AdminNav } from "../../admin-nav";
import { ProductForm } from "../catalog-forms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Catalog product" };

/** /admin/catalog/new adds a product; /admin/catalog/<id> edits one. */
export default async function CatalogItemPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireSuperAdmin();
  const { id } = await params;
  const [item, all] = await Promise.all([id === "new" ? Promise.resolve(null) : getCatalogItem(id), listCatalog()]);
  if (id !== "new" && !item) notFound();
  return <>
    <AdminNav admin={{ email: admin.email, role: admin.role, store: admin.store }} />
    <Link className="text-link" href="/admin/catalog">← Product catalog</Link>
    <div className="admin-head"><div><h1>{item ? item.name : "Add product"}</h1><p>{item ? `${item.source === "odoo" ? "From the Odoo file" : "Added manually"} · changes apply to new quotes and invoices only.` : "Prices are ex GST."}</p></div></div>
    <section className="admin-card"><ProductForm item={item ?? undefined} categories={[...new Set(all.map((entry) => entry.category))]} subcategories={[...new Set(all.map((entry) => entry.subcategory).filter(Boolean))]} /></section>
  </>;
}
