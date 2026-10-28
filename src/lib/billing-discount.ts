// Shared (client + server) discount maths for quotes and invoices.

/**
 * Discount on the whole quote/invoice, taken off the ex-GST subtotal before GST is worked out.
 * percent: value is the % (e.g. 10); amount: value is cents ex GST. reason is printed, e.g. "Repeat customer".
 */
export type Discount = { type: "percent" | "amount"; value: number; reason: string };
export function discountAmount(discount: Discount | null | undefined, subtotalCents: number) {
  if (!discount || subtotalCents <= 0 || !(discount.value > 0)) return 0;
  const cents = discount.type === "percent" ? Math.round((subtotalCents * Math.min(discount.value, 100)) / 100) : Math.round(discount.value);
  return Math.min(Math.max(cents, 0), subtotalCents);
}
export const discountLabel = (discount: Discount | null | undefined) => !discount ? "" : `Discount${discount.type === "percent" ? ` (${Number(discount.value.toFixed(2))}%)` : ""}${discount.reason ? `: ${discount.reason}` : ""}`;
