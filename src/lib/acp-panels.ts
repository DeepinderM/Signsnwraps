// ACP panel sizes, prices and the cheapest way to cover a sign of any size.
// Used by the "ACP sign (vinyl printed & laminated)" calculator and 3D letter ACP mounting.
// Prices are per panel, ex GST. Edit the list to change sizes or prices.

export type AcpPanel = { code: string; widthMm: number; heightMm: number; priceCents: number };

export const ACP_PANELS: AcpPanel[] = [
  { code: "ACP-1212", widthMm: 1200, heightMm: 1200, priceCents: 25_000 },
  { code: "ACP-1224", widthMm: 2440, heightMm: 1220, priceCents: 45_000 },
  { code: "ACP-1230", widthMm: 3050, heightMm: 1220, priceCents: 55_000 },
  { code: "ACP-1530", widthMm: 3000, heightMm: 1500, priceCents: 55_000 },
];

/**
 * PVC sheets for mounting letters (one size; the price depends on colour, the same for 10, 16 and 20 mm).
 * Sheet sets are named "acp" (default) or "pvc-<thickness>-<white|black>" so a quote line can be re-planned later.
 */
export const PVC_MOUNT_PRICES = { white: 45_000, black: 50_000 };
export const PVC_THICKNESSES = [10, 16, 20];
export function pvcMountPanels(thicknessMm: number, colour: "white" | "black"): AcpPanel[] {
  return [{ code: `PVC${thicknessMm}-${colour === "black" ? "B" : "W"}`, widthMm: 2440, heightMm: 1220, priceCents: PVC_MOUNT_PRICES[colour] }];
}
export function panelsForSet(set?: string): AcpPanel[] {
  const match = /^pvc-(10|16|20)-(white|black)$/.exec(set ?? "");
  return match ? pvcMountPanels(Number(match[1]), match[2] as "white" | "black") : ACP_PANELS;
}
export function panelSetLabel(set?: string) {
  const match = /^pvc-(10|16|20)-(white|black)$/.exec(set ?? "");
  return match ? `${match[1]} mm ${match[2]} PVC` : "ACP";
}

export const panelName = (panel: AcpPanel) => `${Math.min(panel.widthMm, panel.heightMm)} x ${Math.max(panel.widthMm, panel.heightMm)} mm`;

/** A panel as placed: its size along the row (length) and across it (depth), possibly rotated. */
export type PlacedPanel = { panel: AcpPanel; lengthMm: number; depthMm: number };
export type AcpRow = { coverMm: number; panels: PlacedPanel[] };
export type AcpPlan = {
  /** "rows": rows run across the sign's width; "columns": they run down its height. */
  direction: "rows" | "columns";
  rows: AcpRow[];
  costCents: number;
  count: number;
  /** Panels used, by size, e.g. [{ panel, qty: 2 }]. */
  bill: { panel: AcpPanel; qty: number }[];
  panelAreaM2: number;
  signAreaM2: number;
};

const STEP = 10; // mm resolution for the covering search

/** Every panel in both orientations: [length along the row, depth across it]. */
function orientations(panels: AcpPanel[]) {
  return panels.flatMap((panel) => [
    { panel, lengthMm: panel.widthMm, depthMm: panel.heightMm },
    { panel, lengthMm: panel.heightMm, depthMm: panel.widthMm },
  ]);
}

/** Cheapest set of pieces (at least `depth` deep) whose lengths add up to ≥ length. Ties: fewer pieces. */
function coverRow(lengthMm: number, depth: number, panels: AcpPanel[]): { cost: number; pieces: PlacedPanel[] } | null {
  const pieces = orientations(panels).filter((item) => item.depthMm >= depth);
  if (!pieces.length) return null;
  const n = Math.ceil(lengthMm / STEP);
  const cost = new Array<number>(n + 1).fill(Infinity), count = new Array<number>(n + 1).fill(Infinity), pick = new Array<number>(n + 1).fill(-1);
  cost[0] = 0; count[0] = 0;
  for (let x = 1; x <= n; x++) {
    pieces.forEach((piece, index) => {
      const from = Math.max(0, x - Math.floor(piece.lengthMm / STEP));
      const c = cost[from] + piece.panel.priceCents, k = count[from] + 1;
      if (c < cost[x] || (c === cost[x] && k < count[x])) { cost[x] = c; count[x] = k; pick[x] = index; }
    });
  }
  const used: PlacedPanel[] = [];
  for (let x = n; x > 0;) { const piece = pieces[pick[x]]; used.push(piece); x = Math.max(0, x - Math.floor(piece.lengthMm / STEP)); }
  return { cost: cost[n], pieces: used.sort((a, b) => b.lengthMm - a.lengthMm) };
}

/** Rows of panels covering length × depth: each row's depth is a panel side (or what's left). */
function planRows(lengthMm: number, depthMm: number, panels: AcpPanel[]) {
  const sides = [...new Set(panels.flatMap((panel) => [panel.widthMm, panel.heightMm]))];
  const rowCache = new Map<number, ReturnType<typeof coverRow>>();
  const row = (cover: number) => { if (!rowCache.has(cover)) rowCache.set(cover, coverRow(lengthMm, cover, panels)); return rowCache.get(cover)!; };
  const memo = new Map<number, { cost: number; count: number; rows: AcpRow[] } | null>();
  const solve = (remaining: number): { cost: number; count: number; rows: AcpRow[] } | null => {
    if (remaining <= 0) return { cost: 0, count: 0, rows: [] };
    if (memo.has(remaining)) return memo.get(remaining)!;
    let best: { cost: number; count: number; rows: AcpRow[] } | null = null;
    for (const cover of new Set(sides.map((side) => Math.min(side, remaining)))) {
      const r = row(cover), rest = r && solve(remaining - cover);
      if (!r || !rest) continue;
      const candidate = { cost: r.cost + rest.cost, count: r.pieces.length + rest.count, rows: [{ coverMm: cover, panels: r.pieces }, ...rest.rows] };
      if (!best || candidate.cost < best.cost || (candidate.cost === best.cost && candidate.count < best.count)) best = candidate;
    }
    memo.set(remaining, best);
    return best;
  };
  return solve(depthMm);
}

/**
 * Cheapest combination of ACP panels covering a sign of width × height (mm), trying rows across the width and
 * columns down the height, every panel in both orientations. Ties go to fewer panels (fewer joins), then less offcut.
 */
export function planAcp(widthMm: number, heightMm: number, panels: AcpPanel[] = ACP_PANELS): AcpPlan | null {
  if (!(widthMm > 0 && heightMm > 0) || widthMm > 30000 || heightMm > 30000) return null;
  const options = ([["rows", planRows(widthMm, heightMm, panels)], ["columns", planRows(heightMm, widthMm, panels)]] as const)
    .filter((entry): entry is ["rows" | "columns", NonNullable<ReturnType<typeof planRows>>] => entry[1] !== null)
    .map(([direction, plan]) => {
      const placed = plan.rows.flatMap((row) => row.panels);
      const panelArea = placed.reduce((sum, item) => sum + item.panel.widthMm * item.panel.heightMm, 0) / 1e6;
      const bill = panels.map((panel) => ({ panel, qty: placed.filter((item) => item.panel === panel).length })).filter((entry) => entry.qty);
      return { direction, rows: plan.rows, costCents: plan.cost, count: plan.count, bill, panelAreaM2: panelArea, signAreaM2: (widthMm * heightMm) / 1e6 };
    });
  options.sort((a, b) => a.costCents - b.costCents || a.count - b.count || a.panelAreaM2 - b.panelAreaM2);
  return options[0] ?? null;
}

/** "2 x 1500 x 3000 mm + 1 x 1200 x 1200 mm" */
export const describeBill = (plan: AcpPlan) => plan.bill.map((entry) => `${entry.qty} x ${panelName(entry.panel)}`).join(" + ");

// ── Whole-job nesting ─────────────────────────────────────────────────────────────────────────────
// A job is `qty` signs of the same size. Each sign is split into pieces (one piece if it fits on a sheet,
// otherwise the cut pieces of its cheapest panel layout); then every piece from every sign is nested onto
// sheets with straight (guillotine) cuts, rotating pieces where that helps, so offcut gets reused.

export type AcpPiece = { id: string; sign: number; widthMm: number; heightMm: number };
export type AcpPlacement = { piece: AcpPiece; x: number; y: number; w: number; h: number; rotated: boolean };
export type AcpSheet = { panel: AcpPanel; placements: AcpPlacement[] };
export type AcpJob = {
  qty: number; widthMm: number; heightMm: number;
  /** How one sign is assembled from pieces (null when the sign is a single piece). */
  assembly: AcpPlan | null;
  sheets: AcpSheet[];
  costCents: number; count: number;
  bill: { panel: AcpPanel; qty: number }[];
  panelAreaM2: number; signAreaM2: number;
};

const sheetSize = (panel: AcpPanel) => ({ w: Math.max(panel.widthMm, panel.heightMm), h: Math.min(panel.widthMm, panel.heightMm) });
const fits = (panel: AcpPanel, w: number, h: number) => { const s = sheetSize(panel); return (w <= s.w && h <= s.h) || (h <= s.w && w <= s.h); };

/** The pieces one sign is cut into (in sign coordinates). */
function signPieces(widthMm: number, heightMm: number, sign: number, panels: AcpPanel[]): { pieces: AcpPiece[]; assembly: AcpPlan | null } {
  if (panels.some((panel) => fits(panel, widthMm, heightMm))) return { pieces: [{ id: `${sign}`, sign, widthMm, heightMm }], assembly: null };
  const plan = planAcp(widthMm, heightMm, panels)!;
  const pieces: AcpPiece[] = [];
  const along = plan.direction === "rows" ? widthMm : heightMm;
  plan.rows.forEach((row, rowIndex) => {
    let at = 0;
    row.panels.forEach((item, index) => {
      const length = Math.min(item.lengthMm, along - at);
      at += item.lengthMm;
      if (length <= 0) return;
      const id = `${sign}${String.fromCharCode(97 + pieces.length)}`;
      pieces.push(plan.direction === "rows" ? { id, sign, widthMm: length, heightMm: row.coverMm } : { id, sign, widthMm: row.coverMm, heightMm: length });
      void rowIndex; void index;
    });
  });
  return { pieces, assembly: plan };
}

type FreeRect = { x: number; y: number; w: number; h: number };
type OpenSheet = { panel: AcpPanel; free: FreeRect[]; placements: AcpPlacement[] };

const newSheet = (panel: AcpPanel): OpenSheet => { const s = sheetSize(panel); return { panel, free: [{ x: 0, y: 0, w: s.w, h: s.h }], placements: [] }; };

/** Best spot for a piece in a sheet (best short-side fit), trying both orientations. */
function bestSpot(sheet: OpenSheet, piece: AcpPiece) {
  let best: { rect: number; w: number; h: number; score: number } | null = null;
  sheet.free.forEach((rect, index) => {
    for (const [w, h] of [[piece.widthMm, piece.heightMm], [piece.heightMm, piece.widthMm]]) {
      if (w <= rect.w && h <= rect.h) {
        const score = Math.min(rect.w - w, rect.h - h);
        if (!best || score < best.score) best = { rect: index, w, h, score };
      }
    }
  });
  return best as { rect: number; w: number; h: number; score: number } | null;
}

/** Place a piece with a guillotine split of the free rectangle it goes into. */
function place(sheet: OpenSheet, piece: AcpPiece, spot: { rect: number; w: number; h: number }) {
  const rect = sheet.free[spot.rect];
  sheet.placements.push({ piece, x: rect.x, y: rect.y, w: spot.w, h: spot.h, rotated: spot.w !== piece.widthMm });
  const right = rect.w - spot.w, below = rect.h - spot.h;
  const parts: FreeRect[] = right < below
    ? [{ x: rect.x + spot.w, y: rect.y, w: right, h: spot.h }, { x: rect.x, y: rect.y + spot.h, w: rect.w, h: below }]
    : [{ x: rect.x + spot.w, y: rect.y, w: right, h: rect.h }, { x: rect.x, y: rect.y + spot.h, w: spot.w, h: below }];
  sheet.free.splice(spot.rect, 1, ...parts.filter((part) => part.w > 0 && part.h > 0));
}

/** Pack pieces onto sheets; `choose` picks the sheet type to open when a piece fits nowhere yet. */
function pack(pieces: AcpPiece[], choose: (piece: AcpPiece) => AcpPanel, panels: AcpPanel[]) {
  const sheets: OpenSheet[] = [];
  for (const piece of pieces) {
    let target: { sheet: OpenSheet; spot: NonNullable<ReturnType<typeof bestSpot>> } | null = null;
    for (const sheet of sheets) { const spot = bestSpot(sheet, piece); if (spot && (!target || spot.score < target.spot.score)) target = { sheet, spot }; }
    if (!target) { const sheet = newSheet(choose(piece)); sheets.push(sheet); target = { sheet, spot: bestSpot(sheet, piece)! }; }
    place(target.sheet, piece, target.spot);
  }
  // Swap any sheet for a cheaper size if its pieces still fit.
  return sheets.map((sheet) => {
    for (const panel of [...panels].sort((a, b) => a.priceCents - b.priceCents)) {
      if (panel.priceCents >= sheet.panel.priceCents) break;
      const trial = newSheet(panel);
      const order = [...sheet.placements].map((item) => item.piece).sort((a, b) => b.widthMm * b.heightMm - a.widthMm * a.heightMm);
      if (order.every((piece) => { const spot = bestSpot(trial, piece); if (spot) place(trial, piece, spot); return !!spot; })) return trial;
    }
    return sheet;
  });
}

const toJobSheets = (sheets: OpenSheet[]): AcpSheet[] => sheets.map((sheet) => ({ panel: sheet.panel, placements: sheet.placements }));

/** Cheapest way to make `qty` signs of width × height from ACP sheets, sharing offcut between pieces. */
export function planAcpJob(widthMm: number, heightMm: number, qty = 1, panels: AcpPanel[] = ACP_PANELS): AcpJob | null {
  if (!(qty >= 1 && qty <= 200) || !planAcp(widthMm, heightMm, panels)) return null;
  const { assembly } = signPieces(widthMm, heightMm, 1, panels);
  const pieces = Array.from({ length: qty }, (_, index) => signPieces(widthMm, heightMm, index + 1, panels).pieces).flat();
  const fitting = (piece: AcpPiece) => panels.filter((panel) => fits(panel, piece.widthMm, piece.heightMm));
  const choosers: ((piece: AcpPiece) => AcpPanel)[] = [
    (piece) => fitting(piece).sort((a, b) => a.priceCents - b.priceCents)[0],
    (piece) => fitting(piece).sort((a, b) => a.priceCents / (a.widthMm * a.heightMm) - b.priceCents / (b.widthMm * b.heightMm))[0],
    ...panels.map((panel) => (piece: AcpPiece) => (fits(panel, piece.widthMm, piece.heightMm) ? panel : fitting(piece).sort((a, b) => a.priceCents - b.priceCents)[0])),
  ];
  const orders = [
    [...pieces].sort((a, b) => b.widthMm * b.heightMm - a.widthMm * a.heightMm),
    [...pieces].sort((a, b) => Math.max(b.widthMm, b.heightMm) - Math.max(a.widthMm, a.heightMm)),
  ];
  const candidates = orders.flatMap((order) => choosers.map((choose) => toJobSheets(pack(order, choose, panels))));
  const cost = (sheets: AcpSheet[]) => sheets.reduce((sum, sheet) => sum + sheet.panel.priceCents, 0);
  candidates.sort((a, b) => cost(a) - cost(b) || a.length - b.length);
  const sheets = candidates[0];
  const bill = panels.map((panel) => ({ panel, qty: sheets.filter((sheet) => sheet.panel === panel).length })).filter((entry) => entry.qty);
  return {
    qty, widthMm, heightMm, assembly, sheets, costCents: cost(sheets), count: sheets.length, bill,
    panelAreaM2: sheets.reduce((sum, sheet) => sum + sheet.panel.widthMm * sheet.panel.heightMm, 0) / 1e6, signAreaM2: (qty * widthMm * heightMm) / 1e6,
  };
}

export const describeJobBill = (job: Pick<AcpJob, "bill">) => job.bill.map((entry) => `${entry.qty} x ${panelName(entry.panel)}`).join(" + ");
