import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { listOrders } from "@/lib/shop/orders";
import { formatAud, orderStatuses } from "@/lib/shop/catalog";
import { AdminNav } from "../admin-nav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Orders" };

const dateFormat = new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Melbourne" });

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const admin = await requireAdmin();
  const { status = "open" } = await searchParams;
  const all = await listOrders(200);
  const closed = new Set(["completed", "cancelled", "refunded"]);
  const orders = all.filter((order) => status === "all" || (status === "open" ? !closed.has(order.status) : order.status === status));
  const label = (value: string) => orderStatuses.find((item) => item.value === value)?.label ?? value;

  return <>
    <AdminNav email={admin.email} />
    <div className="admin-head"><div><h1>Orders</h1><p>Paid orders from the online shop, newest first. Refunds are issued in the Stripe dashboard.</p></div></div>
    <nav className="admin-tabs" aria-label="Filter orders">{[["open", "Open"], ["paid", "New"], ["ready_for_pickup", "Ready for pickup"], ["shipped", "Shipped"], ["all", "All"]].map(([value, text]) => <Link key={value} href={`/admin/orders?status=${value}`} aria-current={status === value ? "page" : undefined}>{text}</Link>)}</nav>
    {orders.length === 0 ? <div className="admin-card"><p>No orders here yet.</p></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Delivery</th><th>Total</th><th>Status</th></tr></thead><tbody>
      {orders.map((order) => <tr key={order.id}>
        <td><Link href={`/admin/orders/${order.id}`}><b>{order.orderNumber}</b></Link><small>{order.items.reduce((sum, item) => sum + item.qty, 0)} item(s){order.stockIssues.length > 0 && " · ⚠ stock issue"}</small></td>
        <td>{dateFormat.format(order.createdAt)}</td>
        <td>{order.customer.name || "—"}<small>{order.customer.email}</small></td>
        <td>{order.delivery === "pickup" ? "Click & collect" : `Ship · ${order.shippingAddress?.state ?? ""}`}</td>
        <td>{formatAud(order.totalCents)}</td>
        <td><span className={`admin-status ${order.status === "paid" ? "is-new" : ""}`}>{label(order.status)}</span></td>
      </tr>)}
    </tbody></table></div>}
  </>;
}
