"use client";

import { ACP_PANELS, DEFAULT_ACP_SIZES, STANDARD_ACP, panelName } from "@/lib/acp-panels";

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-AU", { maximumFractionDigits: 0 })}`;

/** The ACP sheet sizes a job may be booked on (the standard 2440 x 1220 always); the cheapest combination of those is used. */
export function AcpPanelPicker({ id, value, onChange }: { id: string; value: string[]; onChange: (codes: string[]) => void }) {
  const on = (code: string) => code === STANDARD_ACP || value.includes(code);
  const toggle = (code: string) => onChange(ACP_PANELS.map((panel) => panel.code).filter((item) => item === STANDARD_ACP || (item === code ? !on(code) : value.includes(item))));
  return <fieldset className="field acp-picker" id={id}>
    <legend className="ls-label">ACP sheet sizes to use</legend>
    <div className="acp-picker-options">{ACP_PANELS.map((panel) => {
      const standard = panel.code === STANDARD_ACP;
      return <label key={panel.code} className={`${on(panel.code) ? "on" : ""}${standard ? " locked" : ""}`} title={standard ? "Standard size: always used" : undefined}><input type="checkbox" className="visually-hidden" checked={on(panel.code)} disabled={standard} onChange={() => toggle(panel.code)} />{panelName(panel)} <small>{money(panel.priceCents)}{standard ? " · standard" : ""}</small></label>;
    })}</div>
    <small>The cheapest combination of the ticked sizes is used. <button type="button" className="link-button" onClick={() => onChange(ACP_PANELS.map((panel) => panel.code))}>All sizes</button> · <button type="button" className="link-button" onClick={() => onChange(DEFAULT_ACP_SIZES)}>Default sizes</button></small>
  </fieldset>;
}
