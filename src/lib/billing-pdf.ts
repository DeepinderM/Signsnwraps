import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, PDFName, PDFString, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { formatDate, nextDueStage, type BillingDoc, type BillingSettings } from "@/lib/billing";
import { getStripe } from "@/lib/stripe";

// A4 quote / tax invoice PDF. Australian tax invoices need: "Tax invoice", the seller's name and ABN,
// issue date, a description of each item with quantity and price, the GST amount and total, and the
// buyer's name or ABN for sales of $1,000 or more (we always print the customer block).

const NAVY = rgb(0x13 / 255, 0x23 / 255, 0x3a / 255);
const BLUE = rgb(0x02 / 255, 0x6b / 255, 0xa3 / 255);
const BODY = rgb(0x4a / 255, 0x55 / 255, 0x68 / 255);
const LINE = rgb(0.86, 0.89, 0.93);
const ICE = rgb(0xe3 / 255, 0xec / 255, 0xf6 / 255);
const W = 595.28, H = 841.89, M = 44;

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export async function renderBillingPdf(doc: BillingDoc, settings: BillingSettings, viewUrl: string) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${doc.kind === "quote" ? "Quote" : "Invoice"} ${doc.number}`);
  pdf.setAuthor(settings.businessName);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await readFile(join(process.cwd(), "Assets/logo-black-blue.png")).then((bytes) => pdf.embedPng(bytes)).catch(() => null);

  // Standard PDF fonts only cover Latin-1 (WinAnsi); swap anything else so a stray emoji can't break the PDF.
  const supported = new Map<string, boolean>();
  const safe = (text: string) => [...text.replace(/\r/g, "").replace(/\t/g, " ")].map((char) => {
    if (char === "\n") return char;
    if (!supported.has(char)) { try { regular.encodeText(char); supported.set(char, true); } catch { supported.set(char, false); } }
    return supported.get(char) ? char : "?";
  }).join("");

  // Splits a word that is wider than the line (e.g. a long link) into pieces that fit.
  const hardBreak = (word: string, font: PDFFont, size: number, width: number) => {
    const pieces: string[] = []; let piece = "";
    for (const char of word) { if (piece && font.widthOfTextAtSize(piece + char, size) > width) { pieces.push(piece); piece = char; } else piece += char; }
    return piece ? [...pieces, piece] : pieces;
  };
  const wrap = (text: string, font: PDFFont, size: number, width: number) => safe(text).split("\n").flatMap((paragraph) => {
    const words = paragraph.split(/ +/).flatMap((word) => font.widthOfTextAtSize(word, size) > width ? hardBreak(word, font, size, width) : [word]); const lines: string[] = []; let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= width || !line) line = next; else { lines.push(line); line = word; }
    }
    lines.push(line);
    return lines;
  });

  let page: PDFPage = pdf.addPage([W, H]);
  let y = H - M;
  const text = (value: string, x: number, top: number, options: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; align?: "left" | "right" } = {}) => {
    const font = options.font ?? regular, size = options.size ?? 9.5, str = safe(value);
    const dx = options.align === "right" ? x - font.widthOfTextAtSize(str, size) : x;
    page.drawText(str, { x: dx, y: top - size, size, font, color: options.color ?? NAVY });
  };
  const ensure = (needed: number, onNewPage?: () => void) => { if (y - needed < M + 30) { page = pdf.addPage([W, H]); y = H - M; onNewPage?.(); } };

  // Header: logo + business on the left, document type and numbers on the right.
  if (logo) { const scale = 42 / logo.height; page.drawImage(logo, { x: M, y: y - 42, width: logo.width * scale, height: 42 }); }
  const heading = doc.kind === "quote" ? "QUOTE" : settings.gstRegistered ? "TAX INVOICE" : "INVOICE";
  text(heading, W - M, y, { font: bold, size: 22, align: "right" });
  const meta: [string, string][] = [
    [doc.kind === "quote" ? "Quote no." : "Invoice no.", doc.number],
    ["Date", formatDate(doc.issueDate)],
    [doc.kind === "quote" ? "Valid until" : "Due date", formatDate(doc.dueDate)],
  ];
  meta.forEach(([label, value], index) => { text(label, W - M - 120, y - 34 - index * 14, { color: BODY, size: 9 }); text(value, W - M, y - 34 - index * 14, { font: bold, size: 9, align: "right" }); });
  y -= 56;
  const business = [settings.businessName, settings.abn && `ABN ${settings.abn}`, settings.address, [settings.phone, settings.email].filter(Boolean).join(" · "), settings.website].filter(Boolean) as string[];
  business.forEach((line, index) => text(line, M, y - index * 12, { font: index === 0 ? bold : regular, size: 9, color: index === 0 ? NAVY : BODY }));
  y -= Math.max(business.length * 12, 44) + 14;

  // Customer + project.
  page.drawRectangle({ x: M, y: y - 74, width: W - 2 * M, height: 74, color: ICE });
  text(doc.kind === "quote" ? "PREPARED FOR" : "BILL TO", M + 14, y - 12, { font: bold, size: 8, color: BLUE });
  const customer = [doc.customer.business || doc.customer.name, doc.customer.business ? doc.customer.name : "", doc.customer.abn && `ABN ${doc.customer.abn}`, doc.customer.address, [doc.customer.email, doc.customer.phone].filter(Boolean).join(" · ")].filter(Boolean) as string[];
  customer.slice(0, 4).forEach((line, index) => text(line, M + 14, y - 26 - index * 11.5, { font: index === 0 ? bold : regular, size: 9, color: index === 0 ? NAVY : BODY }));
  if (doc.title) { text("PROJECT", W / 2 + 10, y - 12, { font: bold, size: 8, color: BLUE }); wrap(doc.title, bold, 10.5, W / 2 - M - 24).slice(0, 4).forEach((line, index) => text(line, W / 2 + 10, y - 26 - index * 13, { font: bold, size: 10.5 })); }
  y -= 94;

  // Line items.
  const cols = { desc: M + 8, qty: W - M - 220, unit: W - M - 140, gst: W - M - 78, amount: W - M - 8 };
  const tableHeader = () => {
    page.drawRectangle({ x: M, y: y - 20, width: W - 2 * M, height: 20, color: NAVY });
    const white = rgb(1, 1, 1);
    text("DESCRIPTION", cols.desc, y - 6, { font: bold, size: 8, color: white });
    text("QTY", cols.qty, y - 6, { font: bold, size: 8, color: white, align: "right" });
    text("UNIT PRICE", cols.unit, y - 6, { font: bold, size: 8, color: white, align: "right" });
    text("GST", cols.gst, y - 6, { font: bold, size: 8, color: white, align: "right" });
    text("AMOUNT", cols.amount, y - 6, { font: bold, size: 8, color: white, align: "right" });
    y -= 26;
  };
  tableHeader();
  for (const item of doc.items) {
    const lines = wrap(item.description || "Item", regular, 9.5, cols.qty - cols.desc - 40);
    ensure(lines.length * 12 + 10, tableHeader);
    const line = Math.round(item.qty * item.unitCents);
    lines.forEach((value, index) => text(value, cols.desc, y - index * 12));
    text(String(Number(item.qty.toFixed(2))), cols.qty, y, { align: "right" });
    text(money(item.unitCents), cols.unit, y, { align: "right" });
    text(item.gst && settings.gstRegistered ? money(Math.round(line * 0.1)) : "—", cols.gst, y, { align: "right", color: BODY });
    text(money(line), cols.amount, y, { align: "right", font: bold });
    y -= lines.length * 12 + 8;
    page.drawLine({ start: { x: M, y: y + 3 }, end: { x: W - M, y: y + 3 }, thickness: 0.6, color: LINE });
  }

  // Totals.
  const balance = doc.totalCents - doc.paidCents;
  const rows: [string, string, boolean][] = [["Subtotal (ex GST)", money(doc.subtotalCents), false], ...(settings.gstRegistered ? [["GST (10%)", money(doc.gstCents), false] as [string, string, boolean]] : []), [`Total${settings.gstRegistered ? " incl. GST" : ""} (AUD)`, money(doc.totalCents), true]];
  if (doc.kind === "invoice" && doc.paidCents > 0) rows.push(["Paid", `-${money(doc.paidCents)}`, false], ["Balance due", money(Math.max(balance, 0)), true]);
  ensure(rows.length * 18 + 20);
  y -= 6;
  rows.forEach(([label, value, strong]) => {
    if (strong) page.drawRectangle({ x: W / 2 + 40, y: y - 17, width: W / 2 - M - 40, height: 20, color: ICE });
    text(label, W / 2 + 50, y - 2, { font: strong ? bold : regular, color: strong ? NAVY : BODY });
    text(value, cols.amount, y - 2, { font: strong ? bold : regular, align: "right", size: strong ? 11 : 9.5 });
    y -= 20;
  });
  y -= 14;

  // Payment schedule: one payment under $1,000; 50/30/20 for larger jobs.
  ensure(doc.schedule.length * 16 + 44);
  text("PAYMENT SCHEDULE", M, y, { font: bold, size: 8.5, color: BLUE }); y -= 16;
  for (const stage of doc.schedule) {
    const status = doc.kind === "invoice" ? (stage.status === "paid" ? "Paid" : stage.status === "due" ? "Due now" : "Not yet due") : "";
    text(`${stage.label}${stage.percent < 100 ? ` (${stage.percent}%)` : ""}`, M, y, { font: bold, size: 9 });
    text(stage.when, M + 170, y, { color: BODY, size: 9 });
    if (status) text(status, cols.gst, y, { size: 9, align: "right", color: stage.status === "paid" ? rgb(0.11, 0.42, 0.21) : stage.status === "due" ? BLUE : BODY, font: stage.status === "due" ? bold : regular });
    text(money(stage.amountCents), cols.amount, y, { size: 9, align: "right", font: bold });
    y -= 14;
    page.drawLine({ start: { x: M, y: y + 3 }, end: { x: W - M, y: y + 3 }, thickness: 0.4, color: LINE });
  }
  const due = doc.kind === "invoice" && doc.status === "sent" ? nextDueStage(doc) : undefined;
  if (due) {
    y -= 4;
    page.drawRectangle({ x: W / 2 + 40, y: y - 17, width: W / 2 - M - 40, height: 20, color: ICE });
    text(`Amount due now (${due.label.toLowerCase()})`, W / 2 + 50, y - 2, { font: bold });
    text(money(due.amountCents), cols.amount, y - 2, { font: bold, align: "right", size: 11 });
    y -= 22;
  }
  y -= 12;

  // How to pay / accept.
  const block = (title: string, lines: string[]) => {
    const wrapped = lines.flatMap((line) => wrap(line, regular, 9, W - 2 * M - 20));
    ensure(wrapped.length * 12 + 30);
    text(title, M, y, { font: bold, size: 8.5, color: BLUE }); y -= 14;
    wrapped.forEach((line) => { text(line, M, y, { color: BODY, size: 9 }); y -= 12; });
    y -= 10;
  };
  // The customer link gets its own line(s) and is clickable, so nobody has to copy it (copying across
  // lines can glue the next word onto the link).
  const linkBlock = (title: string, intro: string, url: string, after?: string) => {
    const lines = wrap(url, regular, 9.5, W - 2 * M - 20);
    ensure(lines.length * 13 + (after ? 54 : 40));
    text(title, M, y, { font: bold, size: 8.5, color: BLUE }); y -= 14;
    text(intro, M, y, { color: BODY, size: 9 }); y -= 13;
    const top = y;
    lines.forEach((line) => { text(line, M, y, { color: BLUE, size: 9.5 }); y -= 13; });
    const width = Math.max(...lines.map((line) => regular.widthOfTextAtSize(line, 9.5)));
    const annotation = pdf.context.obj({ Type: "Annot", Subtype: "Link", Rect: [M - 2, y + 8, M + width + 2, top + 2], Border: [0, 0, 0], A: { Type: "Action", S: "URI", URI: PDFString.of(url) } });
    const annots = page.node.lookup(PDFName.of("Annots"));
    if (annots && "push" in annots) (annots as unknown as { push: (ref: unknown) => void }).push(pdf.context.register(annotation));
    else page.node.set(PDFName.of("Annots"), pdf.context.obj([pdf.context.register(annotation)]));
    y -= 6;
    if (after) { text(after, M, y, { color: BODY, size: 9 }); y -= 12; }
    y -= 10;
  };
  if (doc.kind === "invoice" && doc.status !== "paid" && doc.status !== "void") {
    const reference = due && doc.schedule.length > 1 ? `${doc.number}-${doc.schedule.indexOf(due) + 1}` : doc.number;
    const bank = settings.bsb && settings.accountNumber ? [`Bank transfer: ${settings.accountName || settings.businessName}${settings.bankName ? ` · ${settings.bankName}` : ""}`, `BSB ${settings.bsb} · Account ${settings.accountNumber}`, `Reference: ${reference}`] : [];
    if (bank.length) block("PAY BY BANK TRANSFER", bank);
    linkBlock(getStripe() ? "PAY ONLINE" : "VIEW ONLINE", getStripe() ? "Pay by card, Apple Pay or Google Pay (click the link):" : "View this invoice online (click the link):", viewUrl);
  }
  if (doc.kind === "invoice" && doc.status === "paid") block("PAID", ["Thank you. This invoice has been paid in full."]);
  if (doc.kind === "quote") linkBlock("ACCEPT THIS QUOTE", "View and accept online (click the link):", viewUrl, "You can also reply to the email this quote came with.");
  if (doc.notes) block("NOTES", [doc.notes]);
  const terms = doc.kind === "quote" ? settings.quoteTerms : settings.invoiceTerms;
  if (terms) block("TERMS", [terms]);

  // Footer on every page.
  const pages = pdf.getPages();
  pages.forEach((item, index) => {
    const footer = safe(`${settings.businessName}${settings.abn ? ` · ABN ${settings.abn}` : ""} · ${doc.number}`);
    item.drawText(footer, { x: M, y: 24, size: 7.5, font: regular, color: BODY });
    const pageLabel = `Page ${index + 1} of ${pages.length}`;
    item.drawText(pageLabel, { x: W - M - regular.widthOfTextAtSize(pageLabel, 7.5), y: 24, size: 7.5, font: regular, color: BODY });
  });
  return pdf.save();
}
