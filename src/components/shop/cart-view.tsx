"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cart, useCart } from "@/lib/shop/cart-store";
import { FREE_SHIPPING_OVER_CENTS, MAX_LINE_QTY, SHIPPING_FLAT_CENTS, formatAud, shippingCents, type DeliveryMethod } from "@/lib/shop/catalog";
import { refreshCartProducts } from "@/app/wraps/cart/actions";

export function CartView() {
  const items = useCart();
  const [delivery, setDelivery] = useState<DeliveryMethod>("ship");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const idKey = items.map((item) => item.productId).join(",");

  // Re-sync names, prices and availability with the store whenever the set of products changes.
  useEffect(() => {
    if (!idKey) return;
    let cancelled = false;
    refreshCartProducts(idKey.split(",")).then((latest) => {
      if (cancelled || !latest) return;
      const current = cart.snapshot();
      const next = current.map((item) => {
        const info = latest[item.productId];
        if (!info) return { ...item, unavailable: "No longer available" };
        const unavailable = info.stock === 0 ? "Out of stock" : info.stock !== null && info.stock < item.qty ? `Only ${info.stock} available` : undefined;
        return { ...item, name: info.name, priceCents: info.priceCents, imageUrl: info.imageUrl, unavailable };
      });
      if (JSON.stringify(next) !== JSON.stringify(current)) cart.replace(next);
    }).catch(() => { /* keep the local snapshot; checkout re-validates anyway */ });
    return () => { cancelled = true; };
  }, [idKey]);

  const subtotal = items.reduce((sum, item) => sum + item.priceCents * item.qty, 0);
  const shipping = shippingCents(subtotal, delivery);
  const blocked = items.some((item) => item.unavailable);

  async function checkout() {
    setStatus("loading"); setError("");
    try {
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ delivery, items: items.map(({ productId, qty }) => ({ productId, qty })) }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url) throw new Error(data.error || "Checkout could not be started. Please try again.");
      window.location.assign(data.url);
    } catch (reason) {
      setStatus("error"); setError(reason instanceof Error ? reason.message : "Checkout could not be started.");
    }
  }

  if (!items.length) return <div className="cart-empty"><h2>Your cart is empty.</h2><p>Find a pre-cut kit for your vehicle, or browse film, protection pieces and tools.</p><div className="cart-actions"><Link className="button button-orange" href="/wraps/shop">Shop all products ↗</Link><Link className="button cart-outline" href="/wraps/kits">Find a vehicle kit ↗</Link></div></div>;

  return <div className="cart-layout">
    <ul className="cart-lines" aria-label="Items in your cart">{items.map((item) => <li key={item.productId}>
      <Link href={item.href} className="cart-thumb">{item.imageUrl ? <Image src={item.imageUrl} alt="" fill sizes="88px" /> : <span aria-hidden="true">PPF</span>}</Link>
      <div className="cart-line-main"><Link href={item.href}><b>{item.name}</b></Link><span>{formatAud(item.priceCents)} each</span>{item.unavailable && <em role="alert">{item.unavailable}</em>}</div>
      <div className="cart-line-qty"><button type="button" aria-label={`Decrease quantity of ${item.name}`} onClick={() => cart.setQty(item.productId, item.qty - 1)} disabled={item.qty <= 1}>−</button><span aria-live="polite">{item.qty}</span><button type="button" aria-label={`Increase quantity of ${item.name}`} onClick={() => cart.setQty(item.productId, item.qty + 1)} disabled={item.qty >= MAX_LINE_QTY}>+</button></div>
      <b className="cart-line-total">{formatAud(item.priceCents * item.qty)}</b>
      <button type="button" className="cart-remove" onClick={() => cart.remove(item.productId)} aria-label={`Remove ${item.name}`}>Remove</button>
    </li>)}</ul>
    <aside className="cart-summary">
      <h2>Order summary</h2>
      <fieldset className="cart-delivery"><legend>Delivery</legend>
        <label><input type="radio" name="delivery" checked={delivery === "ship"} onChange={() => setDelivery("ship")} /><span><b>Standard shipping · Australia</b><small>{subtotal >= FREE_SHIPPING_OVER_CENTS ? "Free on this order" : `${formatAud(SHIPPING_FLAT_CENTS)} · free over ${formatAud(FREE_SHIPPING_OVER_CENTS)}`}</small></span></label>
        <label><input type="radio" name="delivery" checked={delivery === "pickup"} onChange={() => setDelivery("pickup")} /><span><b>Click & collect · Laverton North</b><small>Free · we'll email when it's ready</small></span></label>
      </fieldset>
      <dl><div><dt>Subtotal</dt><dd>{formatAud(subtotal)}</dd></div><div><dt>{delivery === "pickup" ? "Pickup" : "Shipping"}</dt><dd>{shipping ? formatAud(shipping) : "Free"}</dd></div><div className="cart-total"><dt>Total <small>incl. GST</small></dt><dd>{formatAud(subtotal + shipping)}</dd></div></dl>
      <button className="button button-orange cart-checkout" type="button" onClick={checkout} disabled={status === "loading" || blocked}>{status === "loading" ? "Opening secure checkout…" : "Checkout securely ↗"}</button>
      {blocked && <p className="cart-error" role="alert">Remove or adjust unavailable items to continue.</p>}
      {error && <p className="cart-error" role="alert">{error}</p>}
      <p className="cart-fine"><Link href="/account/login?next=/wraps/cart">Sign in</Link> to track this order in your account, or check out as a guest. Payments are processed by Stripe. Please confirm your vehicle year, trim and body variant before ordering a vehicle kit. See <Link href="/shipping-returns">shipping & returns</Link>.</p>
    </aside>
  </div>;
}

export function ClearCartOnMount() {
  useEffect(() => { cart.clear(); }, []);
  return null;
}
