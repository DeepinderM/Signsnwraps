import "server-only";
import type { LeadPayload } from "./crm";
import { saveEnquiry } from "./enquiries";
import type { EnquiryInput } from "./enquiries";
export type QuotePayload = LeadPayload & { quantity?: string; size?: string; dueDate?: string; files?: File[]; uploads?: EnquiryInput["uploads"]; details?: Record<string, string> };
export async function createQuote(quote: QuotePayload) {
  const { quantity, size, dueDate, details, ...fields } = quote;
  return saveEnquiry({ type: "quote", ...fields, details: { Quantity: quantity ?? "", "Approximate size": size ?? "", "Preferred completion date": dueDate ?? "", ...details } });
}
