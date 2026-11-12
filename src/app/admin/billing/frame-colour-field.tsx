"use client";

import { DEFAULT_FRAME_COLOUR, FRAME_COLOURS } from "@/lib/lightboxes";

/** Lightbox frame colour: Black unless the client wants something else (quick picks or type any colour). */
export function FrameColourField({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  return <div className="field frame-colour"><label htmlFor={id}>Frame colour</label>
    <input id={id} value={value} onChange={(event) => onChange(event.target.value)} onBlur={() => !value.trim() && onChange(DEFAULT_FRAME_COLOUR)} maxLength={60} placeholder={DEFAULT_FRAME_COLOUR} />
    <div className="frame-colour-picks">{FRAME_COLOURS.map((colour) => <button key={colour} type="button" className={`ls-chip${value === colour ? " is-on" : ""}`} aria-pressed={value === colour} onClick={() => onChange(colour)}>{colour}</button>)}</div>
    <small>{value.trim() && value.trim() !== DEFAULT_FRAME_COLOUR ? "Specific colour requested by the client." : "Black is standard. Type a colour (e.g. Dulux code or PMS) if the client wants a specific one."}</small>
  </div>;
}
