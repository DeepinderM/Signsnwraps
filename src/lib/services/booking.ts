import "server-only";
import type { LeadPayload } from "./crm";
import { saveEnquiry } from "./enquiries";
import type { EnquiryInput } from "./enquiries";
export type BookingPayload = LeadPayload & { date: string; time: string; projectType: string; files?: File[]; uploads?: EnquiryInput["uploads"] };
// Stores the request; staff confirm the actual appointment time with the customer from /admin/enquiries.
export async function createBooking(booking: BookingPayload) {
  const { projectType: _projectType, ...fields } = booking;
  void _projectType;
  const { id, files, filesFailed } = await saveEnquiry({ type: "booking", ...fields });
  return { id, status: "requested" as const, files, filesFailed };
}
