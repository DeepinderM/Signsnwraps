import "server-only";
import { isOverdue, todayIso, type BillingDoc } from "@/lib/billing";
import { storeLabel, stores, type StoreId } from "@/lib/staff";
import type { Order } from "@/lib/shop/catalog";

// Sales by store from quotes/invoices (plus online shop orders for super admins).
// "Sales" = money received, ex GST, counted in the period each payment arrived (deposits and
// progress payments count when they're paid, not when the invoice is finished). Quotes and invoices
// are counted by their issue date. Outstanding/overdue are as of today, regardless of period.

export const periods = [
  { value: "month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "quarter", label: "This quarter" },
  { value: "fy", label: "This financial year" },
  { value: "12m", label: "Last 12 months" },
  { value: "all", label: "All time" },
] as const;
export type Period = (typeof periods)[number]["value"];

/** Inclusive YYYY-MM-DD range for a period, in Melbourne time. */
export function periodRange(period: Period): { from: string; to: string } {
  const today = todayIso();
  const [y, m] = today.split("-").map(Number);
  const iso = (year: number, month: number, day = 1) => new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
  const monthEnd = (year: number, month: number) => iso(year, month + 1, 0);
  switch (period) {
    case "month": return { from: iso(y, m), to: today };
    case "last-month": return { from: iso(y, m - 1), to: monthEnd(y, m - 1) };
    case "quarter": { const start = Math.floor((m - 1) / 3) * 3 + 1; return { from: iso(y, start), to: today }; }
    case "fy": return { from: m >= 7 ? iso(y, 7) : iso(y - 1, 7), to: today }; // Australian financial year starts 1 July
    case "12m": return { from: iso(y - 1, m + 1), to: today };
    default: return { from: "2000-01-01", to: today };
  }
}

const melbourneDate = (millis: number) => (millis ? new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne" }).format(new Date(millis)) : "");
const inRange = (date: string, range: { from: string; to: string }) => !!date && date >= range.from && date <= range.to;
const accepted = (doc: BillingDoc) => doc.status === "accepted" || doc.status === "invoiced";

/** Each payment received on an invoice, with its ex-GST share of the invoice. */
function payments(doc: BillingDoc) {
  if (doc.kind !== "invoice" || doc.status === "void") return [];
  const exRatio = doc.totalCents ? (doc.subtotalCents - (doc.discountCents ?? 0)) / doc.totalCents : 1;
  return doc.schedule.filter((stage) => stage.status === "paid").map((stage) => ({ doc, incGst: stage.amountCents, exGst: Math.round(stage.amountCents * exRatio), date: melbourneDate(stage.paidAt || doc.paidAt) }));
}
const paymentsIn = (docs: BillingDoc[], range: { from: string; to: string }) => docs.flatMap(payments).filter((payment) => inRange(payment.date, range));

export type StoreRow = {
  key: string; label: string;
  quotes: number; quotesValue: number; won: number; wonValue: number; winRate: number | null;
  invoices: number; invoicedValue: number; paid: number; paidValue: number; paidIncGst: number;
  outstanding: number; overdue: number; avgSale: number | null;
};

function storeRow(key: string, label: string, docs: BillingDoc[], range: { from: string; to: string }): StoreRow {
  const quotes = docs.filter((doc) => doc.kind === "quote" && doc.status !== "draft" && inRange(doc.issueDate, range));
  const won = quotes.filter(accepted);
  const decided = quotes.filter((doc) => accepted(doc) || doc.status === "declined" || doc.status === "expired");
  const invoices = docs.filter((doc) => doc.kind === "invoice" && doc.status !== "draft" && doc.status !== "void" && inRange(doc.issueDate, range));
  const paid = paymentsIn(docs, range);
  const open = docs.filter((doc) => doc.kind === "invoice" && doc.status === "sent");
  const paidValue = paid.reduce((sum, payment) => sum + payment.exGst, 0);
  return {
    key, label,
    quotes: quotes.length, quotesValue: quotes.reduce((sum, doc) => sum + doc.subtotalCents - (doc.discountCents ?? 0), 0),
    won: won.length, wonValue: won.reduce((sum, doc) => sum + doc.subtotalCents - (doc.discountCents ?? 0), 0), winRate: decided.length ? won.length / decided.length : null,
    invoices: invoices.length, invoicedValue: invoices.reduce((sum, doc) => sum + doc.subtotalCents - (doc.discountCents ?? 0), 0),
    paid: paid.length, paidValue, paidIncGst: paid.reduce((sum, payment) => sum + payment.incGst, 0),
    outstanding: open.reduce((sum, doc) => sum + doc.totalCents - doc.paidCents, 0),
    overdue: open.filter(isOverdue).reduce((sum, doc) => sum + doc.totalCents - doc.paidCents, 0),
    // Average job size (ex GST) across invoices that received money in the period.
    avgSale: (() => { const jobs = [...new Set(paid.map((payment) => payment.doc))]; return jobs.length ? Math.round(jobs.reduce((sum, doc) => sum + doc.subtotalCents - (doc.discountCents ?? 0), 0) / jobs.length) : null; })(),
  };
}

export type Breakdown = { label: string; count: number; value: number; share: number }[];

/** Money received (ex GST) in the period grouped by a key, largest first. */
function breakdown(docs: BillingDoc[], range: { from: string; to: string }, keyOf: (doc: BillingDoc) => string): Breakdown {
  const paid = paymentsIn(docs, range);
  const total = paid.reduce((sum, payment) => sum + payment.exGst, 0) || 1;
  const map = new Map<string, { count: number; value: number }>();
  for (const payment of paid) { const key = keyOf(payment.doc) || "Unknown"; const row = map.get(key) ?? { count: 0, value: 0 }; map.set(key, { count: row.count + 1, value: row.value + payment.exGst }); }
  return [...map].map(([label, row]) => ({ label, ...row, share: row.value / total })).sort((a, b) => b.value - a.value);
}

export function buildSalesReport(docs: BillingDoc[], period: Period, options: { stores: StoreId[]; orders?: Order[] }) {
  const range = periodRange(period);
  const rows = options.stores.map((store) => storeRow(store, storeLabel(store), docs.filter((doc) => doc.store === store), range));
  const unassigned = docs.filter((doc) => !doc.store);
  if (unassigned.length) rows.push(storeRow("none", "No store", unassigned, range));
  const total = storeRow("total", "All stores", docs, range);

  // Online shop (super admins only): paid orders, ex GST (shop prices include GST).
  const shopOrders = (options.orders ?? []).filter((order) => !["cancelled", "refunded"].includes(order.status) && inRange(melbourneDate(order.createdAt), range));
  const shop = options.orders ? { orders: shopOrders.length, incGst: shopOrders.reduce((sum, order) => sum + order.totalCents, 0), exGst: Math.round(shopOrders.reduce((sum, order) => sum + order.totalCents, 0) / 1.1) } : null;

  // Six-month trend of paid sales per store.
  const months = Array.from({ length: 6 }, (_, index) => { const date = new Date(`${todayIso().slice(0, 7)}-01T00:00:00Z`); date.setUTCMonth(date.getUTCMonth() - (5 - index)); return date.toISOString().slice(0, 7); });
  const trend = months.map((month) => ({
    month, label: new Intl.DateTimeFormat("en-AU", { month: "short", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`)),
    stores: options.stores.map((store) => ({ store, value: docs.filter((doc) => doc.store === store).flatMap(payments).filter((payment) => payment.date.startsWith(month)).reduce((sum, payment) => sum + payment.exGst, 0) })),
  }));

  return {
    range, rows, total, shop, trend,
    byChannel: breakdown(docs, range, (doc) => doc.origin.channel),
    bySource: breakdown(docs, range, (doc) => ({ enquiry: "Website enquiry", quote: "Converted quote", account: "Customer account", manual: "Created manually" })[doc.origin.kind === "quote" && doc.enquiryId ? "enquiry" : doc.origin.kind]),
    byStaff: breakdown(docs, range, (doc) => `${doc.origin.createdBy || doc.createdBy}${doc.origin.createdByRole === "store" ? ` (${storeLabel(doc.origin.createdByStore)})` : ""}`),
  };
}
