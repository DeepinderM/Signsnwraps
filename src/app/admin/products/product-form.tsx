"use client";

import { startTransition, useActionState, useState } from "react";
import Image from "next/image";
import { productCategories, type Product } from "@/lib/shop/catalog";
import { kitCoverage, vehicleMakes } from "@/lib/data/wraps";
import { saveProduct, type ProductFormState } from "./actions";

export function ProductForm({ product }: { product?: Product }) {
  const [state, action, pending] = useActionState<ProductFormState, FormData>(saveProduct, {});
  const [category, setCategory] = useState<string>(product?.category ?? "vehicle-kit");
  const [make, setMake] = useState(product?.fitment?.make ?? "");
  const models = vehicleMakes.find((item) => item.slug === make)?.models ?? [];

  // Submit via onSubmit so React doesn't reset the fields when validation fails.
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => action(data));
  }

  return <form onSubmit={submit} className="admin-form">
    <input type="hidden" name="isNew" value={product ? "0" : "1"} />
    <div className="form-grid">
      <div className="field form-wide"><label htmlFor="name">Name</label><input id="name" name="name" required maxLength={140} defaultValue={product?.name} /></div>
      <div className="field"><label htmlFor="id">Product ID {product ? "" : "(optional)"}</label><input id="id" name="id" defaultValue={product?.id} readOnly={Boolean(product)} pattern="[a-z0-9-]*" placeholder="Generated from the name" aria-describedby="id-help" /><small id="id-help">Used in the product URL. Can't be changed later.</small></div>
      <div className="field"><label htmlFor="category">Category</label><select id="category" name="category" value={category} onChange={(event) => setCategory(event.target.value)}>{productCategories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></div>
      {category === "vehicle-kit" && <>
        <div className="field"><label htmlFor="make">Vehicle make</label><select id="make" name="make" value={make} onChange={(event) => setMake(event.target.value)} required><option value="">Choose…</option>{vehicleMakes.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></div>
        <div className="field"><label htmlFor="model">Model</label><select id="model" name="model" defaultValue={product?.fitment?.model ?? ""} key={make} required><option value="">Choose…</option>{models.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></div>
        <div className="field"><label htmlFor="coverage">Coverage</label><select id="coverage" name="coverage" defaultValue={product?.fitment?.coverage ?? ""} required><option value="">Choose…</option>{kitCoverage.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></div>
      </>}
      <div className="field form-wide"><label htmlFor="description">Description</label><textarea id="description" name="description" maxLength={2000} defaultValue={product?.description} /></div>
      <div className="field"><label htmlFor="price">Price (AUD, incl. GST)</label><input id="price" name="price" type="number" min="0.5" step="0.01" required defaultValue={product ? (product.priceCents / 100).toFixed(2) : ""} /></div>
      <div className="field"><label htmlFor="stock">Stock on hand</label><input id="stock" name="stock" type="number" min="0" step="1" defaultValue={product?.stock ?? ""} placeholder="Blank = made to order" /></div>
      <div className="field"><label htmlFor="sortOrder">Sort order</label><input id="sortOrder" name="sortOrder" type="number" step="1" defaultValue={product?.sortOrder ?? 0} /></div>
      <div className="field"><label htmlFor="image">Photo (JPG, PNG or WebP, max 4 MB)</label><input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" />{product?.imageUrl && <div className="admin-image"><Image src={product.imageUrl} alt="" width={120} height={90} /><label><input type="checkbox" name="removeImage" /> Remove photo</label></div>}</div>
      <div className="admin-checks form-wide">
        <label><input type="checkbox" name="active" defaultChecked={product?.active ?? true} /> Live in the shop</label>
        <label><input type="checkbox" name="sample" defaultChecked={product?.sample ?? false} /> Sample listing (shows a "sample" label to customers)</label>
      </div>
    </div>
    {state.error && <p className="admin-error" role="alert">{state.error}</p>}
    <button className="button button-orange" type="submit" disabled={pending}>{pending ? "Saving…" : product ? "Save changes" : "Create product"}</button>
  </form>;
}
