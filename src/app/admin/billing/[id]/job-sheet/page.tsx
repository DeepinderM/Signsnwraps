import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { formatDate, getBillingDoc, statusLabel } from "@/lib/billing";
import { decodeLetterCode, frontLitFromCode, solidFromCode } from "@/lib/letter-signs";
import { storeLabel } from "@/lib/staff";
import { RollDiagram } from "@/components/billing/roll-diagram";
import { AcpDiagram } from "@/components/billing/acp-diagram";
import { panelSetLabel } from "@/lib/acp-panels";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Job sheet" };

/**
 * Production job sheet for a quote/invoice: what to build, with no prices. Product codes are decoded into
 * plain build instructions and re-checked against the build rules, so a code that breaks a rule is caught
 * before production starts.
 */
export default async function JobSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const doc = await getBillingDoc((await params).id);
  if (!doc || (admin.role !== "super" && doc.store !== admin.store)) notFound();
  const decoded = doc.items.map((item) => (item.code ? decodeLetterCode(item.code) : null));
  const blocked = decoded.filter((item) => item && !item.valid).length;

  return <div className="job-sheet">
    <div className="job-actions no-print"><Link className="text-link" href={`/admin/billing/${doc.id}`}>← Back to {doc.kind}</Link><PrintButton /></div>
    <header className="job-head">
      <div><span>JOB SHEET · PRODUCTION</span><h1>{doc.title || doc.number}</h1><p>{doc.kind === "quote" ? "Quote" : "Invoice"} {doc.number} · {statusLabel(doc)} · issued {formatDate(doc.issueDate)}</p></div>
      <dl><div><dt>Customer</dt><dd>{doc.customer.business || doc.customer.name}{doc.customer.business && doc.customer.name ? ` (${doc.customer.name})` : ""}</dd></div><div><dt>Store</dt><dd>{storeLabel(doc.store)}</dd></div><div><dt>Address</dt><dd>{doc.customer.address || "—"}</dd></div><div><dt>Phone</dt><dd>{doc.customer.phone || "—"}</dd></div></dl>
    </header>
    <p className="job-foot">Prices are deliberately left off this sheet. Colours, PMS and finishes come from the job notes, not the code.</p>
    {blocked > 0 && <p className="job-alert">⚠ {blocked} line{blocked === 1 ? " breaks" : "s break"} a build rule. Send back to sales before production starts.</p>}

    <ol className="job-lines">
      {doc.items.map((item, index) => { const code = decoded[index]; return <li key={index} className={code && !code.valid ? "is-invalid" : ""}>
        <div className="job-line-head"><span className="job-qty">{Number(item.qty)}×</span><div><b>{item.description.split("\n")[0]}</b>{item.code && <code className="job-code">{item.code}</code>}</div></div>
        {code && <>
          {!code.lit && <p className="job-banner job-banner-nl">NO LIGHT · NO LEDs · NO power supply · NO wiring</p>}
          {code.lit && <p className="job-banner job-banner-lit">LIT · {code.parts[1].name}: {code.parts[1].production}</p>}
          <table className="job-decode"><thead><tr><th>Part</th><th>Code</th><th>Means</th><th>Production builds</th></tr></thead><tbody>
            {code.parts.map((part) => <tr key={part.label}><th>{part.label}</th><td><code>{part.code}</code></td><td>{part.name}</td><td>{part.production}</td></tr>)}
          </tbody></table>
          {solidFromCode(code) && <div className="job-construction"><h3>Flat-cut letters</h3><dl>{solidFromCode(code)!.map((row) => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl></div>}
          {frontLitFromCode(code) && <div className="job-construction"><h3>Front-lit construction</h3><dl>{frontLitFromCode(code)!.map((row) => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl></div>}
          {code.valid ? <p className="job-ok">✓ Build rules check out</p> : <ul className="job-problems">{code.problems.map((problem) => <li key={problem}>{problem}</li>)}</ul>}
        </>}
        {item.description.split("\n").length > 1 && <div className="job-block"><h3>Client wording</h3><p>{item.description.split("\n").slice(1).join("\n")}</p></div>}
        {/* Without diagrams, production notes and the sign-off print as one block (no lone sign-off row on a new page). */}
        {item.production && !item.acp && !item.roll ? <div className="job-end"><div className="job-block job-production"><h3>Production notes</h3><p>{item.production}</p></div><div className="job-signoff"><span>☐ Materials checked</span><span>☐ Built</span><span>☐ QC passed</span><span>Initials: ________</span></div></div>
          : item.production && <div className="job-block job-production"><h3>Production notes</h3><p>{item.production}</p></div>}
        {item.acp && <div className="job-block"><h3>{panelSetLabel(item.acp.panelSet)} cutting plan ({item.acp.signs ?? item.qty} × {item.acp.widthMm} × {item.acp.heightMm} mm)</h3><AcpDiagram widthMm={item.acp.widthMm} heightMm={item.acp.heightMm} qty={item.acp.signs ?? Math.max(1, Math.round(item.qty))} showCost={false} id={`job-acp-${index}`} panelSet={item.acp.panelSet} /></div>}
        {item.roll && <div className="job-block"><h3>Vinyl roll plan</h3><RollDiagram widthMm={item.roll.widthMm} heightMm={item.roll.heightMm} rollWidthMm={item.roll.rollWidthMm} pricePerM2Cents={item.roll.pricePerM2Cents} audience="customer" id={`job-roll-${index}`} /></div>}
        {!(item.production && !item.acp && !item.roll) && <div className="job-signoff"><span>☐ Materials checked</span><span>☐ Built</span><span>☐ QC passed</span><span>Initials: ________</span></div>}
      </li>; })}
    </ol>
    {doc.notes && <div className="job-block"><h3>Notes on the {doc.kind}</h3><p>{doc.notes}</p></div>}
  </div>;
}
