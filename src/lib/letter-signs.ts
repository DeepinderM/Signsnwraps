// 3D letter signs: the product code, prices and build rules from docs/Signsnwraps_3D_Letter_Catalog.md.
// One code tells everyone everything: the client what they're getting, production exactly what to build.
//
//   3DL - LF - H300 - D45 - ACR - ALU - PVC
//   Type  Light Height Depth Face  Sides Back      (always 7 parts, always in this order)
//
// To change prices, add a material or a depth, edit the tables below; the quote picker, the code
// decoder and the production job sheet all read from here. Prices are per letter, ex GST.

export type LetterPart = { code: string; name: string; client: string; production: string };

export const letterTypes: LetterPart[] = [
  { code: "3DL", name: "3D Letter", client: "3D letter", production: "3D letter" },
  { code: "3DLOG", name: "3D Logo / shape", client: "3D logo / shape (priced like a letter of the same height)", production: "3D logo / shape, cut to supplied artwork" },
];

/** Rule: NL = no light at all; every lit option starts with L. */
export const letterLights: (LetterPart & { lit: boolean; rgb?: boolean })[] = [
  { code: "NL", name: "No light", lit: false, client: "Solid letter, no glow", production: "NO LEDs, NO power supply, NO wiring" },
  { code: "LF", name: "Front-lit", lit: true, client: "Letter face glows", production: "LEDs inside, light through a translucent face (opal + printed vinyl, or coloured acrylic)" },
  { code: "LH", name: "Halo-lit", lit: true, client: "Glow behind the letter onto the wall", production: "LEDs inside, solid metal face, clear back, letters stood off the wall" },
  { code: "LFH", name: "Front + Halo", lit: true, client: "Face glows plus glow behind", production: "LEDs inside, translucent face, clear back, stood off the wall" },
  { code: "LRGB", name: "RGB colour-change", lit: true, rgb: true, client: "Face changes colour", production: "RGB LEDs + controller" },
];

export const letterDepths = [
  { code: "D03", mm: 3, use: "Coloured acrylic 3 mm (non-lit)" },
  { code: "D05", mm: 5, use: "Acrylic 5 mm (non-lit)" },
  { code: "D08", mm: 8, use: "Coloured 3 mm on 5 mm acrylic base (non-lit)" },
  { code: "D10", mm: 10, use: "PVC / acrylic 10 mm (non-lit)" },
  { code: "D13", mm: 13, use: "Coloured 3 mm on 10 mm acrylic base (non-lit)" },
  { code: "D16", mm: 16, use: "PVC 16 mm (non-lit)" },
  { code: "D20", mm: 20, use: "PVC 20 mm (non-lit)" },
  { code: "D30", mm: 30, use: "Standard non-lit" },
  { code: "D45", mm: 45, use: "Standard lit (halo / RGB)" },
  { code: "D60", mm: 60, use: "Front-lit letters up to 500 mm" },
  { code: "D50", mm: 50, use: "Stainless / premium" },
  { code: "D75", mm: 75, use: "Large letters" },
  { code: "D80", mm: 80, use: "Front-lit letters over 500 mm" },
  { code: "D100", mm: 100, use: "Extra large / high-impact" },
];

/** Materials for face (F), sides (S) and back (B). Colours and finishes go on the job note, never in the code. */
export const letterMaterials: (LetterPart & { use: ("face" | "sides" | "back")[]; translucent?: boolean; clear?: boolean; metal?: boolean })[] = [
  { code: "OPL", name: "Opal acrylic 4.6 mm + printed vinyl", client: "Opal acrylic with printed vinyl (to your artwork)", production: "4.6 mm opal acrylic sheet with printed vinyl applied (per artwork)", use: ["face"], translucent: true },
  { code: "ACR", name: "Acrylic", client: "Acrylic", production: "Acrylic (colour on job note; front-lit premium face = 3 mm coloured acrylic)", use: ["face", "sides", "back"], translucent: true },
  { code: "ACC", name: "Clear acrylic", client: "Clear acrylic", production: "Clear acrylic", use: ["back"], clear: true },
  { code: "ALU", name: "Aluminium", client: "Aluminium", production: "Aluminium (powder-coat colour on job note)", use: ["face", "sides", "back"], metal: true },
  // The catalog's materials table lists SS for face and sides, but its own "Stainless Non-lit" build has an SS back, so backs are allowed.
  { code: "SS", name: "Stainless steel", client: "Brushed stainless steel", production: "Stainless steel (brushed)", use: ["face", "sides", "back"], metal: true },
  { code: "PVC", name: "PVC", client: "PVC", production: "PVC (16 mm for letters over 60 mm tall, 10 mm for 60 mm or less)", use: ["sides", "back"] },
  { code: "STL", name: "Steel 3 mm", client: "Steel", production: "3 mm steel base (where the sign is stuck or hung)", use: ["back"], metal: true },
  // Flat-cut solid letters (non-lit): the colour changes the price, so it is part of the code.
  { code: "PVCW", name: "White PVC", client: "White PVC", production: "White PVC", use: ["face", "sides", "back"] },
  { code: "PVCB", name: "Black PVC", client: "Black PVC", production: "Black PVC", use: ["face", "sides", "back"] },
  { code: "ACRW", name: "White acrylic", client: "White acrylic", production: "White acrylic", use: ["face", "sides", "back"] },
  { code: "ACRB", name: "Black acrylic", client: "Black acrylic", production: "Black acrylic", use: ["face", "sides", "back"] },
  { code: "ACRC", name: "Coloured acrylic 3 mm", client: "Coloured acrylic", production: "3 mm coloured acrylic (colour on job note)", use: ["face", "sides", "back"] },
];

/**
 * Non-illuminated flat-cut letters. The non-lit price table is for 10 mm white PVC; everything else is a multiple of it:
 *   PVC     white 10 mm ×1.00 · 16 mm ×1.20 · 20 mm ×1.30;  black = white × 1.20 (10 ×1.20 · 16 ×1.44 · 20 ×1.56)
 *   Acrylic white/black 5 mm ×1.00 · 10 mm ×1.30
 *   Coloured acrylic 3 mm ×1.00; for more depth it sits on a white/black acrylic base (5 or 10 mm),
 *   priced as both layers: 3+5 mm ×2.00, 3+10 mm ×2.30.
 */
export const SOLID_CODES = ["PVCW", "PVCB", "ACRW", "ACRB", "ACRC"];
const PVC_THICKNESS: Record<string, number> = { D10: 1, D16: 1.2, D20: 1.3 };
const ACRYLIC_THICKNESS: Record<string, number> = { D05: 1, D10: 1.3 };
const BLACK_PVC = 1.2;
const COLOURED_BASE: Record<string, { baseDepth: string; totalMm: number }> = { D08: { baseDepth: "D05", totalMm: 8 }, D13: { baseDepth: "D10", totalMm: 13 } };

export type SolidBuild = { multiplier: number; client: string; production: string; layers: { label: string; value: string }[] };

/** Price multiplier and wording for a flat-cut solid letter, or the reasons the combination isn't valid. */
export function solidBuild(spec: Pick<LetterSpec, "depth" | "face" | "sides" | "back">): SolidBuild | { problems: string[] } | null {
  const parts = [spec.face, spec.sides, spec.back];
  if (!parts.some((code) => SOLID_CODES.includes(code))) return null;
  const mm = (code: string) => Number(code.replace(/^D0?/, ""));
  const same = parts.every((code) => code === spec.face);
  if (same && (spec.face === "PVCW" || spec.face === "PVCB")) {
    const factor = PVC_THICKNESS[spec.depth];
    if (!factor) return { problems: ["PVC letters come in 10, 16 or 20 mm (D10, D16, D20)."] };
    const colour = spec.face === "PVCB" ? "Black" : "White";
    const multiplier = Math.round(factor * (spec.face === "PVCB" ? BLACK_PVC : 1) * 100) / 100;
    return { multiplier, client: `${colour} PVC, ${mm(spec.depth)} mm thick`, production: `Cut from ${mm(spec.depth)} mm ${colour.toLowerCase()} PVC`, layers: [{ label: "Material", value: `${colour} PVC` }, { label: "Thickness", value: `${mm(spec.depth)} mm` }] };
  }
  if (same && (spec.face === "ACRW" || spec.face === "ACRB")) {
    const factor = ACRYLIC_THICKNESS[spec.depth];
    if (!factor) return { problems: ["White and black acrylic letters come in 5 or 10 mm (D05, D10)."] };
    const colour = spec.face === "ACRB" ? "Black" : "White";
    return { multiplier: factor, client: `${colour} acrylic, ${mm(spec.depth)} mm thick`, production: `Cut from ${mm(spec.depth)} mm ${colour.toLowerCase()} acrylic`, layers: [{ label: "Material", value: `${colour} acrylic` }, { label: "Thickness", value: `${mm(spec.depth)} mm` }] };
  }
  if (same && spec.face === "ACRC") {
    if (spec.depth !== "D03") return { problems: ["Coloured acrylic is 3 mm (D03). For more depth, put it on a white or black acrylic base (D08 or D13)."] };
    return { multiplier: 1, client: "Coloured acrylic, 3 mm thick", production: "Cut from 3 mm coloured acrylic (colour on job note)", layers: [{ label: "Material", value: "Coloured acrylic" }, { label: "Thickness", value: "3 mm" }] };
  }
  if (spec.face === "ACRC" && spec.sides === spec.back && (spec.back === "ACRW" || spec.back === "ACRB")) {
    const base = COLOURED_BASE[spec.depth];
    if (!base) return { problems: ["Coloured acrylic on a base is 3 + 5 mm (D08) or 3 + 10 mm (D13)."] };
    const colour = spec.back === "ACRB" ? "black" : "white";
    const baseMm = mm(base.baseDepth);
    return {
      multiplier: 1 + ACRYLIC_THICKNESS[base.baseDepth],
      client: `Coloured acrylic on a ${baseMm} mm ${colour} acrylic base (${base.totalMm} mm thick)`,
      production: `3 mm coloured acrylic face bonded to a ${baseMm} mm ${colour} acrylic base (${base.totalMm} mm total)`,
      layers: [{ label: "Face", value: "3 mm coloured acrylic (colour on job note)" }, { label: "Base", value: `${baseMm} mm ${colour} acrylic` }, { label: "Total", value: `${base.totalMm} mm` }],
    };
  }
  return { problems: ["Flat-cut letters use one material all through (PVC or acrylic), or coloured acrylic on a white/black acrylic base."] };
}

/** Price per letter by height band (tallest letter). Over 1000 mm is POA. */
export const letterHeights = [
  { code: "H080", upTo: 80, noLight: 90, lit: 150 }, { code: "H100", upTo: 100, noLight: 87, lit: 145 },
  { code: "H150", upTo: 150, noLight: 111, lit: 185 }, { code: "H200", upTo: 200, noLight: 123, lit: 205 },
  { code: "H250", upTo: 250, noLight: 132, lit: 220 }, { code: "H300", upTo: 300, noLight: 138, lit: 230 },
  { code: "H350", upTo: 350, noLight: 144, lit: 240 }, { code: "H400", upTo: 400, noLight: 150, lit: 250 },
  { code: "H450", upTo: 450, noLight: 156, lit: 260 }, { code: "H500", upTo: 500, noLight: 162, lit: 270 },
  { code: "H550", upTo: 550, noLight: 177, lit: 295 }, { code: "H600", upTo: 600, noLight: 219, lit: 365 },
  { code: "H650", upTo: 650, noLight: 246, lit: 410 }, { code: "H700", upTo: 700, noLight: 282, lit: 470 },
  { code: "H750", upTo: 750, noLight: 300, lit: 500 }, { code: "H800", upTo: 800, noLight: 312, lit: 520 },
  { code: "H850", upTo: 850, noLight: 420, lit: 700 }, { code: "H900", upTo: 900, noLight: 480, lit: 800 },
  { code: "H950", upTo: 950, noLight: 540, lit: 900 }, { code: "H1000", upTo: 1000, noLight: 600, lit: 1000 },
];

/** RGB is "Lit + surcharge" per letter. The catalog doesn't set the surcharge yet: 0 until it's confirmed. */
export const RGB_SURCHARGE_PER_LETTER = 0;

/** Light types offered in the quote builder (the others stay here so older codes still decode on job sheets). */
export const OFFERED_LIGHTS = ["LF", "NL"];
/** Front-lit return depths staff can pick instead of the automatic one (by letter height). */
export const FRONT_LIT_DEPTHS = ["D45", "D50", "D60", "D75", "D80", "D100"];

/** Ready-made builds: pick one, then add the height. */
export const letterBuilds = [
  { name: "Classic Front-lit", parts: ["3DL", "LF", "D60", "OPL", "ALU", "PVC"], client: "Glowing letters, printed opal face", production: "4.6 mm opal face + printed vinyl, aluminium returns, PVC back, LEDs" },
  { name: "Premium Front-lit", parts: ["3DL", "LF", "D60", "ACR", "ALU", "PVC"], client: "Glowing letters, coloured acrylic face (up to 300 mm)", production: "3 mm coloured acrylic face, aluminium returns, PVC back, LEDs" },
  { name: "Premium Halo", parts: ["3DL", "LH", "D45", "SS", "SS", "ACC"], client: "Stainless letters with glow behind", production: "Stainless face + sides, clear back, LEDs, stand-offs" },
  { name: "Front + Halo", parts: ["3DL", "LFH", "D45", "ACR", "ALU", "ACC"], client: "Face + wall glow", production: "Acrylic face, aluminium sides, clear back, LEDs, stand-offs" },
  { name: "RGB Colour", parts: ["3DL", "LRGB", "D45", "ACR", "ALU", "PVC"], client: "Colour-changing letters", production: "Acrylic face, aluminium sides, PVC back, RGB LEDs + controller" },
  { name: "White PVC Non-lit", parts: ["3DL", "NL", "D10", "PVCW", "PVCW", "PVCW"], client: "Flat-cut white PVC letters", production: "Cut from 10 mm white PVC. No LEDs" },
  { name: "Black PVC Non-lit", parts: ["3DL", "NL", "D10", "PVCB", "PVCB", "PVCB"], client: "Flat-cut black PVC letters", production: "Cut from 10 mm black PVC. No LEDs" },
  { name: "Acrylic Non-lit", parts: ["3DL", "NL", "D05", "ACRW", "ACRW", "ACRW"], client: "Flat-cut white or black acrylic letters", production: "Cut from 5 mm acrylic. No LEDs" },
  { name: "Coloured Acrylic Non-lit", parts: ["3DL", "NL", "D03", "ACRC", "ACRC", "ACRC"], client: "Flat-cut coloured acrylic letters", production: "Cut from 3 mm coloured acrylic. No LEDs" },
  { name: "Aluminium Non-lit", parts: ["3DL", "NL", "D45", "ALU", "ALU", "ALU"], client: "Powder-coated metal letters", production: "Fabricated aluminium. No LEDs" },
  { name: "Stainless Non-lit", parts: ["3DL", "NL", "D50", "SS", "SS", "SS"], client: "Brushed stainless letters", production: "Fabricated stainless. No LEDs" },
] as const;

export type LetterSpec = { type: string; light: string; heightMm: number; depth: string; face: string; sides: string; back: string };

const find = <T extends { code: string }>(list: T[], code: string) => list.find((item) => item.code === code);
export const heightBand = (mm: number) => letterHeights.find((band) => mm > 0 && mm <= band.upTo) ?? null;

/** Popular powder-coat colours for aluminium returns (sides). Colours go on the job note, never in the code. */
export const ALUMINIUM_SIDE_COLOURS = ["White", "Black matt", "Black gloss", "Mirror gold", "Brush gold", "Blue", "Red"];

/**
 * Front-lit construction, set by the tallest letter:
 * returns (side walls) are aluminium: up to 500 mm → 60 mm deep, 0.6 mm; 500–1000 mm → 80 mm deep, 0.8 mm;
 * over 1000 mm → at least 100 mm deep, 1 mm, increasing with size (confirm for the job).
 * PVC base: 16 mm when letters are over 60 mm tall, 10 mm at 60 mm or less.
 * Premium 3 mm coloured acrylic faces are only for letters up to 300 mm; otherwise 4.6 mm opal + printed vinyl.
 */
export const FRONT_LIT_PREMIUM_MAX_MM = 300;
/** Construction for a height; pass depthCode when staff chose the return depth by hand (thickness still follows the height). */
export function frontLitConstruction(heightMm: number, depthCode?: string) {
  const large = heightMm > 500, extra = heightMm > 1000;
  const autoDepth = extra ? "D100" : large ? "D80" : "D60";
  const chosen = depthCode ? letterDepths.find((item) => item.code === depthCode) : undefined;
  return {
    depthCode: chosen?.code ?? autoDepth, autoDepthCode: autoDepth, manualDepth: !!chosen && chosen.code !== autoDepth,
    returnDepthMm: chosen?.mm ?? (extra ? 100 : large ? 80 : 60), returnThicknessMm: extra ? 1 : large ? 0.8 : 0.6, pvcMm: heightMm > 60 ? 16 : 10,
    /** Over 1000 mm the depth and thickness grow with the size: production confirms them for the job. */
    increasesWithSize: extra,
  };
}

/** Illuminated letters need LED power adapters: one adapter powers up to 9 letters. */
export const POWER_ADAPTER = { priceCents: 35_000, lettersPerAdapter: 9, code: "3DL-ADPT" };
export function adaptersFor(letters: number, light: string) {
  const lit = letterLights.find((item) => item.code === light)?.lit;
  return lit && letters > 0 ? Math.ceil(letters / POWER_ADAPTER.lettersPerAdapter) : 0;
}

/** Installation options (the same products as the Installation catalog category). */
export const installationOptions = [
  { value: "none", name: "No installation", priceCents: 0, code: "", production: "" },
  { value: "basic", name: "Basic Installation", priceCents: 35_000, code: "INST-BASIC", production: "Basic installation on site" },
  { value: "day", name: "Full Day Installation", priceCents: 65_000, code: "INST-DAY", production: "Full day installation on site (one installer)" },
  { value: "day-assist", name: "Full Day Installation With Assistance", priceCents: 85_000, code: "INST-DAY-ASSIST", production: "Full day installation on site with an assistant (two people)" },
] as const;
export type Installation = (typeof installationOptions)[number]["value"];

/** Mounting: straight onto the wall, on ACP panels (cheapest combination, see acp-panels.ts) or on aluminium channels. */
export const CHANNEL_MOUNT = { priceCents: 35_000, code: "3DL-CHAN" };
export const mountingOptions = [
  { value: "wall", name: "Direct to wall", client: "Mounted directly to the wall", production: "Mount letters directly to the wall" },
  { value: "acp", name: "On ACP panel(s)", client: "Mounted on ACP panel(s)", production: "Mount letters on ACP panel(s)" },
  { value: "pvc", name: "On PVC panel(s)", client: "Mounted on PVC panel(s)", production: "Mount letters on PVC panel(s)" },
  { value: "channel", name: "Hung / screwed on aluminium channels", client: "Hung on aluminium channels", production: "Fix letters to aluminium channels (hung or screwed)" },
] as const;
export type Mounting = (typeof mountingOptions)[number]["value"];

/** Build rules (production check). Returns the problems; an empty list means the build is valid. */
export function letterRuleProblems(spec: Pick<LetterSpec, "light" | "face" | "sides" | "back"> & { heightMm?: number; depth?: string }) {
  const face = find(letterMaterials, spec.face), back = find(letterMaterials, spec.back), sides = find(letterMaterials, spec.sides);
  const problems: string[] = [];
  if (!face || !face.use.includes("face")) problems.push(`${spec.face || "?"} can't be used as a face.`);
  if (!sides || !sides.use.includes("sides")) problems.push(`${spec.sides || "?"} can't be used for sides.`);
  if (!back || !back.use.includes("back")) problems.push(`${spec.back || "?"} can't be used as a back.`);
  if (!face || !back) return problems;
  const solidParts = [spec.face, spec.sides, spec.back].some((code) => SOLID_CODES.includes(code));
  if (solidParts && spec.light !== "NL") problems.push("PVC and acrylic flat-cut letters (PVCW, PVCB, ACRW, ACRB, ACRC) are for non-lit signs only.");
  if (solidParts && spec.light === "NL" && spec.depth) { const solid = solidBuild({ depth: spec.depth, face: spec.face, sides: spec.sides, back: spec.back }); if (solid && "problems" in solid) problems.push(...solid.problems); }
  switch (spec.light) {
    case "LF":
      if (!["OPL", "ACR"].includes(spec.face)) problems.push(`Front-lit needs a translucent face: OPL (4.6 mm opal + printed vinyl) or ACR (3 mm coloured acrylic); light can't get through ${face.name.toLowerCase()}.`);
      if (spec.face === "ACR" && spec.heightMm && spec.heightMm > FRONT_LIT_PREMIUM_MAX_MM) problems.push(`Coloured acrylic (ACR) faces are only for letters up to ${FRONT_LIT_PREMIUM_MAX_MM} mm; use OPL (opal + printed vinyl).`);
      if (!["PVC", "ALU", "STL"].includes(spec.back)) problems.push("Front-lit needs a PVC, ALU or STL (3 mm steel) back.");
      // The depth normally follows the height (D60 / D80 / D100) but staff can choose another one when the job needs it.
      if (spec.depth && !FRONT_LIT_DEPTHS.includes(spec.depth)) problems.push(`Front-lit returns are ${FRONT_LIT_DEPTHS.map((code) => code.slice(1)).join(", ")} mm deep (${FRONT_LIT_DEPTHS.join(", ")}).`);
      break;
    case "LRGB":
      if (spec.face !== "ACR" && spec.face !== "OPL") problems.push(`RGB needs a translucent face (ACR or OPL); light can't get through ${face.name.toLowerCase()}.`);
      if (!["PVC", "ALU"].includes(spec.back)) problems.push("RGB needs a PVC or ALU back.");
      break;
    case "LH":
      if (!["ALU", "SS"].includes(spec.face)) problems.push("Halo-lit needs a solid metal face (ALU or SS), not a translucent face.");
      if (spec.back !== "ACC") problems.push("Halo-lit needs a clear acrylic (ACC) back so the light can reach the wall.");
      break;
    case "LFH":
      if (spec.face !== "ACR" && spec.face !== "OPL") problems.push("Front + Halo needs a translucent face (ACR or OPL).");
      if (spec.back !== "ACC") problems.push("Front + Halo needs a clear acrylic (ACC) back.");
      break;
  }
  return problems;
}

export function letterCode(spec: LetterSpec) {
  const band = heightBand(spec.heightMm);
  return [spec.type, spec.light, band ? band.code : "HPOA", spec.depth, spec.face, spec.sides, spec.back].join("-");
}

/** Price per letter (ex GST, cents), or null for POA (over 1000 mm). */
export function letterPriceCents(spec: Pick<LetterSpec, "light" | "heightMm"> & Partial<Pick<LetterSpec, "depth" | "face" | "sides" | "back">>) {
  const band = heightBand(spec.heightMm);
  if (!band) return null;
  const light = find(letterLights, spec.light);
  // Non-lit flat-cut letters: the table price is 10 mm white PVC; other materials/thicknesses are multiples of it.
  if (!light?.lit && spec.face && spec.sides && spec.back && spec.depth) {
    const solid = solidBuild({ depth: spec.depth, face: spec.face, sides: spec.sides, back: spec.back });
    if (solid && "multiplier" in solid) return Math.round(band.noLight * 100 * solid.multiplier);
  }
  return ((light?.lit ? band.lit : band.noLight) + (light?.rgb ? RGB_SURCHARGE_PER_LETTER : 0)) * 100;
}

/** Letters to charge for: every character except spaces ("BAKERY" = 6, "MY CAFE" = 6). */
export const countLetters = (text: string) => [...text.replace(/\s+/g, "")].length;

export type DecodedLetterCode = {
  code: string; valid: boolean; problems: string[];
  parts: { label: string; code: string; name: string; client: string; production: string }[];
  lit: boolean;
};

/** Reads a code like 3DL-LF-H300-D45-ACR-ALU-PVC back into plain words for the client and production. */
export function decodeLetterCode(code: string): DecodedLetterCode | null {
  const parts = code.trim().toUpperCase().split("-");
  if (parts.length !== 7 || !find(letterTypes, parts[0])) return null;
  const [type, light, height, depth, face, sides, back] = parts;
  const t = find(letterTypes, type)!, l = find(letterLights, light), h = letterHeights.find((band) => band.code === height), d = find(letterDepths, depth);
  const m = (value: string) => find(letterMaterials, value);
  const problems = [
    ...(l ? [] : [`Unknown light code ${light}.`]),
    ...(h || height === "HPOA" ? [] : [`Unknown height code ${height}.`]),
    ...(d ? [] : [`Unknown depth code ${depth}.`]),
    ...letterRuleProblems({ light, face, sides, back, depth, heightMm: h?.upTo }),
  ];
  const below = h ? letterHeights[letterHeights.indexOf(h) - 1]?.upTo ?? 0 : 0;
  return {
    code: parts.join("-"), valid: problems.length === 0, problems, lit: !!l?.lit,
    parts: [
      { label: "Type", code: type, name: t.name, client: t.client, production: t.production },
      { label: "Light", code: light, name: l?.name ?? "?", client: l?.client ?? "", production: l?.production ?? "" },
      { label: "Height", code: height, name: h ? `${below ? `${below + 1}–` : "Up to "}${h.upTo} mm` : height === "HPOA" ? "Over 1000 mm (POA)" : "?", client: h ? `Up to ${h.upTo} mm tall` : "", production: h ? `Tallest letter up to ${h.upTo} mm` : "" },
      { label: "Depth", code: depth, name: d ? `${d.mm} mm` : "?", client: d ? `${d.mm} mm deep` : "", production: d ? `${d.mm} mm returns` : "" },
      { label: "Face", code: face, name: m(face)?.name ?? "?", client: m(face)?.client ?? "", production: m(face)?.production ?? "" },
      { label: "Sides", code: sides, name: m(sides)?.name ?? "?", client: m(sides)?.client ?? "", production: m(sides)?.production ?? "" },
      { label: "Back", code: back, name: m(back)?.name ?? "?", client: m(back)?.client ?? "", production: m(back)?.production ?? "" },
    ],
  };
}

/** Client-friendly description lines for a letter sign. */
export function letterDescription(spec: LetterSpec, text: string, jobNote: string, mounting?: Mounting) {
  const decoded = decodeLetterCode(letterCode(spec));
  const [type, light, height, depth, face, sides, back] = decoded?.parts ?? [];
  const letters = countLetters(text);
  const frontLit = spec.light === "LF";
  const build = frontLit ? frontLitConstruction(spec.heightMm, spec.depth) : null;
  const solid = spec.light === "NL" ? solidBuild(spec) : null;
  const materials = solid && "multiplier" in solid ? solid.client : frontLit && build
    ? `${spec.face === "ACR" ? "Coloured acrylic face (premium)" : "Opal acrylic face with printed vinyl (to your artwork)"} · Aluminium returns, ${build.returnDepthMm} mm deep · ${spec.back === "STL" ? "Steel" : back?.client ?? ""} back`
    : `${face?.client} face · ${sides?.client} sides · ${back?.client} back`;
  return [
    `${type?.name ?? "3D Letter"} · ${light?.name ?? ""} · ${height?.client ?? ""}${frontLit || (solid && "multiplier" in solid) ? "" : ` · ${depth?.client ?? ""}`}`,
    materials,
    text.trim() ? `Sign text: "${text.trim()}" (${letters} ${letters === 1 ? "letter" : "letters"}, spaces free)` : "",
    mounting ? mountingOptions.find((option) => option.value === mounting)?.client ?? "" : "",
    jobNote.trim(),
  ].filter(Boolean).join("\n");
}

/** Production instructions for a letter sign (what to build, exact materials, no prices). */
export function letterProduction(spec: LetterSpec, mounting?: Mounting, panels = "") {
  const decoded = decodeLetterCode(letterCode(spec));
  if (!decoded) return "";
  const [, light, height, depth, face, sides, back] = decoded.parts;
  const mount = mounting ? mountingOptions.find((option) => option.value === mounting) : undefined;
  const mountLine = mount ? `Mounting: ${mount.production}${mounting === "acp" && panels ? ` (${panels})` : ""}` : "";
  const solid = spec.light === "NL" ? solidBuild(spec) : null;
  if (solid && "multiplier" in solid) return [light.production, `${solid.production} · tallest letter ${spec.heightMm} mm`, mountLine].filter(Boolean).join("\n");
  if (spec.light === "LF") {
    const build = frontLitConstruction(spec.heightMm, spec.depth);
    return [
      `${light.production} · tallest letter ${spec.heightMm} mm`,
      `Face: ${spec.face === "ACR" ? "3 mm coloured acrylic (premium)" : "4.6 mm opal acrylic + printed vinyl (per artwork)"}`,
      `Returns: aluminium ${build.returnThicknessMm} mm thick × ${build.returnDepthMm} mm deep${build.increasesWithSize ? " minimum; increase thickness and depth for the letter size (confirm before cutting)" : ""}`,
      `Back: ${spec.back === "STL" ? "3 mm steel base" : spec.back === "PVC" ? `${build.pvcMm} mm PVC` : back.production}`,
      mountLine,
    ].filter(Boolean).join("\n");
  }
  return [`${light.production}`, `${height.production} · ${depth.production}`, `Face: ${face.production} · Sides: ${sides.production} · Back: ${back.production}`, mountLine].filter(Boolean).join("\n");
}

/** Construction lines for the job sheet, from a code alone (front-lit thicknesses follow the height band). */
export function frontLitFromCode(decoded: DecodedLetterCode) {
  const [, light, height, depth, face, , back] = decoded.parts;
  if (light.code !== "LF") return null;
  const band = letterHeights.find((item) => item.code === height.code);
  if (!band && height.code !== "HPOA") return null;
  const build = frontLitConstruction(band ? band.upTo : 1001, depth.code);
  return [
    { label: "Face", value: face.code === "ACR" ? "3 mm coloured acrylic (premium, letters up to 300 mm)" : "4.6 mm opal acrylic + printed vinyl (per artwork)" },
    { label: "Returns", value: `Aluminium ${build.returnThicknessMm} mm thick × ${build.returnDepthMm} mm deep${build.increasesWithSize ? " minimum (increase for the letter size; confirm before cutting)" : ""}` },
    { label: "Back", value: back.code === "STL" ? "3 mm steel base" : back.code === "PVC" ? (band && band.upTo <= 80 ? "PVC: 10 mm if letters are 60 mm or less, otherwise 16 mm" : "16 mm PVC") : back.production },
  ];
}

/** Flat-cut material lines for the job sheet, from a code alone (null if the code isn't a flat-cut letter). */
export function solidFromCode(decoded: DecodedLetterCode) {
  const [, light, , depth, face, sides, back] = decoded.parts;
  if (light.code !== "NL") return null;
  const solid = solidBuild({ depth: depth.code, face: face.code, sides: sides.code, back: back.code });
  return solid && "layers" in solid ? solid.layers : null;
}
