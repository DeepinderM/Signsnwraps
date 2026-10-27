import { panelName, panelsForSet, planAcp, planAcpJob, type AcpJob, type AcpPlan } from "@/lib/acp-panels";

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const mm = (value: number) => `${value.toLocaleString("en-AU")} mm`;
const COLOURS = ["#bfe6fb", "#c9efd9", "#fde3c4", "#e2d9fb"];

/** Each panel's position in "row space": along the row (length) and across the rows (depth), cut to its row. */
function layoutRects(plan: AcpPlan) {
  const rects: { key: string; length0: number; depth0: number; length: number; depth: number; item: AcpPlan["rows"][number]["panels"][number]; cut: boolean }[] = [];
  let depthAt = 0;
  plan.rows.forEach((row, rowIndex) => {
    let lengthAt = 0;
    row.panels.forEach((item, index) => {
      rects.push({ key: `${rowIndex}-${index}`, length0: lengthAt, depth0: depthAt, length: item.lengthMm, depth: row.coverMm, item, cut: item.depthMm > row.coverMm });
      lengthAt += item.lengthMm;
    });
    depthAt += row.coverMm;
  });
  return rects;
}

/**
 * How one large sign is assembled: which panels cover it, how they're cut, and the offcut. Rows run across the
 * sign (or columns down it); each panel is cut to its row, and anything past the sign's edge is offcut.
 */
export function AcpAssembly({ widthMm, heightMm, plan: given, showCost = true, id = "acp", compact = false }: { widthMm: number; heightMm: number; plan?: AcpPlan | null; showCost?: boolean; id?: string; compact?: boolean }) {
  const plan = given ?? planAcp(widthMm, heightMm);
  if (!plan) return null;
  const columns = plan.direction === "columns";
  // Lay rows out in "row space" (length along the row, depth across), then map to the sign's x/y.
  const lengthTotal = columns ? heightMm : widthMm;
  const rowsLength = Math.max(lengthTotal, ...plan.rows.map((row) => row.panels.reduce((sum, item) => sum + item.lengthMm, 0)));
  const depthTotal = plan.rows.reduce((sum, row) => sum + row.coverMm, 0);
  const drawW = columns ? depthTotal : rowsLength, drawH = columns ? rowsLength : depthTotal;
  const scale = Math.min(560 / drawW, 260 / drawH);
  const pad = { left: 70, top: 28, right: 20, bottom: 12 };
  const types = plan.bill.map((entry) => entry.panel.code);
  const hatch = `${id}-hatch`;

  const rects = layoutRects(plan);
  const toXY = (r: (typeof rects)[number]) => columns
    ? { x: r.depth0 * scale, y: r.length0 * scale, w: r.depth * scale, h: r.length * scale }
    : { x: r.length0 * scale, y: r.depth0 * scale, w: r.length * scale, h: r.depth * scale };

  return <figure className="acp-diagram">
    <svg viewBox={`0 0 ${drawW * scale + pad.left + pad.right} ${drawH * scale + pad.top + pad.bottom}`} role="img" aria-label={`ACP layout for a ${widthMm} by ${heightMm} mm sign: ${plan.count} panels`}>
      <defs><pattern id={hatch} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#fff4e5" /><line x1="0" y1="0" x2="0" y2="7" stroke="#e7a54d" strokeWidth="2.5" /></pattern></defs>
      <g transform={`translate(${pad.left} ${pad.top})`}>
        {/* Panels (offcut shows through where they pass the sign edge) */}
        <rect x={0} y={0} width={drawW * scale} height={drawH * scale} fill={`url(#${hatch})`} />
        {rects.map((r) => { const box = toXY(r); return <g key={r.key}>
          <rect x={box.x} y={box.y} width={box.w} height={box.h} fill={COLOURS[types.indexOf(r.item.panel.code) % COLOURS.length]} stroke="#13233A" strokeWidth={1.2} />
          {box.w > 54 && box.h > 26 && <text x={box.x + box.w / 2} y={box.y + box.h / 2 + 4} textAnchor="middle" className="acp-label">{panelName(r.item.panel)}{r.cut ? " (cut)" : ""}</text>}
        </g>; })}
        {/* Anything past the sign's edges is offcut */}
        {drawW > widthMm && <rect x={widthMm * scale} y={0} width={(drawW - widthMm) * scale} height={drawH * scale} fill={`url(#${hatch})`} opacity={0.9} />}
        {drawH > heightMm && <rect x={0} y={heightMm * scale} width={drawW * scale} height={(drawH - heightMm) * scale} fill={`url(#${hatch})`} opacity={0.9} />}
        {/* The sign itself */}
        <rect x={0} y={0} width={widthMm * scale} height={heightMm * scale} fill="none" stroke="#026BA3" strokeWidth={2.5} strokeDasharray="7 4" />
        <text x={(widthMm * scale) / 2} y={-10} textAnchor="middle" className="rd-label rd-blue">{mm(widthMm)}</text>
        <text x={-10} y={(heightMm * scale) / 2 + 4} textAnchor="end" className="rd-label rd-blue">{mm(heightMm)}</text>
      </g>
    </svg>
    {compact ? <figcaption><p className="rd-explain">Dashed blue = the sign. Panels are cut to size; hatched = offcut.</p></figcaption> : <figcaption>
      <dl className="rd-stats">
        {plan.bill.map((entry) => <div key={entry.panel.code}><dt><i className="rd-key" style={{ background: COLOURS[types.indexOf(entry.panel.code) % COLOURS.length] }} />{entry.qty} × {panelName(entry.panel)}</dt><dd>{(entry.qty * entry.panel.widthMm * entry.panel.heightMm / 1e6).toFixed(2)} m²</dd><dd>{showCost ? money(entry.qty * entry.panel.priceCents) : ""}</dd></div>)}
        <div><dt><i className="rd-key rd-key-waste" />Offcut</dt><dd>{(plan.panelAreaM2 - plan.signAreaM2).toFixed(2)} m²<small>{plan.panelAreaM2 ? Math.round(((plan.panelAreaM2 - plan.signAreaM2) / plan.panelAreaM2) * 100) : 0}% of the panels</small></dd><dd /></div>
        <div className="rd-total"><dt>{plan.count} panel{plan.count === 1 ? "" : "s"} · sign {plan.signAreaM2.toFixed(2)} m²</dt><dd>{plan.count > 1 ? `${plan.count - 1} join${plan.count > 2 ? "s" : ""}` : "No joins"}</dd><dd>{showCost ? money(plan.costCents) : ""}</dd></div>
      </dl>
      <p className="rd-explain">Dashed blue = the sign. Panels are cut to size; hatched = offcut. Layout in {plan.direction === "rows" ? "rows across the width" : "columns down the height"}.</p>
    </figcaption>}
  </figure>;
}

const SIGN_COLOURS = ["#bfe6fb", "#c9efd9", "#fde3c4", "#e2d9fb", "#fbd5dc", "#d9f2f7", "#efe7c9", "#dfe7f5"];

/** One sheet of the cutting plan: the pieces cut from it (labelled by sign) and the offcut. */
function SheetDrawing({ sheet, index, id, showCost, maxWidthMm }: { sheet: AcpJob["sheets"][number]; index: number; id: string; showCost: boolean; maxWidthMm: number }) {
  const w = Math.max(sheet.panel.widthMm, sheet.panel.heightMm), h = Math.min(sheet.panel.widthMm, sheet.panel.heightMm);
  // One scale for every sheet in the plan (based on the widest), so sizes and label text are comparable.
  const scale = 240 / maxWidthMm;
  const hatch = `${id}-sheet-${index}`;
  const used = sheet.placements.reduce((sum, item) => sum + item.w * item.h, 0) / (w * h);
  return <div className="acp-sheet">
    {/* Every sheet in a plan is drawn to the same scale (relative to the widest sheet). */}
    <svg viewBox={`0 0 ${w * scale + 2} ${h * scale + 2}`} style={{ width: `${(w / maxWidthMm) * 100}%` }} role="img" aria-label={`Sheet ${index + 1}, ${panelName(sheet.panel)}, ${sheet.placements.length} pieces`}>
      <defs><pattern id={hatch} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#fff4e5" /><line x1="0" y1="0" x2="0" y2="7" stroke="#e7a54d" strokeWidth="2.5" /></pattern></defs>
      <rect x={1} y={1} width={w * scale} height={h * scale} fill={`url(#${hatch})`} stroke="#13233A" strokeWidth={1.5} />
      {sheet.placements.map((item) => <g key={item.piece.id}>
        <rect x={1 + item.x * scale} y={1 + item.y * scale} width={item.w * scale} height={item.h * scale} fill={SIGN_COLOURS[(item.piece.sign - 1) % SIGN_COLOURS.length]} stroke="#13233A" strokeWidth={1} />
        {item.w * scale > 30 && item.h * scale > 16 && <text x={1 + (item.x + item.w / 2) * scale} y={1 + (item.y + item.h / 2) * scale + 4} textAnchor="middle" className="acp-label">S{item.piece.id.toUpperCase()}</text>}
      </g>)}
    </svg>
    <p><b>Sheet {index + 1}</b> · {panelName(sheet.panel)}{showCost ? ` · ${money(sheet.panel.priceCents)}` : ""}<small>{sheet.placements.map((item) => `S${item.piece.id.toUpperCase()} ${item.piece.widthMm}×${item.piece.heightMm}${item.rotated ? " (rotated)" : ""}`).join(" · ")} · {Math.round(used * 100)}% used</small></p>
  </div>;
}

/**
 * ACP cutting plan for a job of `qty` signs: the cheapest sheets with pieces from all signs nested onto them
 * (offcut reused), plus how each sign is assembled when it needs more than one piece.
 */
export function AcpDiagram({ widthMm, heightMm, qty = 1, job: given, showCost = true, id = "acp", panelSet }: { widthMm: number; heightMm: number; qty?: number; job?: AcpJob | null; showCost?: boolean; id?: string; panelSet?: string }) {
  const panels = panelsForSet(panelSet);
  const job = given ?? planAcpJob(widthMm, heightMm, qty, panels);
  if (!job) return null;
  const separate = (planAcp(widthMm, heightMm, panels)?.costCents ?? 0) * job.qty;
  return <figure className="acp-diagram">
    {job.assembly && <div className="acp-section"><h4>How each sign is put together ({job.assembly.count} pieces, {job.assembly.count - 1} join{job.assembly.count > 2 ? "s" : ""})</h4><AcpAssembly widthMm={widthMm} heightMm={heightMm} plan={job.assembly} showCost={false} id={`${id}-asm`} compact /></div>}
    <div className="acp-section"><h4>Cutting plan · {job.count} sheet{job.count === 1 ? "" : "s"} for {job.qty} sign{job.qty === 1 ? "" : "s"}</h4>
      <div className="acp-sheets">{job.sheets.map((sheet, index) => <SheetDrawing key={index} sheet={sheet} index={index} id={id} showCost={showCost} maxWidthMm={Math.max(...job.sheets.map((item) => Math.max(item.panel.widthMm, item.panel.heightMm)))} />)}</div>
    </div>
    <figcaption>
      <dl className="rd-stats">
        {job.bill.map((entry) => <div key={entry.panel.code}><dt>{entry.qty} × {panelName(entry.panel)}</dt><dd>{(entry.qty * entry.panel.widthMm * entry.panel.heightMm / 1e6).toFixed(2)} m²</dd><dd>{showCost ? money(entry.qty * entry.panel.priceCents) : ""}</dd></div>)}
        <div><dt><i className="rd-key rd-key-waste" />Offcut</dt><dd>{(job.panelAreaM2 - job.signAreaM2).toFixed(2)} m²<small>{job.panelAreaM2 ? Math.round(((job.panelAreaM2 - job.signAreaM2) / job.panelAreaM2) * 100) : 0}% of the sheets</small></dd><dd /></div>
        <div className="rd-total"><dt>{job.qty} sign{job.qty === 1 ? "" : "s"} · {job.signAreaM2.toFixed(2)} m²</dt><dd>{showCost && separate > job.costCents ? `Saves ${money(separate - job.costCents)} vs sheets per sign` : ""}</dd><dd>{showCost ? money(job.costCents) : ""}</dd></div>
      </dl>
      <p className="rd-explain">Pieces are labelled by sign (S1, S2…; S1A, S1B are parts of sign 1 that get joined). Hatched = offcut.</p>
    </figcaption>
  </figure>;
}
