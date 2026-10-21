import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { formatDate, listBillingDocs } from "@/lib/billing";
import { buildSalesReport, periods, type Breakdown, type Period } from "@/lib/sales-report";
import { listOrders } from "@/lib/shop/orders";
import { formatAud } from "@/lib/shop/catalog";
import { storeLabel, stores } from "@/lib/staff";
import { AdminNav } from "../admin-nav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sales report" };

const pct = (value: number | null) => (value === null ? "—" : `${Math.round(value * 100)}%`);

function BreakdownTable({ title, rows, empty }: { title: string; rows: Breakdown; empty: string }) {
  return <section className="admin-card"><h2>{title}</h2>{rows.length === 0 ? <p className="admin-hint">{empty}</p> : <ul className="report-bars">
    {rows.map((row) => <li key={row.label}><div><span>{row.label}</span><b>{formatAud(row.value)}</b></div><i style={{ width: `${Math.max(row.share * 100, 2)}%` }} /><small>{row.count} payment{row.count === 1 ? "" : "s"} · {pct(row.share)}</small></li>)}
  </ul>}</section>;
}

export default async function SalesReportPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const admin = await requireAdmin();
  const isSuper = admin.role === "super";
  const { period: rawPeriod } = await searchParams;
  const period = (periods.some((item) => item.value === rawPeriod) ? rawPeriod : "month") as Period;
  // Store staff only ever load (and see) their own store's figures.
  const [docs, orders] = await Promise.all([listBillingDocs(isSuper ? undefined : admin.store ?? undefined), isSuper ? listOrders(1000) : Promise.resolve(undefined)]);
  const reportStores = isSuper ? stores.map((store) => store.value) : admin.store ? [admin.store] : [];
  const report = buildSalesReport(docs, period, { stores: reportStores, orders });
  const peak = Math.max(1, ...report.trend.flatMap((month) => month.stores.map((item) => item.value)));
  const leader = isSuper ? [...report.rows].filter((row) => row.key !== "none").sort((a, b) => b.paidValue - a.paidValue)[0] : null;

  return <>
    <AdminNav admin={{ email: admin.email, role: admin.role, store: admin.store }} />
    <div className="admin-head"><div><h1>Sales report</h1><p>{isSuper ? "All stores" : `${storeLabel(admin.store)} store`} · {formatDate(report.range.from)} – {formatDate(report.range.to)}. Sales are payments received (deposits included), ex GST.</p></div><Link className="button button-light" href="/admin/billing">Quotes & invoices</Link></div>
    <nav className="admin-tabs" aria-label="Period">{periods.map((item) => <Link key={item.value} href={`/admin/reports?period=${item.value}`} aria-current={period === item.value ? "page" : undefined}>{item.label}</Link>)}</nav>

    <div className="bill-stats">
      <div><span>Sales received (ex GST)</span><b>{formatAud(report.total.paidValue)}</b><small>{report.total.paid} payment{report.total.paid === 1 ? "" : "s"} · {formatAud(report.total.paidIncGst)} incl. GST</small></div>
      <div><span>Invoiced (ex GST)</span><b>{formatAud(report.total.invoicedValue)}</b><small>{report.total.invoices} invoice{report.total.invoices === 1 ? "" : "s"} issued</small></div>
      <div><span>Quote win rate</span><b>{pct(report.total.winRate)}</b><small>{report.total.won} won of {report.total.quotes} sent · {formatAud(report.total.wonValue)}</small></div>
      <div><span>Outstanding now</span><b>{formatAud(report.total.outstanding)}</b><small>{formatAud(report.total.overdue)} overdue</small></div>
    </div>

    <section className="admin-card"><h2>By store {leader && leader.paidValue > 0 && <small>Top store: {leader.label}</small>}</h2><div className="admin-table-wrap report-table"><table className="admin-table"><thead><tr>
      <th>Store</th><th>Quotes sent</th><th>Quotes won</th><th>Win rate</th><th>Invoiced</th><th>Received</th><th>Avg sale</th><th>Outstanding</th><th>Overdue</th>
    </tr></thead><tbody>
      {report.rows.map((row) => <tr key={row.key}>
        <td><b>{row.label}</b>{isSuper && row.key !== "none" && <small><Link href={`/admin/billing?kind=invoice&view=all&store=${row.key}`}>View invoices</Link></small>}</td>
        <td>{row.quotes}<small>{formatAud(row.quotesValue)}</small></td>
        <td>{row.won}<small>{formatAud(row.wonValue)}</small></td>
        <td>{pct(row.winRate)}</td>
        <td>{formatAud(row.invoicedValue)}<small>{row.invoices} issued</small></td>
        <td><b>{formatAud(row.paidValue)}</b><small>{row.paid} payment{row.paid === 1 ? "" : "s"}{report.total.paidValue > 0 && isSuper ? ` · ${pct(row.paidValue / report.total.paidValue)} of total` : ""}</small></td>
        <td>{row.avgSale === null ? "—" : formatAud(row.avgSale)}</td>
        <td>{formatAud(row.outstanding)}</td>
        <td className={row.overdue ? "report-bad" : ""}>{formatAud(row.overdue)}</td>
      </tr>)}
      {report.shop && <tr className="report-shop"><td><b>Online shop</b><small>Website orders (not store-managed)</small></td><td>—</td><td>—</td><td>—</td><td>—</td><td><b>{formatAud(report.shop.exGst)}</b><small>{report.shop.orders} order{report.shop.orders === 1 ? "" : "s"} · {formatAud(report.shop.incGst)} incl. GST</small></td><td>{report.shop.orders ? formatAud(Math.round(report.shop.exGst / report.shop.orders)) : "—"}</td><td>—</td><td>—</td></tr>}
    </tbody>{isSuper && <tfoot><tr><th>Total{report.shop ? " (stores + shop)" : ""}</th><th>{report.total.quotes}</th><th>{report.total.won}</th><th>{pct(report.total.winRate)}</th><th>{formatAud(report.total.invoicedValue)}</th><th>{formatAud(report.total.paidValue + (report.shop?.exGst ?? 0))}</th><th /><th>{formatAud(report.total.outstanding)}</th><th>{formatAud(report.total.overdue)}</th></tr></tfoot>}</table></div></section>

    <section className="admin-card"><h2>Money received, last 6 months <small>ex GST</small></h2>
      <div className="report-trend">{report.trend.map((month) => <div key={month.month} className="report-month">
        <div className="report-cols">{month.stores.map((item, index) => <span key={item.store} className={`report-col c${index}`} style={{ height: `${(item.value / peak) * 100}%` }} title={`${storeLabel(item.store)}: ${formatAud(item.value)}`} />)}</div>
        <small>{month.label}</small>
      </div>)}</div>
      <ul className="report-legend">{reportStores.map((store, index) => <li key={store}><i className={`c${index}`} />{storeLabel(store)}</li>)}</ul>
    </section>

    <div className="report-grid">
      <BreakdownTable title="Sales by lead source" rows={report.byChannel} empty="No payments received in this period." />
      <BreakdownTable title="Sales by how it started" rows={report.bySource} empty="No payments received in this period." />
      <BreakdownTable title="Sales by staff member" rows={report.byStaff} empty="No payments received in this period." />
    </div>
  </>;
}
