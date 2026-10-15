import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getOrder } from "@/lib/shop/orders";
import { formatAud, orderStatuses } from "@/lib/shop/catalog";
import { isStripeTestMode } from "@/lib/stripe";
import { AdminNav } from "../../admin-nav";
import { saveOrder } from "../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Order" };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const order = await getOrder((await params).id);
  if (!order) notFound();
  const address = order.shippingAddress;
  const stripeUrl = order.stripePaymentIntentId ? `https://dashboard.stripe.com/${isStripeTestMode() ? "test/" : ""}payments/${order.stripePaymentIntentId}` : null;

  return <>
    <AdminNav email={admin.email} />
    <Link className="text-link" href="/admin/orders">← Orders</Link>
    <div className="admin-head"><div><h1>{order.orderNumber}</h1><p>{new Intl.DateTimeFormat("en-AU", { dateStyle: "full", timeStyle: "short", timeZone: "Australia/Melbourne" }).format(order.createdAt)}</p></div>{stripeUrl && <a className="button button-light" href={stripeUrl} target="_blank" rel="noreferrer">Open in Stripe ↗</a>}</div>
    {order.stockIssues.length > 0 && <div className="admin-error" role="alert"><b>Stock issue:</b> {order.stockIssues.join("; ")}. Contact the customer or refund in Stripe.</div>}
    <div className="admin-order-grid">
      <section className="admin-card"><h2>Items</h2><table className="admin-table"><tbody>{order.items.map((item, index) => <tr key={index}><td>{item.productId ? <Link href={`/admin/products/${item.productId}`}>{item.name}</Link> : item.name}</td><td>× {item.qty}</td><td>{formatAud(item.unitCents * item.qty)}</td></tr>)}</tbody><tfoot><tr><td colSpan={2}>Subtotal</td><td>{formatAud(order.subtotalCents)}</td></tr><tr><td colSpan={2}>{order.delivery === "pickup" ? "Click & collect" : "Shipping"}</td><td>{formatAud(order.shippingCents)}</td></tr><tr><th colSpan={2}>Total paid (incl. GST)</th><th>{formatAud(order.totalCents)}</th></tr></tfoot></table>{order.vehicle && <p><b>Customer's vehicle:</b> {order.vehicle}</p>}</section>
      <section className="admin-card"><h2>Customer</h2><p>{order.userId ? <small>Signed-in customer account</small> : <small>Guest checkout</small>}<br />{order.customer.name}<br /><a href={`mailto:${order.customer.email}`}>{order.customer.email}</a><br />{order.customer.phone}</p>
        <h2>{order.delivery === "pickup" ? "Click & collect · Laverton North" : "Ship to"}</h2>{address && <p>{address.line1}{address.line2 && <><br />{address.line2}</>}<br />{address.city} {address.state} {address.postalCode}<br />{address.country}</p>}</section>
      <section className="admin-card"><h2>Fulfilment</h2><form action={saveOrder} className="admin-form"><input type="hidden" name="id" value={order.id} />
        <div className="field"><label htmlFor="status">Status</label><select id="status" name="status" defaultValue={order.status}>{orderStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
        {order.delivery === "ship" && <div className="field"><label htmlFor="trackingNumber">Tracking number</label><input id="trackingNumber" name="trackingNumber" defaultValue={order.trackingNumber} /></div>}
        <div className="field"><label htmlFor="staffNote">Staff note (internal)</label><textarea id="staffNote" name="staffNote" defaultValue={order.staffNote} /></div>
        <button className="button button-orange" type="submit">Save</button>
        <p className="admin-hint">Status changes are internal. Email the customer directly when an order ships or is ready to collect.</p>
      </form></section>
    </div>
  </>;
}
