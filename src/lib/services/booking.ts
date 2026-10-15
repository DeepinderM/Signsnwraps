import "server-only";
import type { LeadPayload } from "./crm";
import { saveEnquiry } from "./enquiries";
export type BookingPayload = LeadPayload & { date: string; time: string; projectType: string; files?: File[] };
// Stores the request; staff confirm the actual appointment time with the customer from /admin/enquiries.
export async function createBooking(booking: BookingPayload): Promise<{ id: string; status: "requested" }> {
  const { projectType: _projectType, ...fields } = booking;
  void _projectType;
  const { id } = await saveEnquiry({ type: "booking", ...fields });
  return { id, status: "requested" };
}
