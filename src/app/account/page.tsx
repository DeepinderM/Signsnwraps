import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/accounts";
import { listOrdersForUser } from "@/lib/shop/orders";
import { formatAud, orderStatuses } from "@/lib/shop/catalog";
import { getAdmin } from "@/lib/admin-auth";
import { ProfileForm, ResendVerification, SignOutButton } from "./account-controls";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My account", robots: { index: false, follow: false } };

const dateFormat = new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeZone: "Australia/Melbourne" });
const statusLabel = (value: string) => ({ paid: "Order received", processing: "Being prepared", ready_for_pickup: "Ready to collect", shipped: "Shipped", completed: "Completed", cancelled: "Cancelled", refunded: "Refunded" } as Record<string, string>)[value] ?? orderStatuses.find((item) => item.value === value)?.label ?? value;

export default async function AccountPage() {
  const user = await requireUser("/account");
  const [profile, orders, admin] = await Promise.all([getProfile(user.uid), listOrdersForUser(user), getAdmin()]);
  const displayName = profile.name || user.name;
  return <section className="account-page"><div className="container">
    <div className="account-head"><div><span className="eyebrow">MY ACCOUNT</span><h1 className="heading-xl">{displayName ? `Hi, ${displayName.split(" ")[0]}.` : "Your account."}</h1><p className="body-lg">{user.email}</p></div><div className="account-head-actions">{admin && <Link className="button" href="/admin">Store admin</Link>}<SignOutButton /></div></div>
    {!user.emailVerified && user.provider === "password" && <div className="account-notice"><b>Please verify your email.</b> We sent a link to {user.email}. Verifying lets us show any orders you placed as a guest with this email. <ResendVerification /></div>}

    <div className="account-grid">
      <section className="account-card account-orders"><h2>Your orders</h2>
        {orders.length === 0 ? <p>No orders yet. <Link href="/wraps/shop">Browse the shop</Link></p> : <ul>{orders.map((order) => <li key={order.id}>
          <div className="account-order-top"><b>{order.orderNumber}</b><span className={`account-status status-${order.status}`}>{statusLabel(order.status)}</span></div>
          <p>{dateFormat.format(order.createdAt)} · {order.items.reduce((sum, item) => sum + item.qty, 0)} item(s) · {formatAud(order.totalCents)} · {order.delivery === "pickup" ? "Click & collect, Laverton North" : "Shipping"}</p>
          <ul className="account-order-items">{order.items.map((item, index) => <li key={index}>{item.qty} × {item.name}</li>)}</ul>
          {order.trackingNumber && <p className="account-tracking">Tracking number: <b>{order.trackingNumber}</b></p>}
        </li>)}</ul>}
      </section>
      <section className="account-card"><h2>Your details</h2><ProfileForm name={displayName} phone={profile.phone} /><p className="account-hint">Questions about an order? Email <a href={`mailto:hello@signsnwraps.com.au`}>hello@signsnwraps.com.au</a> with your order number.</p></section>
    </div>
  </div></section>;
}
