import type { LeadPayload } from "./crm";
export type BookingPayload = LeadPayload & { date: string; time: string; projectType: string; files?: File[] };
export async function createBooking(_booking: BookingPayload): Promise<{ id: string; status: "confirmed" }> {
  // Connect location-aware availability, calendar rules, notifications, and Odoo CRM here before enabling confirmations.
  void _booking;
  void _booking; // payload will be sent to the booking provider after configuration
  throw new Error("Booking availability and storage are not configured.");
}
