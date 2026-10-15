"use client";

import { useState } from "react";
import Link from "next/link";
import { cart } from "@/lib/shop/cart-store";
import { MAX_LINE_QTY, productHref, type Product } from "@/lib/shop/catalog";

type Props = { product: Pick<Product, "id" | "name" | "priceCents" | "imageUrl" | "stock" | "active"> & { fitment?: Product["fitment"] }; showQty?: boolean; compact?: boolean };

export function AddToCart({ product, showQty = false, compact = false }: Props) {
  const [qty, setQty] = useState(1);
  const [state, setState] = useState<"idle" | "added" | "full">("idle");
  const max = Math.min(MAX_LINE_QTY, product.stock ?? MAX_LINE_QTY);

  if (!product.active || max < 1) return <button className={`button kit-cart-disabled${compact ? " shop-add-compact" : ""}`} type="button" disabled>Out of stock</button>;

  function add() {
    const ok = cart.add({ productId: product.id, name: product.name, priceCents: product.priceCents, imageUrl: product.imageUrl, href: productHref(product) }, qty);
    setState(ok ? "added" : "full");
  }

  return <div className={`shop-add${compact ? " shop-add-compact" : ""}`}>
    {showQty && <label className="shop-qty"><span>Qty</span><select value={qty} onChange={(event) => setQty(Number(event.target.value))}>{Array.from({ length: max }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{value}</option>)}</select></label>}
    <button className="button button-orange" type="button" onClick={add}>Add to cart</button>
    {state === "added" && <Link className="shop-added" href="/wraps/cart" role="status">Added ✓ View cart</Link>}
    {state === "full" && <span className="shop-added" role="status">Your cart is full.</span>}
  </div>;
}
