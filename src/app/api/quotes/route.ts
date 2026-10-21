import { NextResponse } from "next/server";
import { createQuote } from "@/lib/services/quotes";
import { asText, formAttribution, isEmail, isShortText } from "@/lib/validation";
import { enquiryServices, serviceRegions } from "@/lib/data/content";
import { allFleetWorkTypes, fleetSizes, fleetVehicleTypes } from "@/lib/data/fleet";
import { uploadsFromForm } from "@/lib/services/uploads";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_FILES, isAllowedUpload } from "@/lib/uploads";

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 20 * 1024 * 1024) return NextResponse.json({ error: "The request is too large. Please attach smaller files." }, { status: 413 });
  const form = await request.formData();
  // Honeypot: real visitors never see or fill this field.
  if (asText(form, "website")) return NextResponse.json({ quote: { id: "ok" } }, { status: 201 });
  const name = asText(form, "name"); const email = asText(form, "email"); const phone = asText(form, "phone"); const service = asText(form, "service");
  const description = asText(form, "description");
  if (!isShortText(name, 120) || !isEmail(email) || email.length > 254 || !isShortText(phone, 40) || !enquiryServices.includes(service) || !isShortText(description, 3000)) {
    return NextResponse.json({ error: "Please check the required contact and service details." }, { status: 400 });
  }
  const uploads = form.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);
  // Files normally arrive already uploaded to Storage (see FileUploader); direct form uploads are the fallback.
  const uploaded = uploadsFromForm(form);
  if (uploads.some((file) => file.size > MAX_UPLOAD_BYTES || !isAllowedUpload(file.name, file.type)) || uploads.length + uploaded.files.length > MAX_UPLOAD_FILES) {
    return NextResponse.json({ error: "Attach up to five files, each no larger than 10 MB." }, { status: 400 });
  }
  const location = asText(form, "location");
  if (location && !serviceRegions.some((region) => region.label === location) && location !== "Other / multiple locations") return NextResponse.json({ error: "Please choose a project region." }, { status: 400 });
  // Optional fleet details (fleet quote form); only known values are kept.
  const fleetSize = asText(form, "fleetSize");
  const vehicleTypes = form.getAll("vehicleTypes").filter((value): value is string => typeof value === "string" && (fleetVehicleTypes as readonly string[]).includes(value));
  const workTypes = form.getAll("workTypes").filter((value): value is string => typeof value === "string" && allFleetWorkTypes.includes(value));
  const details: Record<string, string> = {};
  if ((fleetSizes as readonly string[]).includes(fleetSize)) details["Fleet size"] = fleetSize;
  if (vehicleTypes.length) details["Vehicle types"] = vehicleTypes.join(", ");
  if (workTypes.length) details["Work wanted"] = workTypes.join(", ");
  const vehicleModels = asText(form, "vehicleModels");
  if (vehicleModels) { if (vehicleModels.length > 300) return NextResponse.json({ error: "Please shorten the vehicle makes and models." }, { status: 400 }); details["Vehicle makes & models"] = vehicleModels; }
  try {
    const quote = await createQuote({ details, name, email, phone, service, business: asText(form, "business"), location, description, quantity: asText(form, "quantity"), size: asText(form, "size"), dueDate: asText(form, "dueDate"), files: uploads, uploads: uploaded, attribution: formAttribution(form) });
    return NextResponse.json({ quote }, { status: 201 });
  } catch (error) {
    console.error("Saving quote request failed", error);
    return NextResponse.json({ error: "We couldn't send your request just now. Your request has not been submitted; please try again or call the studio." }, { status: 503 });
  }
}
