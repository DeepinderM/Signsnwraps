import type { LeadPayload } from "./crm";
export type QuotePayload = LeadPayload & { quantity?: string; size?: string; dueDate?: string; files?: File[] };
export async function createQuote(_quote: QuotePayload): Promise<{ id: string }> {
  // Add validated private file storage and CRM lead/quotation handoff here; do not store uploads in the app filesystem.
  void _quote; // payload will be sent to the quote provider after configuration
  throw new Error("Quote intake and secure file storage are not configured.");
}
