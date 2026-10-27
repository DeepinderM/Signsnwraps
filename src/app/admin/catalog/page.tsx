import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { listCatalog, seedCatalogSize } from "@/lib/catalog";
import { formatAud } from "@/lib/shop/catalog";
import { optionValueLabel } from "@/lib/catalog-types";
import { AdminNav } from "../admin-nav";
import { toggleProduct } from "./actions";
import { ImportForm } from "./catalog-forms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Product catalog" };

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; sub?: string; saved?: string; hidden?: string }> }) {
  const admin = await requireAdmin();
  const isSuper = admin.role === "super";
  const { q = "", category = "", sub = "", saved, hidden } = await searchParams;
  const showHidden = isSuper && hidden === "1";
  const all = await listCatalog({ activeOnly: !isSuper });
  const categories = [...new Set(all.map((item) => item.category))];
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const subcategories = category ? [...new Set(all.filter((item) => item.category === category).map((item) => item.subcategory).filter(Boolean))] : [];
  const hiddenCount = all.filter((item) => !item.active).length;
  const items = all.filter((item) => (showHidden || item.active)).filter((item) => (!category || item.category === category) && (!sub || item.subcategory === sub) && words.every((word) => `${item.name} ${item.category}`.toLowerCase().includes(word)));
  const link = (next: Record<string, string>) => `/admin/catalog?${new URLSearchParams({ ...(q ? { q } : {}), ...(category ? { category } : {}), ...(sub && !("category" in next) ? { sub } : {}), ...next })}`;

  return <>
    <AdminNav admin={{ email: admin.email, role: admin.role, store: admin.store }} />
    <div className="admin-head"><div><h1>Product catalog</h1><p>{all.length} products{isSuper ? ` (${all.filter((item) => !item.active).length} hidden)` : ""}. Used by “Add from catalog” on quotes and invoices. Prices are ex GST.</p></div>{isSuper && <Link className="button button-orange" href="/admin/catalog/new">Add product</Link>}</div>
    {saved && <p className="admin-ok" role="status">Added “{saved}”.</p>}
    {isSuper && <section className="admin-card"><ImportForm count={seedCatalogSize} hasItems={all.length > 0} /></section>}
    <nav className="admin-filters-row" aria-label="Categories"><span>Category:</span>{[["", "All"], ...categories.map((name) => [name, name])].map(([value, text]) => <Link key={value} href={link({ category: value })} aria-current={category === value ? "page" : undefined}>{text} {value ? `(${all.filter((item) => item.category === value).length})` : ""}</Link>)}</nav>
    {subcategories.length > 0 && <nav className="admin-filters-row cat-subrow" aria-label="Sub-categories"><span>{category}:</span>{[["", "All"], ...subcategories.map((name) => [name, name])].map(([value, text]) => <Link key={value} href={link({ sub: value })} aria-current={sub === value ? "page" : undefined}>{text} {value ? `(${all.filter((item) => item.category === category && item.subcategory === value).length})` : ""}</Link>)}</nav>}
    {isSuper && hiddenCount > 0 && <p className="admin-hint cat-hidden-toggle">{showHidden ? <>Showing {hiddenCount} hidden products. <Link href={link({ hidden: "" })}>Hide them</Link></> : <>{hiddenCount} hidden products aren&apos;t shown. <Link href={link({ hidden: "1" })}>Show hidden</Link></>}</p>}
    <form className="admin-filters" action="/admin/catalog">{category && <input type="hidden" name="category" value={category} />}<input name="q" defaultValue={q} placeholder="Search products" aria-label="Search products" /><button className="button button-orange" type="submit">Search</button></form>
    {items.length === 0 ? <div className="admin-card"><p>{all.length ? "No products match." : isSuper ? "The catalog is empty. Load the products from the Odoo file above." : "The catalog hasn't been set up yet."}</p></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Options</th>{isSuper && <th />}</tr></thead><tbody>
      {items.map((item) => <tr key={item.id} className={item.active ? "" : "cat-hidden"}>
        <td>{isSuper ? <Link href={`/admin/catalog/${item.id}`}><b>{item.name}</b></Link> : <b>{item.name}</b>}{item.code && <code className="prod-code">{item.code}</code>}{!item.active && <small>Hidden from the quote catalog</small>}</td>
        <td>{item.category}{item.subcategory && <small>› {item.subcategory}</small>}</td>
        <td>{item.options.some((option) => option.name.toLowerCase() === "quantity") ? <>from {formatAud(item.priceCents)}</> : formatAud(item.priceCents)}<small>{item.options.some((option) => option.name.toLowerCase() === "quantity") ? `for ${item.options.find((option) => option.name.toLowerCase() === "quantity")!.values[0]?.label}` : `per ${item.unit}`}{item.pricing === "roll" ? ` · any size, charged by ${item.rollWidthMm} mm roll used` : ""}</small></td>
        <td>{item.options.length === 0 ? "—" : item.options.map((option) => <small key={option.name}><b>{option.name}:</b> {option.values.map((value) => optionValueLabel(item, option, value, formatAud)).join(" · ")}</small>)}</td>
        {isSuper && <td className="admin-row-actions"><Link href={`/admin/catalog/${item.id}`}>Edit</Link><form action={toggleProduct} style={{ display: "inline" }}><input type="hidden" name="id" value={item.id} /><button className="admin-status" type="submit">{item.active ? "Hide" : "Show"}</button></form></td>}
      </tr>)}
    </tbody></table></div>}
  </>;
}
