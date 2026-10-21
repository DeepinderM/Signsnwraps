import type { Metadata } from "next";
import Link from "next/link";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { listAllProducts } from "@/lib/shop/products";
import { categoryName, formatAud, productCategories, productHref } from "@/lib/shop/catalog";
import { AdminNav } from "../admin-nav";
import { loadSampleCatalog, setProductActive } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Products" };

type Props = { searchParams: Promise<{ q?: string; category?: string; saved?: string }> };

export default async function AdminProductsPage({ searchParams }: Props) {
  const admin = await requireSuperAdmin();
  const { q = "", category = "", saved } = await searchParams;
  const all = await listAllProducts();
  const query = q.trim().toLowerCase();
  const products = all.filter((product) => (!category || product.category === category) && (!query || `${product.name} ${product.id}`.toLowerCase().includes(query)));

  return <>
    <AdminNav admin={{ email: admin.email, role: admin.role, store: admin.store }} />
    <div className="admin-head"><div><h1>Products</h1><p>{all.length} total · {all.filter((product) => product.active).length} live · {all.filter((product) => product.sample).length} sample listings</p></div><Link className="button button-orange" href="/admin/products/new">Add product</Link></div>
    {saved && <p className="admin-ok" role="status">Saved {saved}.</p>}
    {all.length === 0 && <div className="admin-card"><h2>No products yet</h2><p>Load the sample catalogue to get started: vehicle kits for every make and model in the kit finder, plus colour film, universal pieces and tools, all with placeholder prices and marked as samples. You can edit or remove any of them.</p><form action={loadSampleCatalog}><button className="button" type="submit">Load sample catalogue</button></form></div>}
    {all.length > 0 && <form className="admin-filters" role="search"><input name="q" defaultValue={q} placeholder="Search name or ID" aria-label="Search products" /><select name="category" defaultValue={category} aria-label="Category"><option value="">All categories</option>{productCategories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select><button className="button" type="submit">Filter</button></form>}
    {products.length > 0 && <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
      {products.map((product) => <tr key={product.id}>
        <td><Link href={`/admin/products/${product.id}`}><b>{product.name}</b></Link><small>{product.id}{product.sample && " · sample"}</small></td>
        <td>{categoryName(product.category)}</td>
        <td>{formatAud(product.priceCents)}</td>
        <td>{product.stock ?? "Made to order"}</td>
        <td><form action={setProductActive}><input type="hidden" name="id" value={product.id} /><input type="hidden" name="active" value={product.active ? "0" : "1"} /><button type="submit" className={`admin-status ${product.active ? "is-live" : ""}`} title={product.active ? "Click to hide from the shop" : "Click to show in the shop"}>{product.active ? "Live" : "Hidden"}</button></form></td>
        <td className="admin-row-actions"><Link href={`/admin/products/${product.id}`}>Edit</Link>{product.active && <Link href={productHref(product)} target="_blank">View</Link>}</td>
      </tr>)}
    </tbody></table></div>}
  </>;
}
