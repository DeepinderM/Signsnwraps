"use client";

import { VINYL_GAP_MM, type RollLayout, type VinylPiece } from "@/lib/vinyl-nest";

const COLOURS = ["#03AAFA", "#F28C28", "#16A34A", "#9333EA", "#DC2626", "#0891B2", "#CA8A04", "#DB2777"];

/** The roll from above: each sticker as placed, coloured by size. */
export function RollPlan({ layout, pieces = [] }: { layout: RollLayout; pieces?: VinylPiece[] }) {
  const scale = 560 / layout.rollWidthMm, height = Math.max(40, layout.lengthMm * scale);
  return <figure className="vm-plan">
    <svg viewBox={`0 0 ${layout.rollWidthMm} ${layout.lengthMm}`} width={560} height={height} role="img" aria-label={`Roll ${layout.rollWidthMm} mm wide, ${layout.lengthMm} mm used`}>
      <rect x={0} y={0} width={layout.rollWidthMm} height={layout.lengthMm} fill="#EEF2F7" />
      {layout.placements.map((item, index) => <g key={index}><rect x={item.x} y={item.y} width={item.w} height={item.h} fill={COLOURS[layout.parts[item.piece].source % COLOURS.length]} fillOpacity={0.75} stroke="#13233A" strokeWidth={layout.rollWidthMm / 400} />
        {item.w * scale > 30 && item.h * scale > 12 && (() => { const part = layout.parts[item.piece]; const label = `${part.widthMm}×${part.heightMm}${part.of > 1 ? ` (${part.part}/${part.of})` : ""}${item.rotated ? " ↻" : ""}`; return <text x={item.x + item.w / 2} y={item.y + item.h / 2} fontSize={Math.min(item.h * 0.3, (item.w * 0.85) / (label.length * 0.6), layout.rollWidthMm / 28)} textAnchor="middle" dominantBaseline="middle" fill="#04131F">{label}</text>; })()}</g>)}
    </svg>
    <figcaption>{layout.rollWidthMm} mm roll · {layout.lengthMm} mm used · {pieces.reduce((sum, piece) => sum + piece.qty, 0)} sticker{pieces.reduce((sum, piece) => sum + piece.qty, 0) === 1 ? "" : "s"}{layout.count > pieces.reduce((sum, piece) => sum + piece.qty, 0) ? ` (${layout.count} sections)` : ""} · {VINYL_GAP_MM} mm cutting gap{layout.placements.some((item) => item.rotated) ? " · ↻ rotated to fit" : ""}{layout.parts.some((part) => part.of > 1) ? " · (1/2) = joined sections" : ""}</figcaption>
  </figure>;
}

