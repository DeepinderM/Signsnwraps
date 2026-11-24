import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getInstallation } from "@/lib/installations";
import { installStage } from "@/lib/installation-types";
import { getPurchaseOrder } from "@/lib/purchase-orders";
import { storeLabel } from "@/lib/staff";
import { progressLabel } from "@/lib/vendor-types";
import { AdminNav } from "../../admin-nav";
import { InstallationForm } from "./installation-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Installation" };

const stamp = new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Melbourne" });

export default async function InstallationPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const inst = await getInstallation((await params).id);
  if (!inst || (admin.role !== "super" && inst.store !== admin.store)) notFound();
  const po = await getPurchaseOrder(inst.quoteId);
  const stage = installStage(inst);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne" }).format(new Date());
  return <>
    <AdminNav admin={{ email: admin.email, role: admin.role, store: admin.store }} />
    <Link className="text-link" href="/admin/installations">← Installations</Link>
    <div className="admin-head"><div><h1>Installation · {inst.title || inst.customerName}</h1>
      <p>{inst.customerName} · {storeLabel(inst.store)} · <Link href={`/admin/billing/${inst.invoiceId || inst.quoteId}`}>{[inst.quoteNumber, inst.invoiceNumber].filter(Boolean).join(" / ") || "Job"}</Link>
        {po && <> · <Link href={`/admin/billing/${inst.invoiceId || inst.quoteId}/purchase-order`}>{po.number}</Link>{po.status === "sent" ? ` (vendor: ${progressLabel(po.progress)})` : " (draft)"}</>}</p></div>
      <div className="admin-head-badges"><span className={`inst-badge is-${stage.key}`}>{stage.label}</span></div></div>
    <InstallationForm inst={inst} today={today} />
    <section className="admin-card"><h2>History</h2><ul className="po-history">{[...inst.history].reverse().map((event) => <li key={`${event.at}-${event.text}`}><b>{event.text}</b><small>{event.by} · {stamp.format(event.at)}</small></li>)}</ul></section>
  </>;
}
