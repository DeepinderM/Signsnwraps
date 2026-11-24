import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileDown, Paperclip } from "lucide-react";
import { formatDate } from "@/lib/billing";
import { storeLabel } from "@/lib/staff";
import { formatBytes } from "@/lib/uploads";
import { requireVendor, vendorJob } from "@/lib/vendor-auth";
import { jobLines } from "@/lib/vendor-types";
import { updatePoProgress } from "@/lib/purchase-orders";
import { ProgressTracker } from "./progress-form";
import { PoChatPanel } from "@/components/chat/po-chat-panel";
import { listChat, markChatRead } from "@/lib/po-chat";
import { loadVendorChat, postVendorChat } from "./chat-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Job", robots: { index: false, follow: false } };

const stamp = new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Melbourne" });

/** One job for the vendor: the PO details, amounts, and downloads (PO, production sheet, artwork). */
export default async function VendorJobPage({ params, searchParams }: { params: Promise<{ poId: string }>; searchParams: Promise<{ vendor?: string }> }) {
  const preview = (await searchParams).vendor;
  const viewer = await requireVendor(preview);
  const poId = (await params).poId;
  let job = await vendorJob(viewer, poId);
  if (!job) notFound();
  // Opening a new job tells Signs N Wraps the vendor has received it (not in a super admin preview).
  if (job.po.progress === "new" && !viewer.preview) {
    await updatePoProgress(job.po.id, "received", "Opened the job", `${viewer.name || viewer.email} (${viewer.vendor.name})`);
    job = (await vendorJob(viewer, poId)) ?? job;
  }
  const { po, doc, files } = job;
  const chat = await listChat(po.id);
  if (!viewer.preview) await markChatRead(po.id, "vendor");
  const q = preview ? `?vendor=${preview}` : "";
  const lines = po.lines.filter((line) => line.include);

  return <section className="vendor-page"><div className="container">
    <Link className="text-link" href={`/vendor${q}`}>← All jobs</Link>
    <div className="vendor-head"><div><span className="eyebrow">PURCHASE ORDER</span><h1 className="heading-lg">{po.number}</h1><p>{doc.title || po.quoteNumber} · {storeLabel(po.store)} · sent {po.sentAt ? stamp.format(po.sentAt) : ""}{po.requiredBy ? ` · required by ${formatDate(po.requiredBy)}` : ""}</p></div></div>
    <div className="vendor-downloads">
      <a className="button button-orange" href={`/vendor/jobs/${po.id}/pdf${q}`} target="_blank" rel="noreferrer"><FileDown aria-hidden /> Purchase order (PDF)</a>
      <a className="button button-light" href={`/vendor/jobs/${po.id}/pdf${q ? `${q}&` : "?"}sheet=1`} target="_blank" rel="noreferrer"><FileDown aria-hidden /> Production sheet (PDF)</a>
    </div>
    <ProgressTracker poId={po.id} stage={po.progress} log={po.progressLog} canUpdate={!viewer.preview} />
    <div className="vendor-card"><PoChatPanel poId={po.id} side="vendor" initial={chat} load={loadVendorChat} post={postVendorChat} otherName="Signs N Wraps" readOnly={viewer.preview} /></div>
    <div className="vendor-grid">
      <div className="vendor-card"><h2>Project summary</h2><p className="vendor-pre">{po.summary || "-"}</p>
        {po.includeCustomer && <><h3>Client / site</h3><p className="vendor-pre">{[doc.customer.business, doc.customer.name, doc.customer.address, doc.customer.phone].filter(Boolean).join("\n") || "-"}</p></>}</div>
      <div className="vendor-card"><h2>Artwork ({files.length})</h2>
        {files.length ? <ul className="vendor-files">{files.map((file, index) => <li key={file.path}><a href={`/vendor/jobs/${po.id}/files/${index}${q}`}><Paperclip aria-hidden /> {file.name}</a><small>{formatBytes(file.size)}</small></li>)}</ul> : <p>No artwork attached to this job.</p>}</div>
    </div>
    <div className="vendor-card"><h2>Items ({lines.length})</h2>
      <div className="vendor-table-wrap"><table className="vendor-table"><thead><tr><th>Qty</th><th>Item</th></tr></thead>
        <tbody>{lines.map((line, index) => { const [first, ...rest] = jobLines(line.description); return <tr key={index}><td>{line.qty}×</td><td><b>{first}</b>{line.code && <code className="prod-code">{line.code}</code>}{rest.length > 0 && <small>{rest.join(" · ")}</small>}{line.note.trim() && <small className="vendor-note">Note: {line.note.trim()}</small>}</td></tr>; })}</tbody>
      </table></div></div>
  </div></section>;
}
