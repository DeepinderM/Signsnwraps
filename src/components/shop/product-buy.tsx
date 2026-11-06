"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cart } from "@/lib/shop/cart-store";
import { formatAud, lineId, MAX_LINE_QTY, productHref, type Product } from "@/lib/shop/catalog";

type Props = { product: Pick<Product, "id" | "name" | "priceCents" | "imageUrl" | "stock" | "active" | "fitment" | "options" | "variants"> };

/**
 * Price, option choices (Film, Coverage…), quantity and Add to cart for a product page. Products without
 * options add straight to the cart; with options, the price follows the chosen combination.
 */
export function ProductBuy({ product }: Props) {
  const [choice, setChoice] = useState<string[]>(() => product.variants[0]?.values ?? []);
  const [qty, setQty] = useState(1);
  const [state, setState] = useState<"idle" | "added" | "full">("idle");
  const variant = useMemo(() => product.variants.find((item) => item.values.every((value, index) => value === choice[index])), [product.variants, choice]);
  const hasOptions = product.variants.length > 0;
  const price = hasOptions ? variant?.priceCents ?? null : product.priceCents;
  const max = Math.min(MAX_LINE_QTY, product.stock ?? MAX_LINE_QTY);
  // A value is offered when some variant matches it together with the choices before it.
  const available = (optionIndex: number, value: string) => product.variants.some((item) => item.values[optionIndex] === value && item.values.slice(0, optionIndex).every((v, i) => v === choice[i]));

  function pick(optionIndex: number, value: string) {
    setState("idle");
    const next = [...choice]; next[optionIndex] = value;
    // Keep later choices if that combination exists, otherwise jump to the first one that does.
    const exact = product.variants.find((item) => item.values.every((v, i) => v === next[i]));
    const fallback = product.variants.find((item) => item.values.slice(0, optionIndex + 1).every((v, i) => v === next[i]));
    setChoice((exact ?? fallback)?.values ?? next);
  }

  function add() {
    if (price === null) return;
    const ok = cart.add({ productId: lineId(product.id, variant?.key), name: variant ? `${product.name} · ${variant.label}` : product.name, priceCents: price, imageUrl: product.imageUrl, href: productHref(product) }, qty);
    setState(ok ? "added" : "full");
  }

  return <div className="product-buy">
    <div className="shop-price">{price === null ? "Choose your options" : formatAud(price)} {price !== null && <small>incl. GST</small>}</div>
    {product.options.map((option, optionIndex) => <fieldset key={option.name} className="product-option">
      <legend>{option.name}</legend>
      <div>{option.values.map((value) => {
        const ok = available(optionIndex, value);
        return <label key={value} className={`${choice[optionIndex] === value ? "is-on" : ""}${ok ? "" : " is-off"}`}>
          <input type="radio" name={`option-${optionIndex}`} value={value} checked={choice[optionIndex] === value} disabled={!ok} onChange={() => pick(optionIndex, value)} />{value}
        </label>;
      })}</div>
    </fieldset>)}
    {!product.active || max < 1 ? <button className="button kit-cart-disabled" type="button" disabled>Out of stock</button> : <div className="shop-add">
      <label className="shop-qty"><span>Qty</span><select value={qty} onChange={(event) => setQty(Number(event.target.value))}>{Array.from({ length: max }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <button className="button button-orange" type="button" onClick={add} disabled={price === null}>Add to cart</button>
      {state === "added" && <Link className="shop-added" href="/wraps/cart" role="status">Added ✓ View cart</Link>}
      {state === "full" && <span className="shop-added" role="status">Your cart is full.</span>}
    </div>}
  </div>;
}
