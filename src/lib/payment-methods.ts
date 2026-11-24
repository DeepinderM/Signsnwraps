// Shared (client + server): how an invoice payment stage was paid.
export type PaymentMethod = "online" | "cash" | "bank";
export const paymentMethodLabel: Record<PaymentMethod, string> = { online: "Online (card)", cash: "Cash", bank: "Bank transfer" };

/** Shown with the payment terms everywhere (quote and invoice pages, accept button, PDF, emails). */
export const NON_REFUNDABLE_NOTE = "Please note: the initial payment (deposit) is non-refundable once paid.";
