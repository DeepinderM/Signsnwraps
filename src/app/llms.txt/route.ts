import { SITE, absoluteUrl } from "@/lib/seo";
import { enquiryServices } from "@/lib/data/content";

// llms.txt: a plain-language map of the site for AI assistants and answer engines (https://llmstxt.org).
export const dynamic = "force-static";

export function GET() {
  const link = (label: string, path: string, note: string) => `- [${label}](${absoluteUrl(path)}): ${note}`;
  const body = `# ${SITE.name}

> ${SITE.summary}

Also known as: ${SITE.alternateNames.join(", ")}. Location: ${SITE.address.locality} ${SITE.address.region} ${SITE.address.postalCode}, Australia (Melbourne's west). Consultations by appointment. Email: ${SITE.email}. Service area: Melbourne, Geelong and Victoria; PPF kits ship Australia-wide.

## Signs & print
${link("Commercial signage", "/signs/signage", "shopfront, building, illuminated, 3D, wayfinding and safety signs, designed, fabricated and installed")}
${link("Shopfronts", "/signs/shopfronts", "fascia signs, window graphics, frosting and door signs")}
${link("Banners & printing", "/signs/printing", "vinyl and mesh banners, event displays, stickers, wall, window and floor graphics")}
${link("Neon & illuminated signs", "/signs/neon", "custom LED neon, lightboxes and illuminated letters")}
${link("Fleet signage", "/signs/fleet", "vehicle lettering, graphics, reflective safety markings and fleet rollouts; book or request a quote online")}

## Wraps & paint protection
${link("Vehicle wraps", "/wraps/vehicle-wraps", "colour change and commercial wraps for cars, utes, vans and trucks")}
${link("Fleet wraps", "/wraps/fleet", "fleet livery design, full and partial commercial wraps, fleet PPF; book or request a quote online")}
${link("Paint protection film (PPF)", "/wraps/ppf", "professional PPF fitting in the Laverton North studio")}
${link("Pre-cut PPF kits", "/wraps/kits", "DIY paint protection film kits by vehicle make, model and year")}
${link("Online shop", "/wraps/shop", "PPF kits, colour PPF, universal protection pieces and tools; AUD incl. GST, $15 AU shipping, free over $250, free click and collect")}
${link("How to install a PPF kit", "/wraps/how-to-install", "step-by-step DIY installation guide")}
${link("Wraps & PPF FAQs", "/wraps/faq", "answers about kits, fitting options, film and ordering")}

## Get in touch
${link("Book an in-store consultation", "/book", "choose a preferred date and time; the team confirms by phone or email")}
${link("Request a quote", "/quote", `services: ${enquiryServices.join(", ")}`)}
${link("Contact & location", "/locations/laverton-north", "studio location, hours and directions")}
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
