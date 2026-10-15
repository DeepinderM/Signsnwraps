// Fleet content for /signs/fleet and /wraps/fleet, plus the fleet quote form options.

export type FleetWorkType = { slug: string; title: string; detail: string };
export type FleetSide = "signs" | "wraps";

export const fleetVehicleTypes = ["Cars", "Utes", "Vans", "Trucks", "Trailers", "Mixed fleet"] as const;

export const fleetSizes = ["1 vehicle", "2–5 vehicles", "6–20 vehicles", "21–50 vehicles", "50+ vehicles"] as const;

const signsTypes: FleetWorkType[] = [
  { slug: "lettering", title: "Cut vinyl lettering", detail: "Business name, logo, phone and web details, cut to size and applied cleanly to doors, tailgates and rear windows." },
  { slug: "partial-wrap", title: "Partial wraps & graphics", detail: "Printed panels and graphics that carry your brand across the vehicle without a full colour change." },
  { slug: "full-wrap", title: "Full commercial wraps", detail: "Maximum presence for vans, utes and trucks, planned with the Wraps studio team." },
  { slug: "safety", title: "Reflective & safety markings", detail: "Reflective chevrons, conspicuity tape and safety signage for service and trade vehicles." },
  { slug: "magnetic", title: "Magnetic signs", detail: "Removable signs for vehicles that switch between work and personal use." },
  { slug: "trailers", title: "Trailers & equipment", detail: "Signage for trailers, site equipment, tool boxes and canopies to match the rest of the fleet." },
];

const wrapsTypes: FleetWorkType[] = [
  { slug: "full-wrap", title: "Full commercial wraps", detail: "Your brand on every panel. Maximum presence for vans, utes and trucks, printed and laminated for daily work." },
  { slug: "partial-wrap", title: "Partial wraps", detail: "Bold printed graphics over part of the vehicle, using the paint colour as part of the design." },
  { slug: "livery", title: "Fleet livery design", detail: "One livery adapted to each vehicle type, so a small car and a large truck still look like the same brand." },
  { slug: "colour-change", title: "Colour change wraps", detail: "Turn a mixed fleet into one brand colour without a respray, and return the paint at resale." },
  { slug: "fleet-ppf", title: "Fleet paint protection", detail: "PPF on high-wear areas such as bonnets, bumpers and door edges to protect resale value." },
  { slug: "rebrand", title: "Wrap removal & rebrands", detail: "Remove old graphics cleanly and re-wrap when your brand, contracts or vehicles change." },
];

const process = (install: string) => [
  { title: "Fleet consultation", detail: "We look at your vehicles, how they're used and what the branding needs to do." },
  { title: "Design & proof", detail: "Layouts for each vehicle type, with a proof to approve before anything is produced." },
  { title: "Production", detail: "Printed and cut in-house with materials suited to commercial vehicles." },
  { title: "Scheduled install", detail: install },
  { title: "Rollout & updates", detail: "Consistent results as you add vehicles, plus repairs and updates when details change." },
];

export const fleetSides = {
  signs: {
    path: "/signs/fleet",
    service: "Fleet signage",
    eyebrow: "SIGNS · FLEET SIGNAGE",
    title: ["Every vehicle.", "On brand."],
    intro: "Lettering, graphics and safety markings for cars, utes, vans, trucks and trailers. One look across the whole fleet, installed around your schedule.",
    typesHeading: ["Signage that works", "as hard as your fleet."],
    typesIntro: "From a single ute to a national rollout, we match the signage to how each vehicle is used, so your brand is easy to read on the road and on site.",
    typesLegend: "Signage you're interested in",
    types: signsTypes,
    crossLink: { text: "Want a full wrap or colour change across the fleet?", label: "See fleet wraps ↗", href: "/wraps/fleet" },
    process: process("Installs booked around your roster so vehicles stay on the road."),
    imageAlt: "Commercial vehicle ready for fleet signage",
    faqs: [
      ["How long does it take to sign a vehicle?", "Simple lettering is often done within a day. Larger graphics and wraps take longer. We'll give you a timeframe for each vehicle type in your quote."],
      ["Can you work around our schedule?", "Yes. We plan installs in batches around your roster so the fleet stays on the road."],
      ["Do you handle new vehicles as the fleet grows?", "Yes. We keep your approved layouts on file so new vehicles match the rest of the fleet."],
      ["Will signage damage the paint?", "Quality vehicle films are designed to be removed cleanly from factory paint when removed correctly. We'll talk through the right material for your vehicles."],
    ],
  },
  wraps: {
    path: "/wraps/fleet",
    service: "Fleet wraps",
    eyebrow: "WRAPS · FLEET WRAPS & PROTECTION",
    title: ["Wrap the fleet.", "Own the road."],
    intro: "Commercial wraps, fleet livery and paint protection for cars, utes, vans and trucks. Designed once, rolled out consistently and fitted at our Laverton North studio.",
    typesHeading: ["Wraps built for", "working vehicles."],
    typesIntro: "A wrapped fleet is a moving billboard that also protects the paint underneath. We plan the design, film and coverage around how hard each vehicle works.",
    typesLegend: "Work you're interested in",
    types: wrapsTypes,
    crossLink: { text: "Only need lettering, magnetic signs or safety markings?", label: "See fleet signage ↗", href: "/signs/fleet" },
    process: process("Vehicles booked into the studio in batches around your roster so the fleet stays on the road."),
    imageAlt: "Vehicle ready for a fleet wrap",
    faqs: [
      ["How long does a fleet wrap take?", "A full wrap usually needs the vehicle in the studio for a few days, depending on its size and the design. We'll give you timing for each vehicle type in your quote and book them in batches."],
      ["Will a wrap damage the paint?", "Quality wrap films protect the paint underneath and are designed to be removed cleanly from factory paint when removed correctly. Resprayed or damaged paint needs checking first."],
      ["How long do fleet wraps last?", "It depends on the film, how much sun the vehicle gets and how it's washed. We'll recommend films suited to commercial use and explain care when we hand vehicles back."],
      ["Can you add PPF to wrapped or unwrapped vehicles?", "Yes. Paint protection film on bonnets, bumpers and door edges is a practical way to protect fleet resale value. Ask us what coverage suits your vehicles."],
    ],
  },
} as const satisfies Record<FleetSide, unknown>;

/** Every work type offered on either fleet page (used to validate the quote form). */
export const allFleetWorkTypes = [...new Set([...signsTypes, ...wrapsTypes].map((item) => item.title))];
export const fleetServices: string[] = [fleetSides.signs.service, fleetSides.wraps.service];
