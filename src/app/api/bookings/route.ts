import { NextResponse } from "next/server";
import { createBooking } from "@/lib/services/booking";
import { asText, formAttribution, isEmail, isShortText } from "@/lib/validation";
import { enquiryServices, regionLabel } from "@/lib/data/content";
import { uploadsFromForm } from "@/lib/services/uploads";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_FILES, isAllowedUpload } from "@/lib/uploads";

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 20 * 1024 * 1024) return NextResponse.json({ error: "The request is too large. Please attach smaller files." }, { status: 413 });
  const form = await request.formData();
  // Honeypot: real visitors never see or fill this field.
  if (asText(form, "website")) return NextResponse.json({ booking: { id: "ok", status: "requested" } }, { status: 201 });
  const name = asText(form, "name"); const email = asText(form, "email"); const phone = asText(form, "phone");
  const date = asText(form, "date"); const time = asText(form, "time"); const service = asText(form, "service");
  const location = asText(form, "location");
  const [year, month, day] = date.split("-").map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  const melbourneToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const uploads = form.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);
  // Files normally arrive already uploaded to Storage (see FileUploader); direct form uploads are the fallback.
  const uploaded = uploadsFromForm(form);
  const validFiles = uploads.length + uploaded.files.length <= MAX_UPLOAD_FILES && uploads.every((file) => file.size <= MAX_UPLOAD_BYTES && isAllowedUpload(file.name, file.type));
  if (!isShortText(name, 120) || !isEmail(email) || email.length > 254 || !isShortText(phone, 40) || !enquiryServices.includes(service) || !regionLabel(location) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime()) || parsedDate.getUTCFullYear() !== year || parsedDate.getUTCMonth() !== month - 1 || parsedDate.getUTCDate() !== day || date <= melbourneToday || !["10:00", "13:00", "15:00"].includes(time) || (asText(form, "description") !== "" && !isShortText(asText(form, "description"), 2000)) || !validFiles) {
    return NextResponse.json({ error: "Please check the required booking details." }, { status: 400 });
  }
  try {
    const booking = await createBooking({ name, email, phone, service, date, time, projectType: service, business: asText(form, "business"), location: regionLabel(location)!, description: asText(form, "description"), files: uploads, uploads: uploaded, attribution: formAttribution(form) });
    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error("Saving booking request failed", error);
    return NextResponse.json({ error: "We couldn't send your request just now. Your request has not been submitted; please try again or call the studio." }, { status: 503 });
  }
}
