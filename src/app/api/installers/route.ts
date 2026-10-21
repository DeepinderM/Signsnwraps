import { NextResponse } from "next/server";
import { saveEnquiry } from "@/lib/services/enquiries";
import { asText, formAttribution, isEmail, isShortText } from "@/lib/validation";
import { regionLabel } from "@/lib/data/content";

const SERVICES = ["Paint protection film (PPF)", "Colour change wraps", "Commercial vehicle wraps", "Vehicle signage & lettering", "Ceramic coating / detailing"];
const EXPERIENCE = ["Less than 1 year", "1–3 years", "3–5 years", "5+ years"];

// Installer network applications (/wraps/installers/join), saved as enquiries of type "installer".
export async function POST(request: Request) {
  const form = await request.formData();
  if (asText(form, "website")) return NextResponse.json({ ok: true }, { status: 201 }); // honeypot
  const name = asText(form, "name"); const email = asText(form, "email"); const phone = asText(form, "phone");
  const business = asText(form, "business"); const region = regionLabel(asText(form, "region"));
  const experience = asText(form, "experience"); const description = asText(form, "description");
  const abn = asText(form, "abn").replace(/\s+/g, ""); const portfolio = asText(form, "portfolio"); const suburb = asText(form, "suburb");
  const services = form.getAll("services").filter((value): value is string => typeof value === "string" && SERVICES.includes(value));
  if (!isShortText(name, 120) || !isEmail(email) || email.length > 254 || !isShortText(phone, 40) || !isShortText(business, 160) || !region || !EXPERIENCE.includes(experience) || !isShortText(description, 2000)
    || (abn && !/^\d{11}$/.test(abn)) || (portfolio && !/^https?:\/\/\S{3,300}$/.test(portfolio)) || suburb.length > 120) {
    return NextResponse.json({ error: "Please check the required details (and that any ABN has 11 digits)." }, { status: 400 });
  }
  try {
    const { id } = await saveEnquiry({
      type: "installer", name, email, phone, business, service: "Installer application", location: region, description,
      details: { "Service area": suburb, Experience: experience, "Services offered": services.join(", "), ABN: abn, "Enclosed workshop": form.get("workshop") === "yes" ? "Yes" : "No", "Public liability insurance": form.get("insured") === "yes" ? "Yes" : "No", Portfolio: portfolio },
      attribution: formAttribution(form),
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("Saving installer application failed", error);
    return NextResponse.json({ error: "We couldn't send your application just now. Please try again or email the team." }, { status: 503 });
  }
}
