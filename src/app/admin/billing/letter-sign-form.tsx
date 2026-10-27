"use client";

import { useState } from "react";
import {
  ALUMINIUM_SIDE_COLOURS, CHANNEL_MOUNT, POWER_ADAPTER, adaptersFor, installationOptions, type Installation, FRONT_LIT_PREMIUM_MAX_MM, countLetters, frontLitConstruction, heightBand, letterBuilds, letterCode,
  FRONT_LIT_DEPTHS, OFFERED_LIGHTS, letterDepths, letterDescription, letterLights, letterMaterials, letterPriceCents, letterProduction, letterRuleProblems, letterTypes,
  mountingOptions, RGB_SURCHARGE_PER_LETTER, SOLID_CODES, solidBuild, type LetterSpec, type Mounting,
} from "@/lib/letter-signs";
import type { PickedLine } from "./catalog-picker";
import { PVC_MOUNT_PRICES, PVC_THICKNESSES, describeJobBill, panelName, planAcpJob, pvcMountPanels } from "@/lib/acp-panels";
import { AcpDiagram } from "@/components/billing/acp-diagram";

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const start: LetterSpec = { type: "3DL", light: "LF", heightMm: 300, depth: "D60", face: "OPL", sides: "ALU", back: "PVC" };
const digits = (value: string) => value.replace(/[^\d]/g, "");
const PRINTED_VINYL = "Printed vinyl to artwork";
const WHITE_LED = "White";

/** Flat-cut PVC / acrylic letters have no separate walls: the edge is the material itself. */
function flatWalls(spec: LetterSpec) {
  const colour = (code: string) => (code === "PVCB" || code === "ACRB" ? "Black" : "White");
  if (spec.face !== "ACRC") return `${colour(spec.face)} (${spec.face.startsWith("PVC") ? "PVC" : "acrylic"} edge)`;
  if (SOLID_CODES.includes(spec.back) && spec.back !== "ACRC") return `Face colour on top, ${colour(spec.back).toLowerCase()} base edge below`;
  return "Same as the face colour (coloured acrylic edge)";
}

/**
 * 3D letter sign builder: pick a ready-made build (or set each part), the sign text, height and mounting. It writes the
 * 7-part code, checks the build rules, prices the letters per letter, adds the mounting, and fills in client wording
 * and production notes (front-lit: face, return thickness/depth and base set by the letter height).
 */
export function LetterSignForm({ kind, onAdd, onBack }: { kind: "quote" | "invoice"; onAdd: (line: PickedLine) => void; onBack: () => void }) {
  const [spec, setSpec] = useState<LetterSpec>(start);
  const [build, setBuild] = useState("Classic Front-lit");
  // One sign can have letters at different heights (e.g. "CARPRO" 600 mm + "AUT" 400 mm): one line per height.
  // Each line also has its own finish: face material (e.g. opal + vinyl or coloured acrylic), face colour, wall colour, LED.
  type Group = { key: number; text: string; height: string; letters: string; face?: string; depth?: string; faceNote: string; sidesNote: string; ledNote: string };
  const blankFinish = { faceNote: "", sidesNote: "", ledNote: "" };
  const [groups, setGroups] = useState<Group[]>([{ key: 1, text: "", height: "300", letters: "", ...blankFinish }]);
  const updateGroup = (key: number, change: Partial<Group>) => setGroups((current) => current.map((group) => (group.key === key ? { ...group, ...change } : group)));
  // When the build or light changes, every line goes back to that build's face.
  const resetFaces = () => setGroups((current) => current.map((group) => ({ ...group, face: undefined, depth: undefined })));
  const [note, setNote] = useState({ face: "", sides: "", led: "", other: "" });
  const [mounting, setMounting] = useState<Mounting>("wall");
  const [signSize, setSignSize] = useState({ width: "", height: "" });
  const [installation, setInstallation] = useState<Installation>("none");
  // Big jobs can take more than one day on site: the installation line is charged per day.
  const [installDays, setInstallDays] = useState("1");
  const [showAcpPlan, setShowAcpPlan] = useState(false);
  const [pvcMount, setPvcMount] = useState<{ thickness: number; colour: "white" | "black" }>({ thickness: 16, colour: "white" });

  const frontLit = spec.light === "LF";
  // Each line of letters is priced and coded by its own height (front-lit depth also follows the height).
  const flatSign = spec.light === "NL" && SOLID_CODES.includes(spec.face);
  const rows = groups.map((group) => {
    const heightMm = Number(group.height) || 0;
    // Front-lit depth follows the height unless staff picked one for this line.
    const construction = frontLitConstruction(heightMm, frontLit ? group.depth : undefined);
    const face = flatSign ? spec.face : group.face ?? spec.face;
    const full: LetterSpec = { ...spec, face, heightMm, depth: frontLit ? construction.depthCode : spec.depth };
    return { group, heightMm, construction, full, band: heightBand(heightMm), code: letterCode(full), problems: letterRuleProblems(full), perLetter: letterPriceCents(full), count: Number(group.letters) || countLetters(group.text) };
  });
  // The first line drives the shared controls (depth display, flat-cut factor).
  const { heightMm, full } = rows[0];

  const set = (change: Partial<LetterSpec>) => { setSpec((current) => ({ ...current, ...change })); setBuild(""); if (change.light || change.face) resetFaces(); };
  // Non-lit flat-cut letters (PVC / acrylic): material + thickness set face, sides, back and depth together.
  const nonLit = spec.light === "NL";
  const flat = nonLit && SOLID_CODES.includes(spec.face);
  const flatMaterial = !flat ? "metal" : spec.face === "ACRC" ? "ACRC" : spec.face;
  const flatOption = flatMaterial === "ACRC" ? (spec.back === "ACRC" ? "none" : `${spec.back}-${spec.depth === "D13" ? "D10" : "D05"}`) : spec.depth;
  const pickFlat = (material: string, option?: string) => {
    if (material === "metal") return set({ face: "ALU", sides: "ALU", back: "ALU", depth: "D45" });
    if (material === "ACRC") {
      const choice = option ?? "none";
      if (choice === "none") return set({ face: "ACRC", sides: "ACRC", back: "ACRC", depth: "D03" });
      const [base, baseDepth] = choice.split("-");
      return set({ face: "ACRC", sides: base, back: base, depth: baseDepth === "D10" ? "D13" : "D08" });
    }
    const thicknesses = material.startsWith("PVC") ? ["D10", "D16", "D20"] : ["D05", "D10"];
    const depth = option && thicknesses.includes(option) ? option : thicknesses[0];
    return set({ face: material, sides: material, back: material, depth });
  };
  const pickBuild = (name: string) => {
    const found = letterBuilds.find((item) => item.name === name);
    setBuild(name);
    resetFaces();
    if (found) { const [type, light, depth, face, sides, back] = found.parts; setSpec((current) => ({ ...current, type, light, depth, face, sides, back })); }
  };

  const problems = [...new Set(rows.flatMap((row) => row.problems.map((problem) => (rows.length > 1 ? `${row.heightMm} mm letters: ${problem}` : problem))))];
  const count = rows.reduce((sum, row) => sum + row.count, 0);
  const anyPoa = rows.some((row) => row.heightMm > 0 && row.perLetter === null);
  const lit = letterLights.find((light) => light.code === spec.light)?.lit;
  // Colours and finishes for one line of letters (plus the sign-wide "other" note); never part of the code.
  const jobNoteFor = (group: Group) => [group.faceNote.trim() && `Face: ${group.faceNote.trim()}`, !flatSign && group.sidesNote.trim() && `Sides: ${group.sidesNote.trim()}${spec.sides === "ALU" ? " aluminium" : ""}`, lit && group.ledNote.trim() && `LED: ${group.ledNote.trim()}`, note.other.trim()].filter(Boolean).join(" · ");

  const signW = Number(signSize.width) || 0, signH = Number(signSize.height) || 0;
  // ACP mounting uses the cheapest combination of panels that covers the overall sign.
  // Panel mounting (ACP sheets, or 1220 x 2440 PVC sheets: white or black, 10/16/20 mm) uses the cheapest sheet plan.
  const onPanels = mounting === "acp" || mounting === "pvc";
  const panelSet = mounting === "pvc" ? `pvc-${pvcMount.thickness}-${pvcMount.colour}` : undefined;
  const panelLabel = mounting === "pvc" ? `${pvcMount.thickness} mm ${pvcMount.colour} PVC` : "ACP";
  const acpPlan = onPanels && signW >= 50 && signH >= 50 ? planAcpJob(signW, signH, 1, mounting === "pvc" ? pvcMountPanels(pvcMount.thickness, pvcMount.colour) : undefined) : null;
  const panels = acpPlan?.count ?? 0;
  const mountingCents = onPanels ? acpPlan?.costCents ?? 0 : mounting === "channel" ? CHANNEL_MOUNT.priceCents : 0;
  const mountingReady = !onPanels || !!acpPlan;
  const lettersCents = rows.reduce((sum, row) => sum + (row.perLetter ?? 0) * row.count, 0);
  // Lit letters need LED power adapters: one per 9 letters across the whole sign (all lines together).
  const adapters = adaptersFor(count, spec.light);
  const adaptersCents = adapters * POWER_ADAPTER.priceCents;
  const install = installationOptions.find((option) => option.value === installation)!;
  const days = Math.max(1, Math.floor(Number(installDays)) || 1);
  const installCents = install.priceCents * days;
  const extrasCents = mountingCents + adaptersCents + installCents;
  const canAdd = !problems.length && !anyPoa && rows.every((row) => row.count > 0 && row.heightMm > 0 && row.perLetter !== null) && mountingReady;

  const materialOptions = (part: "face" | "sides" | "back") => letterMaterials.filter((material) => material.use.includes(part) && (nonLit || !SOLID_CODES.includes(material.code)) && (!frontLit || (part === "face" ? ["OPL", "ACR"].includes(material.code) : part === "back" ? ["PVC", "ALU", "STL"].includes(material.code) : material.code === "ALU")));
  const label = (code: string, name: string) => frontLit && code === "ACR" ? `ACR · 3 mm coloured acrylic (premium, up to ${FRONT_LIT_PREMIUM_MAX_MM} mm)` : `${code} · ${name}`;

  function add() {
    if (!canAdd) return;
    const signText = rows.map((row) => row.group.text.trim()).filter(Boolean).join(" ");
    rows.forEach((row, index) => onAdd({
      description: letterDescription(row.full, row.group.text, jobNoteFor(row.group), mounting), qty: row.count, unitCents: row.perLetter ?? 0, code: row.code,
      production: [letterProduction(row.full, mounting, acpPlan ? describeJobBill(acpPlan) : ""),
        rows.length > 1 && `Part of one sign "${signText}": ${rows.map((item) => `${item.group.text.trim() || "letters"} ${item.heightMm} mm`).join(" + ")}`,
        index === 0 && adapters && `Power: ${adapters} LED power adapter${adapters === 1 ? "" : "s"} for all ${count} letters on the sign (1 per ${POWER_ADAPTER.lettersPerAdapter})`,
        row.group.text.trim() && `Text: "${row.group.text.trim()}" (${row.count} letters)`, jobNoteFor(row.group) && `Job note: ${jobNoteFor(row.group)}`].filter(Boolean).join("\n"),
    }));
    // Adapters, mounting and installation are added once for the whole sign.
    if (adapters) onAdd({ description: `LED power adapter\n1 adapter powers up to ${POWER_ADAPTER.lettersPerAdapter} letters (${count} letters on this sign)`, qty: adapters, unitCents: POWER_ADAPTER.priceCents, code: POWER_ADAPTER.code, production: `Supply and wire ${adapters} LED power adapter${adapters === 1 ? "" : "s"} for ${count} illuminated letters${rows.length > 1 ? ` (${rows.map((item) => `${item.count} at ${item.heightMm} mm`).join(" + ")})` : ""} (1 per ${POWER_ADAPTER.lettersPerAdapter})` });
    if (onPanels && acpPlan) acpPlan.bill.forEach((entry, index) => onAdd({
      description: `${panelLabel} mounting panel ${panelName(entry.panel)}\nFor a ${signW} x ${signH} mm sign`, qty: entry.qty, unitCents: entry.panel.priceCents, code: mounting === "pvc" ? `MNT-${entry.panel.code}` : entry.panel.code,
      // The first panel line carries the sign size (and sheet type) so the job sheet can draw the full layout.
      ...(index === 0 ? { acp: { widthMm: signW, heightMm: signH, signs: 1, showDiagram: showAcpPlan, ...(panelSet ? { panelSet } : {}) } } : {}),
      production: `${panelLabel} mounting for the ${signW} x ${signH} mm sign: ${describeJobBill(acpPlan)} (cheapest combination); cut to size and mount the letters`,
    }));
    if (install.code) onAdd({ description: days > 1 ? `${install.name}\n${days} days on site` : install.name, qty: days, unitCents: install.priceCents, code: install.code, production: days > 1 ? `${install.production}: ${days} days` : install.production });
    if (mounting === "channel") onAdd({ description: "Aluminium mounting channels\nLetters hung / screwed on aluminium channels", qty: 1, unitCents: CHANNEL_MOUNT.priceCents, code: CHANNEL_MOUNT.code, production: "Fabricate aluminium channels; hang or screw the letters onto them" });
  }

  return <div className="cat-detail ls-form">
    <button type="button" className="cat-back" onClick={onBack}>← Back to products</button>
    <h3>3D letter sign</h3>
    <div className="field"><label htmlFor="ls-build">Ready-made build</label><select id="ls-build" value={build} onChange={(event) => pickBuild(event.target.value)}>
      <option value="">Custom build (set each part below)</option>{letterBuilds.filter((item) => OFFERED_LIGHTS.includes(item.parts[1])).map((item) => <option key={item.name} value={item.name}>{item.name} · {item.client}</option>)}
    </select></div>

    <div className="ls-grid">
      <div className="field"><label htmlFor="ls-type">① Type</label><select id="ls-type" value={spec.type} onChange={(event) => set({ type: event.target.value })}>{letterTypes.map((item) => <option key={item.code} value={item.code}>{item.code} · {item.name}</option>)}</select></div>
      <div className="field"><label htmlFor="ls-light">② Light</label><select id="ls-light" value={spec.light} onChange={(event) => { const light = event.target.value; set({ light, ...(light === "LF" ? { face: "OPL", sides: "ALU", back: "PVC" } : light === "NL" ? { face: "PVCW", sides: "PVCW", back: "PVCW", depth: "D10" } : SOLID_CODES.includes(spec.face) || SOLID_CODES.includes(spec.back) ? { face: "ACR", sides: "ALU", back: "PVC", depth: "D45" } : {}) }); }}>{letterLights.filter((item) => OFFERED_LIGHTS.includes(item.code) || item.code === spec.light).map((item) => <option key={item.code} value={item.code}>{item.code} · {item.name}</option>)}</select></div>
      <div className="field"><span className="ls-label">③ Height</span><span className="ls-panels ls-adapters">Set for each line of letters below</span><small>Different heights are fine in one sign</small></div>
      <div className="field"><label htmlFor="ls-depth">④ Depth</label><select id="ls-depth" value={full.depth} disabled={frontLit || flat} onChange={(event) => set({ depth: event.target.value })}>{letterDepths.map((item) => <option key={item.code} value={item.code}>{item.code} · {item.mm} mm · {item.use}</option>)}</select>{frontLit && <small>Auto by letter height; change it per line below</small>}</div>
      {flat ? <div className="field"><label htmlFor="ls-face">⑤ Face</label><select id="ls-face" value={spec.face} disabled>{materialOptions("face").map((item) => <option key={item.code} value={item.code}>{label(item.code, item.name)}</option>)}</select></div>
        : <div className="field"><span className="ls-label">⑤ Face</span><span className="ls-panels ls-adapters">Set for each line of letters below</span><small>Each line can have its own face and colours</small></div>}
      <div className="field"><label htmlFor="ls-sides">⑥ Sides</label><select id="ls-sides" value={spec.sides} disabled={flat} onChange={(event) => set({ sides: event.target.value })}>{materialOptions("sides").map((item) => <option key={item.code} value={item.code}>{item.code} · {item.name}</option>)}</select></div>
      <div className="field"><label htmlFor="ls-back">⑦ Back / base</label><select id="ls-back" value={spec.back} disabled={flat} onChange={(event) => set({ back: event.target.value })}>{materialOptions("back").map((item) => <option key={item.code} value={item.code}>{item.code} · {item.name}</option>)}</select></div>
    </div>

    {nonLit && <fieldset className="ls-note ls-flat"><legend>Letter material (non-lit)</legend>
      <div className="ls-grid">
        <div className="field"><label htmlFor="ls-flat">Material</label><select id="ls-flat" value={flatMaterial} onChange={(event) => pickFlat(event.target.value)}>
          <option value="PVCW">White PVC</option><option value="PVCB">Black PVC</option><option value="ACRW">White acrylic</option><option value="ACRB">Black acrylic</option><option value="ACRC">Coloured acrylic 3 mm</option><option value="metal">Fabricated metal (aluminium / stainless, set parts above)</option>
        </select></div>
        {flat && flatMaterial !== "ACRC" && <div className="field"><label htmlFor="ls-thick">Thickness</label><select id="ls-thick" value={flatOption} onChange={(event) => pickFlat(flatMaterial, event.target.value)}>
          {(flatMaterial.startsWith("PVC") ? ["D10", "D16", "D20"] : ["D05", "D10"]).map((depth) => <option key={depth} value={depth}>{Number(depth.slice(1))} mm</option>)}
        </select></div>}
        {flatMaterial === "ACRC" && <div className="field"><label htmlFor="ls-base">Base for extra depth</label><select id="ls-base" value={flatOption} onChange={(event) => pickFlat("ACRC", event.target.value)}>
          <option value="none">None (3 mm coloured only)</option><option value="ACRW-D05">5 mm white acrylic base (8 mm total)</option><option value="ACRB-D05">5 mm black acrylic base (8 mm total)</option><option value="ACRW-D10">10 mm white acrylic base (13 mm total)</option><option value="ACRB-D10">10 mm black acrylic base (13 mm total)</option>
        </select></div>}
        {flat && (() => { const solid = solidBuild(full); const band = heightBand(heightMm); return solid && "multiplier" in solid ? <div className="field"><span className="ls-label">Price factor</span><span className="ls-panels ls-adapters">×{solid.multiplier.toFixed(2)} of white PVC 10 mm</span><small>{band ? `$${band.noLight.toFixed(2)} → $${(band.noLight * solid.multiplier).toFixed(2)} per letter` : ""}</small></div> : null; })()}
      </div>
      {flat && <p className="admin-hint">{(() => { const solid = solidBuild(full); return solid && "multiplier" in solid ? solid.client : ""; })()}</p>}
    </fieldset>}
    {frontLit && rows.filter((row) => row.heightMm > 0).map((row) => <div key={row.group.key} className="ls-construction"><b>Front-lit construction for {row.heightMm} mm letters{row.group.text.trim() ? ` ("${row.group.text.trim()}")` : ""}</b>
      <span>Face: {spec.face === "ACR" ? "3 mm coloured acrylic (premium)" : "4.6 mm opal + printed vinyl"}</span>
      <span>Returns: aluminium {row.construction.returnThicknessMm} mm × {row.construction.returnDepthMm} mm deep{row.construction.increasesWithSize ? " minimum (thicker and deeper as size increases; confirm with production)" : ""}</span>
      <span>Base: {spec.back === "STL" ? "3 mm steel" : spec.back === "PVC" ? `${row.construction.pvcMm} mm PVC` : "aluminium"}</span></div>)}

    <div className={`ls-code${problems.length ? " is-bad" : ""}`}><span>Product code{rows.length > 1 ? "s" : ""}</span>{rows.map((row) => <code key={row.group.key}>{row.code}{rows.length > 1 && row.group.text.trim() ? <small className="ls-code-for"> {row.group.text.trim()}</small> : null}</code>)}
      {problems.length ? <ul>{problems.map((problem) => <li key={problem}>{problem}</li>)}</ul> : <small>{letterLights.find((item) => item.code === spec.light)?.production}</small>}</div>

    <fieldset className="ls-note ls-groups"><legend>Letters: one line per letter height</legend>
      {rows.map((row, index) => <div key={row.group.key} className="ls-group">
        <div className="field ls-wide"><label htmlFor={index ? `ls-text-${row.group.key}` : "ls-text"}>{rows.length > 1 ? `Letters ${index + 1}` : "Sign text"}</label><input id={index ? `ls-text-${row.group.key}` : "ls-text"} value={row.group.text} onChange={(event) => updateGroup(row.group.key, { text: event.target.value })} placeholder={index ? "e.g. AUT" : "e.g. CARPRO"} maxLength={120} /><small>{row.group.text ? `${countLetters(row.group.text)} letters (spaces are free)` : "Letters are counted for you; spaces are free."}</small></div>
        <div className="field"><label htmlFor={index ? `ls-height-${row.group.key}` : "ls-height"}>Tallest letter (mm)</label><input id={index ? `ls-height-${row.group.key}` : "ls-height"} inputMode="numeric" value={row.group.height} onChange={(event) => updateGroup(row.group.key, { height: digits(event.target.value) })} /><small>{row.band ? `${row.band.code} band (up to ${row.band.upTo} mm)` : row.heightMm > 1000 ? "Over 1000 mm: price on application" : ""}</small></div>
        <div className="field"><label htmlFor={index ? `ls-count-${row.group.key}` : "ls-count"}>Letters to charge</label><input id={index ? `ls-count-${row.group.key}` : "ls-count"} inputMode="numeric" value={row.group.letters} onChange={(event) => updateGroup(row.group.key, { letters: digits(event.target.value) })} placeholder={String(countLetters(row.group.text) || "")} /><small>Override, e.g. for a logo</small></div>
        <div className="field ls-group-price"><span className="ls-label">{row.count || 0} × {row.perLetter === null ? "POA" : money(row.perLetter)}</span><b>{row.perLetter === null ? "—" : money(row.perLetter * row.count)}</b>{rows.length > 1 && <button type="button" className="bill-remove" onClick={() => setGroups((current) => current.filter((group) => group.key !== row.group.key))} aria-label={`Remove letters ${index + 1}`}>Remove</button>}</div>
        <div className="ls-finish">
          <span className="ls-finish-title">Finish{row.group.text.trim() ? ` for "${row.group.text.trim()}"` : ""}</span>
          {frontLit && <div className="field"><label htmlFor={`ls-depth-${row.group.key}`}>Return depth</label><select id={`ls-depth-${row.group.key}`} value={row.group.depth ?? ""} onChange={(event) => updateGroup(row.group.key, { depth: event.target.value || undefined })}>
            <option value="">Auto · {Number(row.construction.autoDepthCode.slice(1))} mm (by height)</option>{FRONT_LIT_DEPTHS.map((code) => <option key={code} value={code}>{code} · {Number(code.slice(1))} mm</option>)}</select>
            {row.construction.manualDepth && <small>Chosen by hand (standard for this height is {Number(row.construction.autoDepthCode.slice(1))} mm)</small>}</div>}
          {!flatSign && <div className="field"><label htmlFor={`ls-face-${row.group.key}`}>Face</label><select id={`ls-face-${row.group.key}`} value={row.full.face} onChange={(event) => updateGroup(row.group.key, { face: event.target.value })}>{materialOptions("face").map((item) => <option key={item.code} value={item.code}>{label(item.code, item.name)}</option>)}</select></div>}
          <div className="field"><label htmlFor={`ls-nface-${row.group.key}`}>Face colour / finish</label><input id={`ls-nface-${row.group.key}`} value={row.group.faceNote} onChange={(event) => updateGroup(row.group.key, { faceNote: event.target.value })} placeholder={row.full.face === "ACR" || row.full.face === "ACRC" ? "e.g. Red coloured acrylic" : "e.g. Red vinyl"} />
            {/* Quick pick: fills the face note; click again to clear. Anything else is typed in. */}
            {row.full.face !== "ACR" && row.full.face !== "ACRC" && <button type="button" className={`ls-chip${row.group.faceNote === PRINTED_VINYL ? " is-on" : ""}`} aria-pressed={row.group.faceNote === PRINTED_VINYL} onClick={() => updateGroup(row.group.key, { faceNote: row.group.faceNote === PRINTED_VINYL ? "" : PRINTED_VINYL })}>{row.group.faceNote === PRINTED_VINYL ? "✓ " : "+ "}{PRINTED_VINYL}</button>}</div>
          {flatSign ? <div className="field"><span className="ls-label">Walls (sides) colour</span><span className="ls-panels ls-adapters">{flatWalls(spec)}</span><small>Set by the letter material; change it under Letter material</small></div>
            : spec.sides === "ALU" ? <div className="field"><label htmlFor={`ls-nsides-${row.group.key}`}>Walls (aluminium colour)</label>
            <select id={`ls-nsides-${row.group.key}`} value={ALUMINIUM_SIDE_COLOURS.includes(row.group.sidesNote) || !row.group.sidesNote ? row.group.sidesNote : "__other"} onChange={(event) => updateGroup(row.group.key, { sidesNote: event.target.value === "__other" ? " " : event.target.value })}>
              <option value="">Choose a colour</option>{ALUMINIUM_SIDE_COLOURS.map((colour) => <option key={colour} value={colour}>{colour}</option>)}<option value="__other">Other…</option>
            </select>
            {row.group.sidesNote && !ALUMINIUM_SIDE_COLOURS.includes(row.group.sidesNote) && <input aria-label={`Other wall colour for line ${index + 1}`} value={row.group.sidesNote.trimStart()} onChange={(event) => updateGroup(row.group.key, { sidesNote: event.target.value || " " })} placeholder="e.g. PMS 286C powder coat" style={{ marginTop: 6 }} />}</div>
            : <div className="field"><label htmlFor={`ls-nsides-${row.group.key}`}>Walls (sides) colour</label><input id={`ls-nsides-${row.group.key}`} value={row.group.sidesNote} onChange={(event) => updateGroup(row.group.key, { sidesNote: event.target.value })} placeholder="Colour / finish" /></div>}
          {lit && <div className="field"><label htmlFor={`ls-nled-${row.group.key}`}>LED colour</label><input id={`ls-nled-${row.group.key}`} value={row.group.ledNote} onChange={(event) => updateGroup(row.group.key, { ledNote: event.target.value })} placeholder="e.g. Warm white" />
            <button type="button" className={`ls-chip${row.group.ledNote === WHITE_LED ? " is-on" : ""}`} aria-pressed={row.group.ledNote === WHITE_LED} onClick={() => updateGroup(row.group.key, { ledNote: row.group.ledNote === WHITE_LED ? "" : WHITE_LED })}>{row.group.ledNote === WHITE_LED ? "✓ " : "+ "}{WHITE_LED}</button></div>}
          {row.problems.length > 0 && <ul className="ls-finish-problems">{row.problems.map((problem) => <li key={problem}>{problem}</li>)}</ul>}
        </div>
      </div>)}
      <div className="ls-groups-foot"><button type="button" className="bill-add" onClick={() => setGroups((current) => [...current, { key: Math.max(...current.map((group) => group.key)) + 1, text: "", height: "", letters: "", ...blankFinish }])}>+ Add letters at another height</button>
        {rows.length > 1 && <span><b>{count} letters in total</b> · power adapters, mounting and installation are worked out once for the whole sign</span>}</div>
    </fieldset>

    <fieldset className="ls-note"><legend>Mounting</legend>
      <div className="ls-mount">{mountingOptions.map((option) => <label key={option.value} className={mounting === option.value ? "is-on" : ""}><input type="radio" name="ls-mounting" checked={mounting === option.value} onChange={() => setMounting(option.value)} />
        <span><b>{option.name}</b><small>{option.value === "wall" ? "No extra charge" : option.value === "acp" ? "Cheapest panel combination for the sign size" : option.value === "pvc" ? `1220 × 2440 sheets · white ${money(PVC_MOUNT_PRICES.white)}, black ${money(PVC_MOUNT_PRICES.black)}` : `${money(CHANNEL_MOUNT.priceCents)}`}</small></span></label>)}</div>
      {mounting === "pvc" && <div className="ls-grid">
        <div className="field"><label htmlFor="ls-pvc-colour">PVC colour</label><select id="ls-pvc-colour" value={pvcMount.colour} onChange={(event) => setPvcMount({ ...pvcMount, colour: event.target.value as "white" | "black" })}><option value="white">White · {money(PVC_MOUNT_PRICES.white)} per sheet</option><option value="black">Black · {money(PVC_MOUNT_PRICES.black)} per sheet</option></select></div>
        <div className="field"><label htmlFor="ls-pvc-thick">PVC thickness</label><select id="ls-pvc-thick" value={pvcMount.thickness} onChange={(event) => setPvcMount({ ...pvcMount, thickness: Number(event.target.value) })}>{PVC_THICKNESSES.map((mm) => <option key={mm} value={mm}>{mm} mm</option>)}</select><small>1220 × 2440 mm sheets, same price for 10, 16 and 20 mm</small></div>
      </div>}
      {onPanels && <div className="ls-grid">
        <div className="field"><label htmlFor="ls-sw">Overall sign width (mm)</label><input id="ls-sw" inputMode="numeric" value={signSize.width} onChange={(event) => setSignSize({ ...signSize, width: digits(event.target.value) })} placeholder="e.g. 3000" /></div>
        <div className="field"><label htmlFor="ls-sh">Overall sign height (mm)</label><input id="ls-sh" inputMode="numeric" value={signSize.height} onChange={(event) => setSignSize({ ...signSize, height: digits(event.target.value) })} placeholder="e.g. 600" /></div>
        <div className="field"><span className="ls-panels">{acpPlan ? `${describeJobBill(acpPlan)} = ${money(mountingCents)}` : "Enter the overall sign size"}</span></div>
      </div>}
      {onPanels && acpPlan && <AcpDiagram widthMm={signW} heightMm={signH} job={acpPlan} id="ls-acp" panelSet={panelSet} />}
      {onPanels && acpPlan && <label className="cat-show-diagram"><input type="checkbox" checked={showAcpPlan} onChange={(event) => setShowAcpPlan(event.target.checked)} /> Show the {panelLabel} cutting plan to the customer on the {kind}</label>}
    </fieldset>

    <fieldset className="ls-note"><legend>Power and installation</legend>
      <div className="ls-grid ls-power">
        <div className="field"><span className="ls-label">LED power adapters</span><span className="ls-panels ls-adapters">{lit ? (count ? `${adapters} × ${money(POWER_ADAPTER.priceCents)} = ${money(adaptersCents)}` : "Enter the sign text") : "Not needed (no light)"}</span><small>{lit ? `1 adapter per ${POWER_ADAPTER.lettersPerAdapter} letters, added automatically` : "Non-lit letters have no power supply"}</small></div>
        <div className="field"><label htmlFor="ls-install">Installation</label>
          <div className="ls-install-row">
            <select id="ls-install" value={installation} onChange={(event) => setInstallation(event.target.value as Installation)}>{installationOptions.map((option) => <option key={option.value} value={option.value}>{option.name}{option.priceCents ? ` · ${money(option.priceCents)}` : ""}</option>)}</select>
            {install.code && <div className="ls-days" role="group" aria-label="Installation days">
              <button type="button" onClick={() => setInstallDays(String(Math.max(1, days - 1)))} disabled={days <= 1} aria-label="One day less">−</button>
              <input id="ls-install-days" aria-label="Installation days" type="number" min={1} step={1} inputMode="numeric" value={installDays} onChange={(event) => setInstallDays(event.target.value)} onBlur={() => setInstallDays(String(days))} />
              <button type="button" onClick={() => setInstallDays(String(days + 1))} aria-label="One day more">+</button>
              <span>day{days === 1 ? "" : "s"}</span>
            </div>}
          </div>
          <small>{install.code ? `${days} day${days === 1 ? "" : "s"} × ${money(install.priceCents)} = ${money(installCents)}` : "Add installation if we're fitting the sign"}</small></div>
      </div>
    </fieldset>

    <fieldset className="ls-note"><legend>Other notes for the whole sign (optional)</legend>
      <div className="field"><label htmlFor="ls-nother" className="sr-only">Other notes</label><input id="ls-nother" value={note.other} onChange={(event) => setNote({ ...note, other: event.target.value })} placeholder="e.g. PMS 286C, stand-offs 25 mm, match existing sign…" /></div>
    </fieldset>

    {anyPoa ? <p className="admin-error">Over 1000 mm is price on application: add a custom line with your price.</p>
      : <div className="cat-price ls-total"><span>{rows.length > 1 ? `${count || 0} letters (${rows.map((row) => `${row.count} × ${row.perLetter === null ? "POA" : money(row.perLetter)}`).join(" + ")})` : `${count || 0} letters × ${money(rows[0].perLetter ?? 0)}`}{adapters ? ` + ${adapters} adapter${adapters === 1 ? "" : "s"} ${money(adaptersCents)}` : ""}{mountingCents ? ` + ${onPanels ? `${panels} ${panelLabel} panel${panels === 1 ? "" : "s"}` : "channels"} ${money(mountingCents)}` : ""}{installCents ? ` + installation${days > 1 ? ` ${days} days` : ""} ${money(installCents)}` : ""}</span><b>{money(lettersCents + extrasCents)}</b><small>{spec.light === "LRGB" && !RGB_SURCHARGE_PER_LETTER ? "RGB surcharge isn't set in the catalog yet; adjust the price if needed." : "ex GST"}</small></div>}
    <button type="button" className="button button-orange" disabled={!canAdd} onClick={add}>{problems.length ? "Fix the build to add it" : !count ? "Enter the sign text" : !mountingReady ? "Enter the sign size for ACP panels" : `Add to ${kind}`}</button>
  </div>;
}
