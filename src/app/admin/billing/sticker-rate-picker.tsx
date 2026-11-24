"use client";

import { STICKER_M2_RATES } from "@/lib/custom-sticker";

const dollars = (cents: number) => `$${cents / 100}`;

/** "Price list" or one of the set per m² rates ($60–$90) for a sticker run. 0 = price list. */
export function StickerRatePicker({ value, onChange }: { value: number; onChange: (rateCents: number) => void }) {
  return <div className="field"><span className="ls-label">Price by</span>
    <div className="ls-chips" role="radiogroup" aria-label="Price by">
      <button type="button" role="radio" aria-checked={value === 0} className={`ls-chip${value === 0 ? " is-on" : ""}`} onClick={() => onChange(0)}>Price list</button>
      {STICKER_M2_RATES.map((rate) => <button key={rate} type="button" role="radio" aria-checked={value === rate} className={`ls-chip${value === rate ? " is-on" : ""}`} onClick={() => onChange(rate)}>{dollars(rate)}/m²</button>)}
    </div></div>;
}
