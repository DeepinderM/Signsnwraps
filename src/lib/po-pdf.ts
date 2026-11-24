import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { formatDate, type BillingCustomer, type BillingSettings } from "@/lib/billing";
import { decodeLetterCode, frontLitFromCode, solidFromCode } from "@/lib/letter-signs";
import { describeJobBill, panelSetLabel, panelsForSet, planAcpJob } from "@/lib/acp-panels";
import type { PurchaseOrder } from "@/lib/purchase-orders";
import { jobLines } from "@/lib/vendor-types";

// A4 purchase order and production sheet for the manufacturer. Neither shows customer prices.

const NAVY = rgb(0x13 / 255, 0x23 / 255, 0x3a / 255);
const BLUE = rgb(0x02 / 255, 0x6b / 255, 0xa3 / 255);
const BODY = rgb(0x4a / 255, 0x55 / 255, 0x68 / 255);
const LINE = rgb(0.86, 0.89, 0.93);
const ICE = rgb(0xe3 / 255, 0xec / 255, 0xf6 / 255);
const W = 595.28, H = 841.89, M = 44;

type Style = { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb> };

/** Small flowing-text writer on top of pdf-lib: wraps text, starts new pages, keeps blocks together. */
async function writer(title: string, settings: BillingSettings) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(title);
  pdf.setAuthor(settings.businessName);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await readFile(join(process.cwd(), "Assets/logo-black-blue.png")).then((bytes) => pdf.embedPng(bytes)).catch(() => null);
  // Standard fonts only cover Latin-1: swap anything else (× and Ø are fine; emoji aren't).
  const safe = (value: string) => [...value.replace(/\r/g, "").replace(/\t/g, " ")].map((char) => { if (char === "\n") return char; try { regular.encodeText(char); return char; } catch { return "?"; } }).join("");
  const wrap = (value: string, font: PDFFont, size: number, width: number) => safe(value).split("\n").flatMap((paragraph) => {
    const lines: string[] = []; let line = "";
    for (const word of paragraph.split(/ +/)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= width || !line) line = next; else { lines.push(line); line = word; }
    }
    return [...lines, line];
  });
  let page: PDFPage = pdf.addPage([W, H]);
  let y = H - M;
  const newPage = () => { page = pdf.addPage([W, H]); y = H - M; };
  const ensure = (height: number) => { if (y - height < M + 20) newPage(); };
  const text = (value: string, x: number, width: number, style: Style = {}) => {
    const font = style.font ?? regular, size = style.size ?? 9.5, lines = wrap(value, font, size, width);
    for (const line of lines) { ensure(size + 3); page.drawText(line, { x, y: y - size, size, font, color: style.color ?? NAVY }); y -= size + 3.5; }
  };
  const height = (value: string, width: number, style: Style = {}) => wrap(value, style.font ?? regular, style.size ?? 9.5, width).length * ((style.size ?? 9.5) + 3.5);
  const rule = (gap = 8) => { y -= gap / 2; page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.7, color: LINE }); y -= gap / 2; };
  const heading = (value: string) => { ensure(40); y -= 6; text(value.toUpperCase(), M, W - 2 * M, { font: bold, size: 8.5, color: BLUE }); y -= 2; };
  /** Two-column label/value rows. */
  const rows = (items: [string, string][], labelWidth = 110) => {
    for (const [label, value] of items) {
      const h = Math.max(height(value, W - 2 * M - labelWidth), 13);
      ensure(h); const top = y;
      text(label, M, labelWidth - 8, { font: bold, size: 9, color: BODY }); y = top;
      text(value, M + labelWidth, W - 2 * M - labelWidth, { size: 9.5 }); y = Math.min(y, top - 13);
    }
  };
  /** Page header: logo + business on the left, document title and numbers on the right. */
  const header = (docTitle: string, refs: [string, string][]) => {
    if (logo) { const scale = 40 / logo.height; page.drawImage(logo, { x: M, y: y - 40, width: logo.width * scale, height: 40 }); }
    const right = W - M;
    const draw = (value: string, top: number, style: Style) => { const font = style.font ?? regular, size = style.size ?? 9; const str = safe(value); page.drawText(str, { x: right - font.widthOfTextAtSize(str, size), y: top - size, size, font, color: style.color ?? NAVY }); };
    draw(docTitle, y, { font: bold, size: 17 });
    refs.forEach(([label, value], index) => draw(`${label}: ${value}`, y - 24 - index * 12, { size: 9, color: BODY }));
    y -= Math.max(52, 30 + refs.length * 12);
    const from = [settings.businessName, settings.abn ? `ABN ${settings.abn}` : "", settings.address, [settings.phone, settings.email].filter(Boolean).join(" · ")].filter(Boolean);
    from.forEach((line, index) => text(line, M, 300, { size: 8.5, color: index ? BODY : NAVY, font: index ? regular : bold }));
    rule(14);
  };
  return { pdf, regular, bold, text, rows, rule, heading, header, ensure, height, get y() { return y; }, set y(value: number) { y = value; }, page: () => page };
}

const contact = (customer: BillingCustomer) => [customer.business, customer.name, customer.address, customer.phone, customer.email].filter(Boolean).join("\n");

/** The purchase order: who it's from and to, the job refs, the project summary and the lines ordered. */
export async function renderPurchaseOrderPdf(po: PurchaseOrder, customer: BillingCustomer, title: string, settings: BillingSettings) {
  const w = await writer(`Purchase order ${po.number}`, settings);
  const lines = po.lines.filter((line) => line.include);
  w.header("PURCHASE ORDER", [["PO number", po.number], ["Date", formatDate(new Date().toISOString().slice(0, 10))], ...(po.requiredBy ? [["Required by", formatDate(po.requiredBy)] as [string, string]] : []), ["Job ref", [po.quoteNumber, po.invoiceNumber].filter(Boolean).join(" / ") || po.number]]);
  w.rows([["To", po.supplier], ["Job", title || po.quoteNumber], ...(po.includeCustomer ? [["Client / site", contact(customer) || "-"] as [string, string]] : [])]);
  w.heading("Project summary");
  w.text(po.summary || "-", M, W - 2 * M, { size: 9.5 });
  w.heading(`Items to supply (${lines.length})`);
  w.rule(4);
  // Job details only: no prices, discounts or totals go to the vendor.
  const DESC_W = W - 2 * M - 60;
  lines.forEach((line, index) => {
    const [first, ...rest] = jobLines(line.description);
    w.ensure(30 + w.height(rest.join("\n"), DESC_W, { size: 9 }));
    const top = w.y;
    w.text(`${index + 1}.`, M, 18, { font: w.bold });
    w.y = top; w.text(`${line.qty} ×`, M + 18, 38, { font: w.bold });
    w.y = top; w.text(first, M + 60, DESC_W, { font: w.bold });
    if (line.code) w.text(`Code ${line.code}`, M + 60, DESC_W, { size: 8.5, color: BLUE });
    if (rest.length) w.text(rest.join("\n"), M + 60, DESC_W, { size: 9, color: BODY });
    if (line.note.trim()) w.text(`Note: ${line.note.trim()}`, M + 60, DESC_W, { size: 9, font: w.bold, color: NAVY });
    w.rule(10);
  });
  w.heading("Notes");
  w.text([
    po.attachProductionSheet ? "Build details for every line are on the attached production sheet." : "",
    po.artwork.length + po.uploads.length ? `Artwork attached: ${po.artwork.length + po.uploads.length} file${po.artwork.length + po.uploads.length === 1 ? "" : "s"}.` : "",
    `Please confirm receipt and the expected completion date, and quote ${po.number} in all correspondence.`,
  ].filter(Boolean).join("\n"), M, W - 2 * M, { size: 9, color: BODY });
  return w.pdf.save();
}

/** Production sheet for the ticked lines: decoded product codes, construction, production notes, sign-off. */
export async function renderProductionSheetPdf(po: PurchaseOrder, customer: BillingCustomer, title: string, settings: BillingSettings) {
  const w = await writer(`Production sheet ${po.number}`, settings);
  const lines = po.lines.filter((line) => line.include);
  w.header("PRODUCTION SHEET", [["PO number", po.number], ["Job ref", [po.quoteNumber, po.invoiceNumber].filter(Boolean).join(" / ") || po.number], ["Lines", String(lines.length)]]);
  w.rows([["Job", title || po.quoteNumber], ...(po.includeCustomer ? [["Client / site", contact(customer) || "-"] as [string, string]] : [])]);
  w.text("No prices on this sheet. Colours, PMS and finishes come from the job notes, not the code.", M, W - 2 * M, { size: 8.5, color: BODY });
  lines.forEach((line, index) => {
    const [first, ...rest] = jobLines(line.description);
    w.ensure(120);
    w.y -= 10;
    const top = w.y;
    w.page().drawRectangle({ x: M - 6, y: top - 22, width: W - 2 * M + 12, height: 22, color: ICE });
    w.y = top - 6; w.text(`${index + 1}.  ${line.qty} ×  ${first}`, M, W - 2 * M - 120, { font: w.bold, size: 10.5 });
    if (line.code) { w.y = top - 6; const size = 9, str = line.code; w.page().drawText(str, { x: W - M - w.bold.widthOfTextAtSize(str, size), y: top - 6 - size, size, font: w.bold, color: BLUE }); }
    w.y = top - 28;
    const code = line.code ? decodeLetterCode(line.code) : null;
    if (code) {
      w.text(code.lit ? `LIT · ${code.parts[1].name}: ${code.parts[1].production}` : "NO LIGHT · NO LEDs · NO power supply · NO wiring", M, W - 2 * M, { font: w.bold, size: 9, color: code.lit ? BLUE : NAVY });
      w.rows(code.parts.map((part) => [`${part.label} (${part.code})`, `${part.name}${part.production && part.production !== part.name ? ` - ${part.production}` : ""}`]), 120);
      const construction = solidFromCode(code) ?? frontLitFromCode(code);
      if (construction) w.rows(construction.map((row) => [row.label, row.value]), 120);
      if (!code.valid) w.text(`CHECK WITH SALES BEFORE BUILDING: ${code.problems.join(" ")}`, M, W - 2 * M, { font: w.bold, size: 9, color: rgb(0.7, 0.1, 0.1) });
    }
    if (rest.length) { w.heading("Client wording"); w.text(rest.join("\n"), M, W - 2 * M, { size: 9, color: BODY }); }
    if (line.production) { w.heading("Production notes"); w.text(line.production, M, W - 2 * M, { size: 9 }); }
    if (line.acp) {
      const job = planAcpJob(line.acp.widthMm, line.acp.heightMm, line.acp.signs ?? Math.max(1, Math.round(line.qty)), panelsForSet(line.acp.panelSet));
      if (job) { w.heading(`${panelSetLabel(line.acp.panelSet)} sheets`); w.text(`${line.acp.signs ?? line.qty} × ${line.acp.widthMm} × ${line.acp.heightMm} mm from ${describeJobBill(job)}`, M, W - 2 * M, { size: 9 }); }
    }
    if (line.roll) { w.heading("Vinyl"); w.text(`${line.roll.widthMm} × ${line.roll.heightMm} mm on a ${line.roll.rollWidthMm} mm roll`, M, W - 2 * M, { size: 9 }); }
    if (line.note.trim()) { w.heading("Note from sales"); w.text(line.note.trim(), M, W - 2 * M, { size: 9, font: w.bold }); }
    w.y -= 4;
    w.text("[ ] Materials checked     [ ] Built     [ ] QC passed     Initials: ________", M, W - 2 * M, { size: 9, color: BODY });
    w.rule(10);
  });
  return w.pdf.save();
}
