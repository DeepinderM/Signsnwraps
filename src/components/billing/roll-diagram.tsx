import { rollUsage } from "@/lib/catalog-types";

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const mm = (value: number) => `${value.toLocaleString("en-AU")} mm`;

/**
 * Costing diagram for roll-priced vinyl (staff always; the customer only when staff tick "show to customer"): the roll strips used (each roll-width wide, running the
 * length of the job), the printed area on top, the offcut that's paid for but not printed, and any joints.
 */
export function RollDiagram({ widthMm, heightMm, rollWidthMm, pricePerM2Cents, audience = "staff", id = "roll" }: { widthMm: number; heightMm: number; rollWidthMm: number; pricePerM2Cents: number; audience?: "staff" | "customer"; id?: string }) {
  const customer = audience === "customer";
  const hatch = `${id}-hatch`;
  const usage = rollUsage(widthMm, heightMm, rollWidthMm);
  const across = Math.min(widthMm, heightMm); // printed size across the roll
  const rollAcross = usage.strips * rollWidthMm;

  // Drawing: length runs left → right, strips stack top → bottom. Scale to fit 560 × 240 px.
  const scale = Math.min(560 / usage.lengthMm, 240 / rollAcross);
  const W = usage.lengthMm * scale, H = rollAcross * scale, printedH = across * scale;
  const pad = { left: 128, top: 30, right: 96, bottom: 16 };

  const printedM2 = (usage.lengthMm * across) / 1_000_000;
  const offcutM2 = usage.areaM2 - printedM2;
  const cost = Math.round(pricePerM2Cents * usage.areaM2);
  const offcutCost = Math.round(pricePerM2Cents * offcutM2);
  const wastePercent = usage.areaM2 ? (offcutM2 / usage.areaM2) * 100 : 0;

  return <figure className="roll-diagram">
    <svg viewBox={`0 0 ${W + pad.left + pad.right} ${H + pad.top + pad.bottom}`} role="img" aria-label={`${usage.strips} roll strip${usage.strips === 1 ? "" : "s"} of ${rollWidthMm} by ${usage.lengthMm} millimetres; printed area ${usage.lengthMm} by ${across}; offcut ${offcutM2.toFixed(2)} square metres`}>
      <defs>
        <pattern id={hatch} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#fff4e5" /><line x1="0" y1="0" x2="0" y2="8" stroke="#e7a54d" strokeWidth="3" /></pattern>
      </defs>
      <g transform={`translate(${pad.left} ${pad.top})`}>
        {/* Roll strips (whole area paid for) shown as offcut, printed area drawn on top */}
        {Array.from({ length: usage.strips }, (_, index) => <g key={index}>
          <rect x={0} y={index * rollWidthMm * scale} width={W} height={rollWidthMm * scale} fill={`url(#${hatch})`} stroke="#9aa5b1" strokeWidth={1} />
          <text x={W + 8} y={(index + 0.5) * rollWidthMm * scale + 4} className="rd-label">Strip {index + 1}</text>
          <text x={W + 8} y={(index + 0.5) * rollWidthMm * scale + 17} className="rd-small">{mm(rollWidthMm)} roll</text>
        </g>)}
        <rect x={0} y={0} width={W} height={printedH} fill="#bfe6fb" stroke="#026BA3" strokeWidth={2} />
        <text x={W / 2} y={Math.min(printedH / 2 + 4, printedH - 6)} textAnchor="middle" className="rd-print">Printed {mm(usage.lengthMm)} × {mm(across)}</text>
        {/* Joints where strips meet inside the printed area */}
        {Array.from({ length: usage.strips - 1 }, (_, index) => { const y = (index + 1) * rollWidthMm * scale; return y < printedH ? <g key={index}><line x1={0} x2={W} y1={y} y2={y} stroke="#b3261e" strokeWidth={2} strokeDasharray="6 4" /><text x={6} y={y - 5} className="rd-joint">Joint</text></g> : null; })}
        {/* Dimensions */}
        <line x1={0} x2={W} y1={-14} y2={-14} stroke="#13233A" markerStart="none" /><line x1={0} x2={0} y1={-19} y2={-9} stroke="#13233A" /><line x1={W} x2={W} y1={-19} y2={-9} stroke="#13233A" />
        <text x={W / 2} y={-19} textAnchor="middle" className="rd-label">{mm(usage.lengthMm)} roll length</text>
        <line x1={-14} x2={-14} y1={0} y2={printedH} stroke="#026BA3" strokeWidth={2} /><text x={-20} y={printedH / 2 + 4} textAnchor="end" className="rd-label rd-blue">{mm(across)}</text>
        {rollAcross > across && <><line x1={-14} x2={-14} y1={printedH} y2={H} stroke="#e7a54d" strokeWidth={2} /><text x={-20} y={(printedH + H) / 2 + 4} textAnchor="end" className="rd-small rd-orange">{mm(rollAcross - across)} offcut</text></>}
      </g>
    </svg>
    <figcaption>
      <dl className="rd-stats">
        <div><dt><i className="rd-key rd-key-roll" />Roll used</dt><dd>{usage.areaM2.toFixed(2)} m²<small>{usage.strips} × {mm(rollWidthMm)} × {mm(usage.lengthMm)}</small></dd><dd>{money(cost)}</dd></div>
        <div><dt><i className="rd-key rd-key-print" />Printed</dt><dd>{printedM2.toFixed(2)} m²<small>{mm(widthMm)} × {mm(heightMm)}</small></dd><dd>{customer ? "" : money(cost - offcutCost)}</dd></div>
        <div><dt><i className="rd-key rd-key-waste" />{customer ? "Roll offcut" : "Offcut (paid, not printed)"}</dt><dd>{offcutM2.toFixed(2)} m²<small>{wastePercent.toFixed(0)}% of the roll used</small></dd><dd>{customer ? "" : money(offcutCost)}</dd></div>
        {customer ? <div className="rd-total"><dt>Vinyl charged</dt><dd>{usage.areaM2.toFixed(2)} m² × {money(pricePerM2Cents)}/m²</dd><dd>{money(cost)}</dd></div>
          : <div className="rd-total"><dt>Effective cost per printed m²</dt><dd>{printedM2 ? money(Math.round(cost / printedM2)) : "—"}<small>vs {money(pricePerM2Cents)}/m² list</small></dd><dd /></div>}
      </dl>
      {customer && <p className="rd-explain">Vinyl comes on a {mm(rollWidthMm)} wide roll. Your {mm(widthMm)} × {mm(heightMm)} print uses {usage.strips === 1 ? `a ${mm(rollWidthMm)} × ${mm(usage.lengthMm)} piece of the roll` : `${usage.strips} strips of ${mm(rollWidthMm)} × ${mm(usage.lengthMm)}, joined`}, so the charge is for the roll used.</p>}
      {usage.strips > 1 && <p className="rd-note">Printed in {usage.strips} strips with {usage.strips - 1} joint{usage.strips > 2 ? "s" : ""}.</p>}
    </figcaption>
  </figure>;
}
