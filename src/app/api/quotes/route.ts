import { NextResponse } from "next/server";
import { createQuote } from "@/lib/services/quotes";
import { asText, formAttribution, isEmail, isShortText } from "@/lib/validation";
import { services } from "@/lib/data/content";

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 20 * 1024 * 1024) return NextResponse.json({ error: "The request is too large. Please attach smaller files." }, { status: 413 });
  const form = await request.formData();
  const name = asText(form, "name"); const email = asText(form, "email"); const phone = asText(form, "phone"); const service = asText(form, "service");
  const description = asText(form, "description");
  if (!isShortText(name, 120) || !isEmail(email) || email.length > 254 || !isShortText(phone, 40) || !services.some((item) => item.title === service) || !isShortText(description, 3000)) {
    return NextResponse.json({ error: "Please check the required contact and service details." }, { status: 400 });
  }
  const uploads = form.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);
  if (uploads.some((file) => file.size > 10 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp", "application/pdf", "application/postscript", "application/illustrator", "application/octet-stream"].includes(file.type)) || uploads.length > 5) {
    return NextResponse.json({ error: "Attach up to five files, each no larger than 10 MB." }, { status: 400 });
  }
  try {
    const quote = await createQuote({ name, email, phone, service, business: asText(form, "business"), location: asText(form, "location"), description, quantity: asText(form, "quantity"), size: asText(form, "size"), dueDate: asText(form, "dueDate"), files: uploads, attribution: formAttribution(form) });
    return NextResponse.json({ quote }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Online quote requests are not connected yet. Your request has not been submitted; please call or email the studio." }, { status: 503 });
  }
}
