export type Service = { slug: string; title: string; short: string; description: string; image: string; eyebrow: string; bullets: string[] };
export type Industry = { slug: string; title: string; description: string; services: string[] };
export type Location = { slug: string; name: string; region: string; address: string; phone: string; email: string; hours: string[]; services: string[] };
export type Project = { slug: string; title: string; category: string; industry: string; location: string; image: string; description: string; services: string[] };

export const services: Service[] = [
  { slug: "signage", title: "Commercial signage", short: "Make your space unmistakably yours.", description: "From a considered shopfront to a complete wayfinding system, we plan, make and install signage that works hard for your brand.", image: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1600&q=85", eyebrow: "SIGNAGE · FABRICATION · INSTALLATION", bullets: ["Shopfront and building signage", "Illuminated and 3D signage", "Wayfinding and compliance signs", "Site measure, fabrication and installation"] },
  { slug: "printing", title: "Printing & banners", short: "Print that gets your message noticed.", description: "Bring campaigns, spaces and events to life with professionally finished print, displays and promotional graphics.", image: "https://images.unsplash.com/photo-1504274066651-8d31a536b11a?auto=format&fit=crop&w=1600&q=85", eyebrow: "PRINT · DISPLAY · PROMOTION", bullets: ["Banners and event displays", "Wall, window and floor graphics", "Stickers and labels", "Campaign and promotional print"] },
  { slug: "vehicle-wraps", title: "Vehicle wraps", short: "Turn every trip into a brand impression.", description: "From one standout vehicle to a coordinated fleet, our wrap specialists help you choose a finish and make it work in the real world.", image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=85", eyebrow: "VEHICLE WRAPS · FLEET BRANDING", bullets: ["Commercial vehicle graphics", "Full and partial wraps", "Colour change wraps", "Fleet graphics and repeatable specifications"] },
  { slug: "ppf", title: "PPF & vehicle protection", short: "Protect the finish. Keep the feeling.", description: "Explore paint protection film and automotive protection options with expert guidance tailored to how you drive and care for your vehicle.", image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=85", eyebrow: "PAINT PROTECTION FILM · CARE", bullets: ["Paint protection film options", "High-impact area coverage", "Finish and use-case guidance", "Care advice for lasting protection"] },
  { slug: "brand-rollouts", title: "Brand rollouts", short: "One brand. Every location, in sync.", description: "Make multi-site branding easier to manage with a coordinated partner for surveys, specifications, production, delivery and installation.", image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85", eyebrow: "MULTI-SITE · FLEET · COORDINATION", bullets: ["Site surveys and specifications", "Consistent production standards", "Coordinated logistics and installation", "Rollout tracking and ongoing support"] },
  { slug: "maintenance", title: "Signage maintenance", short: "Keep your brand looking its best.", description: "Protect your investment with practical repairs, replacement graphics and ongoing signage support as your business evolves.", image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1600&q=85", eyebrow: "REPAIRS · UPDATES · SUPPORT", bullets: ["Sign repairs and replacement", "Refresh graphics and messaging", "Condition checks and maintenance", "Support for evolving locations"] },
];

export const industries: Industry[] = [
  { slug: "retail", title: "Retail", description: "Shopfronts, window graphics and in-store details that make a strong first impression and a consistent customer experience.", services: ["signage", "printing", "brand-rollouts"] },
  { slug: "hospitality", title: "Hospitality", description: "Create a welcoming, easy-to-navigate venue with considered exterior signage, menus, displays and brand details.", services: ["signage", "printing", "maintenance"] },
  { slug: "automotive", title: "Automotive", description: "Vehicle wraps, fleet branding and paint protection with advice grounded in how your vehicles are used.", services: ["vehicle-wraps", "ppf", "signage"] },
  { slug: "construction", title: "Construction & property", description: "Site signage, safety communication, project branding and durable graphics for changing environments.", services: ["signage", "printing", "maintenance"] },
  { slug: "corporate", title: "Corporate", description: "Professional workplace identification, wayfinding and branded environments, delivered with care.", services: ["signage", "printing", "brand-rollouts"] },
  { slug: "franchises", title: "Franchises & multi-site", description: "Repeatable standards and coordinated delivery to help every location feel like part of the same brand.", services: ["brand-rollouts", "signage", "maintenance"] },
  { slug: "education", title: "Education", description: "Clear wayfinding, campus identity and thoughtful communication graphics for learning environments.", services: ["signage", "printing", "maintenance"] },
  { slug: "healthcare", title: "Healthcare", description: "Accessible wayfinding and considered signage that supports a calmer, clearer visitor journey.", services: ["signage", "printing", "maintenance"] },
  { slug: "fleet", title: "Fleet & trades", description: "Build recognition on the road with practical vehicle graphics planned around your fleet and schedule.", services: ["vehicle-wraps", "brand-rollouts", "maintenance"] },
];

export const locations: Location[] = [
  { slug: "laverton-north", name: "Laverton North", region: "Victoria", address: "Laverton North, VIC 3026, Australia", phone: "+61 3 0000 0000", email: "hello@signsnwraps.com.au", hours: ["Monday–Friday · 8:30am–5:00pm", "Saturday · By appointment", "Sunday · Closed"], services: ["Signage consultation", "Vehicle wraps", "PPF & vehicle protection", "Printing and fleet branding"] },
];

export const projects: Project[] = [
  { slug: "fleet-branding", title: "A fleet built to be remembered", category: "Vehicle wraps", industry: "Fleet", location: "Melbourne, VIC", image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1600&q=85", description: "A coordinated fleet branding concept designed to keep a growing team recognisable on every job.", services: ["Vehicle wraps", "Fleet branding"] },
  { slug: "retail-wayfinding", title: "A clearer way through", category: "Commercial signage", industry: "Retail", location: "Melbourne, VIC", image: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1600&q=85", description: "A signage system that brings exterior presence and intuitive customer navigation together.", services: ["Signage", "Wayfinding"] },
  { slug: "studio-protection", title: "Protection with a purpose", category: "PPF", industry: "Automotive", location: "Laverton North, VIC", image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=85", description: "A considered vehicle protection plan, matched to the owner's priorities and everyday driving.", services: ["Paint protection film"] },
  { slug: "shopfront-refresh", title: "A fresh face for the high street", category: "Retail", industry: "Retail", location: "Melbourne, VIC", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=85", description: "A confident shopfront refresh with cohesive window graphics and entry signage.", services: ["Shopfront signage", "Window graphics"] },
];

export const faqs = [
  { question: "Can I visit the showroom before deciding?", answer: "Yes. Book an in-store consultation to discuss your project, compare suitable options and understand the next steps before production." },
  { question: "Do you work with businesses outside Laverton North?", answer: "Yes. We support projects across Melbourne and can discuss delivery and installation needs for regional and multi-site work." },
  { question: "Can you manage design, production and installation?", answer: "We can coordinate the project from planning through fabrication and installation, with the right scope confirmed during consultation." },
  { question: "How do I get a quote?", answer: "Share your project details through the quote form. Include approximate sizes, quantities, timing and reference images where available." },
];

export const testimonials = [
  { quote: "The team helped us get clear on the options and the process before anything went into production.", name: "Business customer", context: "Melbourne · Signage project", approved: false },
  { quote: "Having one point of contact made a complicated branding project feel much more manageable.", name: "Business customer", context: "Victoria · Fleet branding", approved: false },
];

/** Services customers can choose on the booking and quote forms (validated server-side too). */
export const enquiryServices = [...services.map(({ title }) => title), "Fleet signage", "Fleet wraps", "General consultation"];

/** Services that live on the Signs or Wraps side; /services/<slug> permanently redirects to these (see next.config.ts). */
export const serviceHomes: Record<string, string> = { signage: "/signs/signage", printing: "/signs/printing", "vehicle-wraps": "/wraps/vehicle-wraps", ppf: "/wraps/ppf" };
export const serviceHref = (slug: string) => serviceHomes[slug] ?? `/services/${slug}`;

export const serviceFor = (slug: string) => services.find((service) => service.slug === slug);
export const locationFor = (slug: string) => locations.find((location) => location.slug === slug);
