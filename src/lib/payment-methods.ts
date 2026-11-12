// Shared (client + server): how an invoice payment stage was paid.
export type PaymentMethod = "online" | "cash" | "bank";
export const paymentMethodLabel: Record<PaymentMethod, string> = { online: "Online (card)", cash: "Cash", bank: "Bank transfer" };
