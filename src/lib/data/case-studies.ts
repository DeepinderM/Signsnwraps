// Case studies: full project stories (challenge → design → production → installation → result) with before / after
// photos, a client quote, FAQs and Instagram reels. Content from Assets/case - study projects/<project>/<slug>.md;
// photos are copied to public/media/case-studies/<project>/. Add a project by adding an entry here.

export type CaseImage = { src: string; alt: string; width: number; height: number };
export type CaseFaq = { question: string; answer: string };
/** A self-hosted video with its own VideoObject structured data (duration as ISO 8601, e.g. PT7S). */
export type CaseVideo = { src: string; poster: string; title: string; description: string; width: number; height: number; duration: string; uploadDate: string };
export type CaseStudy = {
  slug: string; title: string; seoTitle: string; metaDescription: string; summary: string;
  client: string; industry: string; location: string; service: string; signageTypes: string;
  /** e.g. "8 days (20–28 October 2026), from design to installation"; optional. */
  timeline?: string;
  /** Project snapshot rows; when set, used instead of the standard rows built from the fields above. */
  snapshot?: [string, string][];
  /** Two or three headline facts for cards and the home page: [value, label]. */
  highlights: [string, string][];
  /** Date the case study is published (and the project date for structured data). */
  published: string;
  /** label: snapshot row name (default "Signage partner"); note: text after the link; logo: partner logo in the partner section. */
  partner?: { name: string; url: string; label?: string; note?: string; logo?: "quickneons" | "quick-signage" };
  startDate?: string; completedDate?: string; category: string; services: string[];
  /** Where the case study is highlighted: "signs", "wraps", a signs page (signage, shopfronts, printing, neon), "vehicle-wraps", "fleet". */
  tags: string[];
  featured: CaseImage;
  /** Where to anchor the hero crop (CSS object-position), e.g. "center 25%" when the sign sits high in a portrait photo. */
  heroPosition?: string;
  /** How the client found us and how the job began, as short numbered steps (shown before the challenge). */
  journey?: { title: string; intro: string; steps: { label: string; text: string }[] };
  challenge: { title: string; paragraphs: string[]; needs: string[]; before: CaseImage[] };
  design?: { title: string; intro: string; points: { label: string; text: string }[]; finish?: string; image?: CaseImage };
  /** Mockups on photos of the real site: one numbered step per sign, then the mockup images. */
  mockups?: { title: string; intro: string; text?: string[]; steps?: { label: string; text: string }[]; images: CaseImage[] };
  specs?: { title: string; columns: string[]; rows: string[][]; note?: string };
  /** Either labelled points (two columns), or paragraphs with a gallery and an optional video. */
  production?: { title: string; intro: string; points?: { label: string; text: string }[]; paragraphs?: string[]; images?: CaseImage[]; video?: CaseVideo };
  installation?: { title: string; paragraphs: string[]; image?: CaseImage; video?: CaseVideo };
  result: { title: string; paragraphs: string[]; after: CaseImage[]; video?: CaseVideo };
  /** Long-term client: the other work we've done for them. */
  relationship?: { title: string; intro: string; items: { label: string; text: string }[]; outro: string };
  /** Client review. `approved: false` keeps a drafted review off the site until the client has confirmed it. */
  quote?: { text: string; name: string; role: string; approved?: boolean };
  why?: { title: string; points: { label: string; text: string }[] };
  partnerSection?: { title: string; paragraphs: string[]; image?: CaseImage };
  faqs: CaseFaq[];
  /** Instagram reel ids (instagram.com/reel/<id>/), shown as embedded videos. */
  reels: string[];
  /** Earlier jobs for the same client: captioned photo groups and self-hosted videos. */
  earlier?: { title: string; intro: string; groups: { title: string; text: string; images: CaseImage[] }[]; videos: { src: string; poster: string; title: string; width: number; height: number }[] };
  cta: { title: string; text: string };
};

const dir = "/media/case-studies/car-pro-automotive";
const landscape = { width: 1448, height: 1086 }, portrait = { width: 1200, height: 1600 };
const bre = "/media/case-studies/bombay-real-estate-truganina", mock = { width: 1600, height: 1131 };
const early = `${bre}/earlier`;
const len = "/media/case-studies/lentils-indian-cuisine-armstrong-creek";
const dan = "/media/case-studies/dans-seafood-outlet-williamstown";
const ssg = "/media/case-studies/southern-services-group-ute-fleet";
const acl = "/media/case-studies/a-class-fencing-ute-signage";

export const caseStudies: CaseStudy[] = [
  {
    slug: "car-pro-automotive-3d-signage-geelong",
    title: "Car Pro Automotive: 3D Illuminated Signage for a New South Geelong Workshop",
    seoTitle: "Car Pro Automotive 3D Signage Geelong | Case Study",
    metaDescription: "How we designed, built and installed 3D illuminated and non-lit signage for Car Pro Automotive's new South Geelong workshop in just 8 days.",
    summary: "Signs N' Wraps designed, fabricated and installed a complete set of 3D illuminated and non-lit building signage for Car Pro Automotive at 161 Fyans St, South Geelong VIC 3220. The whole job, from first design on 20 October to final installation on 28 October 2026, took just 8 days, delivered with our signage partner, Quick Signage. It included illuminated 3D \"CAR PRO AUTOMOTIVE\" signs on the main fascia and corner, non-lit 3D service lists on two elevations, a non-lit entrance sign for the workshop's Euro and Land Rover specialty, and red vinyl trim lines across the facade.",
    client: "Car Pro Automotive",
    industry: "Automotive repair and servicing workshop",
    location: "161 Fyans St, South Geelong VIC 3220",
    service: "3D building signage: design, fabrication and installation",
    signageTypes: "3D illuminated letters, 3D non-lit letters, vinyl trim lines",
    timeline: "8 days (20–28 October 2026), from design to installation",
    highlights: [["8 days", "design to installation"], ["3D letters", "illuminated & non-lit"], ["South Geelong", "automotive workshop"]],
    published: "2026-10-28",
    partner: { name: "Quick Signage", url: "https://quicksignage.com.au" },
    startDate: "2026-10-20", completedDate: "2026-10-28", category: "Commercial signage",
    tags: ["signs", "signage", "shopfronts"],
    services: ["3D illuminated letters", "3D non-lit letters", "Vinyl trim lines", "Design, fabrication and installation"],
    featured: { src: `${dir}/car-pro-automotive-3d-signage-geelong-corner.webp`, alt: "Car Pro Automotive workshop in South Geelong with illuminated red 3D letters and non-lit 3D service signage", ...landscape },
    challenge: {
      title: "The challenge: a new address and a blank building",
      paragraphs: [
        "Car Pro Automotive has been a Signs N' Wraps customer for a while. When the workshop moved to a new site on Fyans St in South Geelong, the building had no branding at all. It was blank cladding, and the roadside pylon frame was empty.",
        "For a mechanic, a move is risky. Regular customers need to find the new workshop easily, and drivers passing on Fyans St need to know who is there and what services they offer. Car Pro needed signage that:",
      ],
      needs: ["worked on a busy road, readable from a moving car", "named their services clearly, not just their brand", "stood out at night as well as during the day", "went up fast, so the move didn't cost them trade"],
      before: [
        { src: `${dir}/car-pro-automotive-south-geelong-before-blank-facade.webp`, alt: "Blank white facade of Car Pro Automotive's new workshop in South Geelong before signage", ...portrait },
        { src: `${dir}/car-pro-automotive-before-entrance.webp`, alt: "Unbranded entrance of Car Pro Automotive's Fyans St building before signage installation", ...portrait },
        { src: `${dir}/car-pro-automotive-before-side-wall.webp`, alt: "Blank side wall of Car Pro Automotive's South Geelong workshop before 3D lettering", ...portrait },
        { src: `${dir}/car-pro-automotive-before-corner.webp`, alt: "Corner of the Car Pro Automotive building before signage, South Geelong", ...portrait },
        { src: `${dir}/car-pro-automotive-before-empty-pylon-frame.webp`, alt: "Empty roadside pylon sign frame at 161 Fyans St, South Geelong", ...portrait },
      ],
    },
    design: {
      title: "Design: making every wall work",
      intro: "We planned the signage around how people actually see the building: drivers approaching from both directions, customers pulling into the car park, and people walking to the front door.",
      points: [
        { label: "Main fascia", text: "illuminated red \"CAR PRO\" 3D letters with illuminated \"AUTOMOTIVE\" lettering underneath. This is the hero sign, built to be seen from a distance." },
        { label: "Corner tower", text: "the illuminated Car Pro Automotive logo above non-lit \"ROADWORTHY\" and \"EV & TYRES\" lettering, so drivers coming from the side can see it." },
        { label: "Service lists", text: "Roadworthy, Log Book Service, Diagnostics, EV & Hybrids and Mobile Services, in bold non-lit 3D letters on the street-facing walls. Customers know what Car Pro does before they even pull in." },
        { label: "Entrance sign", text: "\"EURO & LAND ROVER SPECIALIST\" above the entry in non-lit 3D letters, highlighting the workshop's specialist skills right where customers walk in." },
      ],
      finish: "To finish the look, we applied red vinyl trim lines along the roofline and fascia edges of the newly painted charcoal facade. They frame every sign and tie the building into Car Pro's red, white and charcoal branding.",
    },
    production: {
      title: "Production: illuminated and non-lit 3D letters",
      intro: "The package combined two types of 3D lettering with custom vinyl:",
      points: [
        { label: "Illuminated (front-lit) 3D letters", text: "for the \"CAR PRO AUTOMOTIVE\" signs on the main fascia and corner. LEDs inside each letter light up the face, so the brand stays visible after dark and on overcast Geelong evenings." },
        { label: "Non-lit 3D letters", text: "for the service lists, \"ROADWORTHY / EV & TYRES\" and the \"EURO & LAND ROVER SPECIALIST\" entrance sign. These give the same depth and premium look at a lower cost, and suit information people read up close or in daylight." },
        { label: "Red vinyl trim lines", text: "cut and applied along the facade edges, adding a sharp brand accent without extra hardware." },
      ],
    },
    installation: {
      title: "Installation: done in 8 days",
      paragraphs: ["Our installation team, together with our signage partner Quick Signage, fitted every sign using an elevated work platform, positioning each letter precisely on the facade panels so the lines sat level and evenly spaced. Work started on 20 October, and the last letter went up at 7:26 pm on 28 October 2026. That's 8 days from first design to finished building."],
      image: { src: `${dir}/euro-land-rover-specialist-entrance-sign-geelong.webp`, alt: "Euro and Land Rover Specialist 3D entrance sign being installed at Car Pro Automotive Geelong", ...landscape },
    },
    result: {
      title: "The result: a workshop you can't miss",
      paragraphs: ["Car Pro Automotive's new South Geelong workshop now explains itself at a glance. The illuminated Car Pro Automotive signs stay visible at night, red vinyl trim lines frame the building, every key service is spelled out in 3D letters, and the Euro and Land Rover specialty is clear the moment customers arrive."],
      after: [
        { src: `${dir}/car-pro-automotive-illuminated-fascia-sign.webp`, alt: "Front view of Car Pro Automotive's illuminated 3D fascia sign and non-lit service list", ...landscape },
        { src: `${dir}/mechanic-workshop-3d-service-lettering-geelong.webp`, alt: "Close-up of non-lit 3D letters listing roadworthy, log book service, diagnostics, EV and hybrids and mobile services", ...landscape },
      ],
    },
    quote: { text: "Moving into a new workshop is stressful enough, so we needed our signage done fast and done right. Signs N' Wraps designed, built and installed everything in just over a week. Now the building tells people exactly who we are and what we do, and the lit CAR PRO letters stand out on Fyans St day and night. Our customers keep telling us how good the new place looks.", name: "Karam Singh", role: "Director, Car Pro Automotive" },
    why: {
      title: "Why this signage works for an automotive workshop",
      points: [
        { label: "Services on the building = more of the right enquiries.", text: "Drivers searching for a roadworthy or log book service see it straight from the road." },
        { label: "Lighting extends visibility.", text: "Illuminated letters keep advertising after hours, when many people drive past." },
        { label: "Multiple viewing angles.", text: "Signs on the corner, fascia and entrance mean the building is branded from every direction." },
        { label: "3D letters look premium.", text: "The depth and shadow of raised lettering signal an established, trustworthy business." },
      ],
    },
    partnerSection: {
      title: "Built with our signage partner, Quick Signage",
      paragraphs: ["Signs N' Wraps is a proud partner of Quick Signage, a Geelong-based signage company. On the Car Pro Automotive project, the two teams worked side by side to design, fabricate and install every sign in 8 days. For Geelong customers, that partnership means local know-how and faster turnaround, backed by the Signs N' Wraps consultation and design process."],
      image: { src: `${dir}/car-pro-automotive-quick-signage-partner-south-geelong.webp`, alt: "Red CAR PRO illuminated 3D letter sign in South Geelong with the Quick Signage van on site", ...landscape },
    },
    // Word for word with the FAQPage structured data.
    faqs: [
      { question: "How long does 3D signage take to design and install?", answer: "For Car Pro Automotive in South Geelong, design, fabrication and installation took 8 days. Timelines depend on the size of the job, the number of signs, whether council permits are needed and site access. We give you a clear timeline at your consultation." },
      { question: "What is the difference between illuminated and non-lit 3D letters?", answer: "Illuminated (front-lit) 3D letters have LEDs inside, and the light shines through a translucent face so the letters glow at night. Non-lit 3D letters are solid raised letters with no lighting. They cost less and suit service lists, secondary signs and areas that are well lit." },
      { question: "What signage does a mechanic or automotive workshop need?", answer: "Most workshops benefit from a main illuminated brand sign, a list of key services such as roadworthy, log book servicing, diagnostics and EV and hybrid servicing, entrance or specialty signage, and a roadside pylon sign if the site has one." },
      { question: "Do I need a council permit for business signage in Geelong?", answer: "Some signs need a planning permit from the City of Greater Geelong, especially illuminated signs, large signs and pylon signs. It depends on your zone and the sign type. We check permit requirements during your consultation." },
      { question: "Do you install signage in Geelong?", answer: "Yes. Signs N' Wraps designs, fabricates and installs business signage for clients in Geelong and across Melbourne, from our Laverton North store, working with our Geelong-based signage partner, Quick Signage." },
    ],
    reels: ["Dfx6U9jhq-0", "DfgGmTTvnhZ"],
    cta: { title: "Planning new signage for your business?", text: "Moving premises, rebranding or just not being seen? Book a free signage consultation with our team. We'll walk you through 3D letters, illuminated signs and building signage options that suit your site and budget." },
  },
  {
    slug: "bombay-real-estate-truganina-signage",
    title: "Bombay Real Estate: Complete Office Signage for a New Truganina Location",
    seoTitle: "Bombay Real Estate Truganina Signage | Case Study",
    metaDescription: "3D illuminated logos, a lightbox, halo-lit and acrylic signs and door vinyl for Bombay Real Estate's new Truganina office. See the full fit-out.",
    summary: "When Bombay Real Estate opened its new office at Level 1, 180/150 Palmers Road, Truganina, Signs N' Wraps and our signage partner Quick Signage delivered the full signage package, inside and out. It included front and side 3D illuminated logos with a purple halo glow, a double-sided cantilever lightbox, a halo-lit ACP push-through logo for the lounge, an acrylic \"Bombay Group\" directory sign and a printed glass door vinyl. Bombay Real Estate is a long-standing client: our team has been doing their signage for a few years.",
    client: "Bombay Real Estate Pty Ltd",
    industry: "Real estate agency",
    location: "Level 1, 180/150 Palmers Road, Truganina VIC 3029",
    service: "Design, mockups, fabrication and installation",
    signageTypes: "3D illuminated logos, cantilever lightbox, halo-lit ACP logo, acrylic on stand-offs, door vinyl",
    snapshot: [
      ["Client", "Bombay Real Estate Pty Ltd"], ["Industry", "Real estate agency"], ["Location", "Level 1, 180/150 Palmers Road, Truganina VIC 3029"],
      ["Scope", "6 signs: exterior, entrance and interior"], ["Sign types", "3D illuminated logos, cantilever lightbox, halo-lit ACP logo, acrylic on stand-offs, door vinyl"],
      ["Service", "Design, mockups, fabrication and installation"],
    ],
    highlights: [["6 signs", "inside and out"], ["Purple halo", "3D illuminated logos"], ["Truganina", "real estate office"]],
    published: "2026-11-20",
    partner: { name: "Quick Signage", url: "https://quicksignage.com.au" },
    category: "Commercial signage",
    tags: ["signs", "signage", "shopfronts"],
    services: ["3D illuminated logo signs (front and side)", "Double-sided cantilever lightbox", "Halo-lit ACP push-through logo", "Acrylic sign on stand-offs", "Glass door vinyl", "Design, fabrication and installation"],
    heroPosition: "center 10%",
    featured: { src: `${bre}/bombay-real-estate-truganina-shopfront-signage.webp`, alt: "Bombay Real Estate office in Truganina with a 3D illuminated logo sign on the building facade", width: 898, height: 1600 },
    challenge: {
      title: "The challenge: one brand, a sixth office",
      paragraphs: [
        "Bombay Real Estate sells residential property and provides leasing services for its landlords. Part of the Bombay Group, it has offices across Melbourne's north (Wollert, Mickleham, Craigieburn and Donnybrook) and has now opened its first office in Melbourne's west, in Truganina. After a few years of working with our team on their signage, they came back for the new office.",
        "As director Jatin Mehta put it, standing out is one thing, but how to stand out is another. The team had a clear vision for the West office, and our job was to deliver it.",
        "The building was a brand-new, two-storey commercial unit with no branding. The client needed signage that would:",
      ],
      needs: ["make the office easy to spot from Palmers Road and the car park", "match the look of the other Bombay offices", "guide visitors from the front door, up the stairs and into the office", "give the reception and lounge a premium, finished feel"],
      before: [
        { src: `${bre}/bombay-real-estate-truganina-before-facade.webp`, alt: "Bombay Real Estate's new Truganina building before signage", width: 390, height: 523 },
        { src: `${bre}/bombay-real-estate-truganina-before-building-corner.webp`, alt: "Corner of the new Truganina commercial building before Bombay Real Estate signage", width: 387, height: 511 },
        { src: `${bre}/bombay-real-estate-before-stairwell-wall.webp`, alt: "Blank stairwell wall in the Bombay Real Estate Truganina office before signage", width: 960, height: 1280 },
      ],
    },
    mockups: {
      title: "Design and mockups: six signs, one look",
      intro: "We mapped out every spot a client would see the brand and prepared a mockup for each sign on photos of the real site. The client could see exactly how each sign would look before anything was made.",
      steps: [
        { label: "Front 3D illuminated logo", text: "4260 mm wide x 1410 mm high, facing the street." },
        { label: "Side 3D illuminated logo", text: "3050 mm wide x 1010 mm high, for drivers coming from the side." },
        { label: "Cantilever lightbox", text: "500 x 500 mm, double-sided, at the entrance." },
        { label: "Glass door vinyl", text: "2300 x 930 mm print with the logo, QR code, address, trading hours and contact details." },
        { label: "Halo-lit ACP push-through logo", text: "a feature sign for the arched lounge wall." },
        { label: "\"Bombay Group\" directory sign", text: "listing all five office locations, in the stairwell." },
      ],
      images: [
        { src: `${bre}/bombay-real-estate-mockup-front-3d-illuminated-logo.webp`, alt: "Mockup of Bombay Real Estate front 3D illuminated logo sign, 4260 mm by 1410 mm", ...mock },
        { src: `${bre}/bombay-real-estate-mockup-side-3d-illuminated-logo.webp`, alt: "Mockup of Bombay Real Estate side 3D illuminated logo sign", ...mock },
        { src: `${bre}/bombay-real-estate-mockup-cantilever-lightbox.webp`, alt: "Mockup of Bombay Real Estate 500 mm double-sided cantilever lightbox", ...mock },
        { src: `${bre}/bombay-real-estate-mockup-glass-door-vinyl.webp`, alt: "Mockup of Bombay Real Estate printed vinyl on the glass entrance door", ...mock },
        { src: `${bre}/bombay-real-estate-mockup-halo-lit-acp-logo.webp`, alt: "Mockup of Bombay Real Estate halo-lit ACP push-through logo on an arched wall", ...mock },
        { src: `${bre}/bombay-real-estate-mockup-acrylic-group-directory.webp`, alt: "Mockup of Bombay Group acrylic directory sign listing five office locations", ...mock },
      ],
    },
    specs: {
      title: "Sign specifications",
      columns: ["Sign", "Size", "Construction", "Lighting"],
      rows: [
        ["Front 3D logo", "4260 x 1410 mm", "50 mm fabricated acrylic, white face, satin black returns, on stand-offs", "Illuminated face + RGB LED purple halo glow"],
        ["Side 3D logo", "3050 x 1010 mm", "Same as front logo", "Illuminated face + RGB LED purple halo glow"],
        ["Cantilever lightbox", "500 x 500 mm", "Double-sided, opal acrylic faces, wall bracket", "Internally lit"],
        ["Door vinyl", "2300 x 930 mm", "Printed vinyl on clear, applied inside the glass", "Non-lit"],
        ["Lounge logo", "Custom", "ACP push-through, matte finish", "Halo-lit"],
        ["Group directory", "Custom", "10 mm acrylic on stand-offs, matte finish", "Non-lit"],
      ],
    },
    installation: {
      title: "Production and installation",
      paragraphs: [
        "The two building logos are 50 mm fabricated acrylic with white illuminated faces and satin black returns. They sit on stand-offs, with RGB LEDs on the back that throw a purple glow onto the facade, matching Bombay's brand colour after dark. Both were installed high on the metal-clad facade using a lift.",
        "Inside, the lounge logo was fitted to the arched feature wall. It is an ACP push-through sign that stands off the wall with a halo glow behind it. The acrylic directory sign went up in the stairwell, and the door vinyl was applied to the inside of the glass so it stays protected from the weather.",
      ],
      image: { src: `${bre}/bombay-real-estate-arched-wall-installation.webp`, alt: "Installing the halo-lit sign on the arched lounge wall at Bombay Real Estate Truganina", width: 960, height: 1280 },
    },
    result: {
      title: "The result: a finished office from street to lounge",
      paragraphs: ["Bombay Real Estate's Truganina office now carries its brand all the way through. The 3D logos make the building easy to find from Palmers Road, the lightbox marks the entrance, and the door vinyl gives visitors every contact detail and a QR code before they step inside. Upstairs, the halo-lit lounge logo and the Bombay Group directory make the office feel as established as the group behind it."],
      after: [
        { src: `${bre}/bombay-real-estate-3d-illuminated-sign-truganina.webp`, alt: "Bombay Real Estate 3D illuminated logo sign on the Truganina office facade", width: 897, height: 1600 },
        { src: `${bre}/bombay-real-estate-3d-letters-side-angle.webp`, alt: "Side angle of Bombay Real Estate 3D acrylic letters on stand-offs", width: 898, height: 1600 },
        { src: `${bre}/bombay-real-estate-front-3d-logo-sign.webp`, alt: "Front view of Bombay Real Estate 3D logo sign", width: 898, height: 1600 },
        { src: `${bre}/bombay-real-estate-cantilever-lightbox-sign.webp`, alt: "Bombay Real Estate double-sided cantilever lightbox at the office entrance", width: 517, height: 920 },
        { src: `${bre}/bombay-real-estate-glass-door-vinyl-truganina.webp`, alt: "Printed vinyl on the glass entrance door of Bombay Real Estate Truganina", width: 1200, height: 1600 },
        { src: `${bre}/bombay-real-estate-halo-lit-logo-arched-wall.webp`, alt: "Halo-lit Bombay Real Estate logo on an arched lounge wall", width: 897, height: 1600 },
        { src: `${bre}/bombay-real-estate-halo-lit-push-through-logo-close-up.webp`, alt: "Close-up of Bombay Real Estate halo-lit push-through logo", width: 898, height: 1600 },
        { src: `${bre}/bombay-real-estate-office-lounge-halo-sign.webp`, alt: "Bombay Real Estate lounge with halo-lit logo sign", width: 1200, height: 1600 },
        { src: `${bre}/bombay-group-acrylic-directory-sign-stairwell.webp`, alt: "Bombay Group acrylic directory sign in the stairwell listing Wollert, Mickleham, Craigieburn, Donnybrook and Truganina", width: 1200, height: 1600 },
        { src: `${bre}/bombay-group-office-locations-acrylic-sign.webp`, alt: "Bombay Group office locations acrylic sign above the stairs", width: 897, height: 1600 },
      ],
    },
    quote: { text: "What we were really looking for, standing out is one thing, but how to stand out is another thing. We had a vision, and Deepinder and his team definitely delivered on it. My overall experience with Deepinder and his team from Quick Signage has been tremendous. Me and my business partner, Ravi, have been using them for a long time, and we're very happy with the service. I really recommend them to anyone looking to do anything in the signage space.", name: "Jatin Mehta", role: "Director, Bombay Real Estate" },
    why: {
      title: "Why this signage works for a real estate agency",
      points: [
        { label: "Seen from the road.", text: "Large illuminated logos on two sides of the building catch both passing traffic and the car park." },
        { label: "Branded after dark.", text: "The purple halo glow keeps the office visible in the evening, when many buyers and renters drive past." },
        { label: "Details at the door.", text: "The door vinyl answers the first questions (hours, phone, website) and the QR code takes people straight online." },
        { label: "One look across every office.", text: "Matching signs across the Bombay Group make each new branch feel established from day one." },
      ],
    },
    partnerSection: {
      title: "Built with our signage partner, Quick Signage",
      paragraphs: ["Signs N' Wraps is a proud partner of Quick Signage, led by founder Deepinder Singh Mann. Deepinder and his team have looked after Bombay Real Estate's signage for years. For the Truganina office, the two teams worked together on the mockups, fabrication and installation, giving the client one point of contact for all six signs."],
    },
    // Word for word with the FAQPage structured data.
    faqs: [
      { question: "What signage does a real estate office need?", answer: "Most real estate offices need a large building sign that can be seen from the road, a smaller sign at the entrance, door or window graphics with contact details and trading hours, and branded signs inside for reception and meeting areas. Bombay Real Estate's Truganina office used all four." },
      { question: "What is a halo-lit sign?", answer: "A halo-lit sign has LEDs behind it that shine back onto the wall, creating a soft glow around the edges. It looks premium and works well in receptions and lounges. Bombay Real Estate's lounge logo is an ACP push-through sign with a halo glow." },
      { question: "What is a cantilever lightbox sign?", answer: "A cantilever lightbox sticks out from the wall on a bracket, so people walking along the shopfront can see it from both directions. Bombay Real Estate's is a 500 x 500 mm double-sided lightbox with opal acrylic faces that light up evenly." },
      { question: "Can you match signage across multiple office locations?", answer: "Yes. Bombay Real Estate has worked with our team for a few years, across more than one of their offices. Keeping the same logo files, colours and sign styles means every location looks like part of one brand." },
      { question: "Do you install signage in Truganina and Melbourne's west?", answer: "Yes. Truganina is close to our Laverton North store, and we design, fabricate and install business signage across Melbourne's west and Geelong, working with our signage partner, Quick Signage." },
    ],
    earlier: {
      title: "Earlier projects for Bombay Real Estate",
      intro: "Truganina isn't the first Bombay office we've branded. Our team has looked after Bombay Real Estate's signage for a few years, and these are some of the earlier jobs: shopfront fascias, window graphics, reception logos, office interiors, lightboxes and hanging signs.",
      groups: [
      { title: "Shopfront fascia signs", text: "A full blue fascia with 3D illuminated Bombay logos, the 1800 BOMBAY number and the website, installed and lit up at night.", images: [
          { src: `${early}/bombay-real-estate-blue-fascia-shopfront-sign.webp`, alt: "Bombay Real Estate shopfront with a blue fascia sign, 3D logos and the 1800 BOMBAY number", width: 1024, height: 768 },
          { src: `${early}/bombay-real-estate-3d-logo-fascia-close.webp`, alt: "3D illuminated Bombay logo on a blue shopfront fascia", width: 1280, height: 960 },
          { src: `${early}/bombay-real-estate-illuminated-fascia-at-night.webp`, alt: "Bombay Real Estate fascia signs lit up at night", width: 1280, height: 720 },
          { src: `${early}/bombay-real-estate-shopfront-fascia-wide.webp`, alt: "Wide view of a Bombay Real Estate shopfront fascia with illuminated logos", width: 1280, height: 960 },
          { src: `${early}/bombay-real-estate-fascia-sign-installation.webp`, alt: "Installer fitting Bombay Real Estate fascia signage from a ladder", width: 1280, height: 960 },
        ] },
      { title: "Window and glass graphics", text: "Printed window graphics, gradient frosting, award badges and trading details on the glass.", images: [
          { src: `${early}/bombay-real-estate-window-graphics-awards.webp`, alt: "Bombay Real Estate window graphics with award badges", width: 768, height: 1024 },
          { src: `${early}/bombay-real-estate-shopfront-window-graphics.webp`, alt: "Bombay Real Estate shopfront with printed window graphics", width: 1024, height: 768 },
          { src: `${early}/bombay-real-estate-window-frosting-graphics.webp`, alt: "Bombay Real Estate window graphics with purple gradient frosting", width: 1280, height: 719 },
          { src: `${early}/bombay-real-estate-glass-door-script-logo.webp`, alt: "Bombay script logo vinyl on a glass shopfront at dusk", width: 960, height: 1280 },
          { src: `${early}/bombay-real-estate-window-lettering-night.webp`, alt: "Bombay Real Estate glass shopfront lettering lit from inside at night", width: 1280, height: 960 },
          { src: `${early}/bombay-real-estate-glass-trading-details-vinyl.webp`, alt: "Trading details and contact vinyl on a Bombay Real Estate glass door", width: 768, height: 1024 },
        ] },
      { title: "Illuminated reception logos", text: "3D illuminated Bombay logos as the feature on reception walls.", images: [
          { src: `${early}/bombay-real-estate-illuminated-reception-logo.webp`, alt: "Illuminated 3D Bombay Real Estate logo on a reception wall", width: 960, height: 1280 },
          { src: `${early}/bombay-real-estate-3d-reception-logo-glow.webp`, alt: "3D Bombay Real Estate logo with a soft glow on a reception wall", width: 1280, height: 960 },
          { src: `${early}/bombay-real-estate-reception-logo-wall.webp`, alt: "Illuminated Bombay logo on a white reception wall", width: 1024, height: 768 },
          { src: `${early}/bombay-real-estate-reception-feature-wall.webp`, alt: "Bombay Real Estate logo on a reception feature wall", width: 1280, height: 960 },
          { src: `${early}/bombay-real-estate-reception-counter-logo.webp`, alt: "Bombay Real Estate logo behind a reception counter", width: 960, height: 1280 },
        ] },
      { title: "Office interiors", text: "Logo walls in the open-plan office and meeting rooms, and a map wall graphic of Craigieburn.", images: [
          { src: `${early}/bombay-real-estate-office-wall-logo.webp`, alt: "Bombay Real Estate logo on an open-plan office wall", width: 1280, height: 944 },
          { src: `${early}/bombay-real-estate-meeting-room-logo.webp`, alt: "Bombay Real Estate logo in a meeting room", width: 913, height: 1200 },
          { src: `${early}/bombay-real-estate-office-logo-panel.webp`, alt: "Bombay Real Estate logo on an office wall panel", width: 895, height: 1200 },
          { src: `${early}/bombay-real-estate-craigieburn-map-wall-graphic.webp`, alt: "Map wall graphic of Craigieburn VIC 3064 with the Bombay logo", width: 960, height: 1280 },
        ] },
      { title: "Lightboxes and hanging signs", text: "Illuminated lightboxes and hanging signs, from fabrication in our workshop to the finished sign at night.", images: [
          { src: `${early}/bombay-real-estate-illuminated-lightbox-pylon.webp`, alt: "Illuminated Bombay Real Estate lightbox sign at night", width: 960, height: 1280 },
          { src: `${early}/bombay-real-estate-lightbox-at-night.webp`, alt: "Bombay Real Estate lightbox glowing at a shopfront at night", width: 960, height: 1280 },
          { src: `${early}/bombay-real-estate-lightbox-fabrication.webp`, alt: "Bombay Real Estate lightbox being fabricated in the workshop", width: 960, height: 1280 },
          { src: `${early}/bombay-real-estate-hanging-sign.webp`, alt: "Bombay Real Estate hanging sign under a shopfront awning", width: 960, height: 1280 },
          { src: `${early}/bombay-real-estate-hanging-sign-shopfront.webp`, alt: "Bombay Real Estate hanging sign above a shopfront walkway", width: 1280, height: 960 },
          { src: `${early}/bombay-real-estate-entrance-lightbox-night.webp`, alt: "Bombay Real Estate entrance lightbox at night", width: 960, height: 1280 },
        ] },
      ],
      videos: [
        { src: `${early}/bombay-real-estate-fascia-final-result-video.mp4`, poster: `${early}/bombay-real-estate-fascia-final-result-video-poster.webp`, title: "The finished fascia signs", width: 1024, height: 576 },
        { src: `${early}/bombay-real-estate-shopfront-final-look-video.mp4`, poster: `${early}/bombay-real-estate-shopfront-final-look-video-poster.webp`, title: "The final look", width: 576, height: 1024 },
        { src: `${early}/bombay-real-estate-3d-sign-installation-video.mp4`, poster: `${early}/bombay-real-estate-3d-sign-installation-video-poster.webp`, title: "Installing the 3D illuminated sign", width: 576, height: 768 },
        { src: `${early}/bombay-real-estate-installing-fascia-video.mp4`, poster: `${early}/bombay-real-estate-installing-fascia-video-poster.webp`, title: "Fitting the fascia", width: 768, height: 576 },
        { src: `${early}/bombay-real-estate-lightbox-shopfront-video.mp4`, poster: `${early}/bombay-real-estate-lightbox-shopfront-video-poster.webp`, title: "Lightbox and shopfront", width: 768, height: 576 },
        { src: `${early}/bombay-real-estate-window-graphics-video.mp4`, poster: `${early}/bombay-real-estate-window-graphics-video-poster.webp`, title: "Window graphics", width: 848, height: 480 },
      ],
    },
    reels: ["DfnnJX8BBWL"],
    cta: { title: "Opening a new office or branch?", text: "Whether it's your first office or your sixth, we can design a signage package that makes it look established from day one. Book a free signage consultation and see mockups on photos of your own site before anything is made." },
  },
  {
    slug: "lentils-indian-cuisine-armstrong-creek-signage",
    title: "Lentils Indian Cuisine: Gold 3D Illuminated Signage for a New Armstrong Creek Restaurant",
    seoTitle: "Lentils Indian Cuisine Armstrong Creek Signage | Case Study",
    metaDescription: "Gold front-lit 3D letters on a 7.2 m black ACP panel, an outdoor lightbox and acrylic interior signage for Lentils Indian Cuisine in Armstrong Creek.",
    summary: "Lentils Indian Cuisine is expanding from its Torquay restaurant with a second branch at T10/11 Lagoon Street, Armstrong Creek. Signs N' Wraps and our signage partner Quick Signage designed, built and installed the new restaurant's signage. The package included 800 mm high front-lit 3D letters with gold-finish returns on a 7200 mm black ACP panel, an outdoor lightbox, and a 10 mm laser-cut acrylic 3D sign for the dining room.",
    client: "Lentils Indian Cuisine",
    industry: "Restaurant (Indian cuisine)",
    location: "T10/11 Lagoon Street, Armstrong Creek VIC 3217",
    service: "Site measure, design, mockups, fabrication, wiring and installation",
    signageTypes: "Front-lit 3D letters on ACP, lightbox, 10 mm acrylic 3D letters",
    snapshot: [
      ["Client", "Lentils Indian Cuisine"], ["Industry", "Restaurant (Indian cuisine)"], ["Location", "T10/11 Lagoon Street, Armstrong Creek VIC 3217"],
      ["Scope", "Main shopfront sign, outdoor lightbox, interior feature sign"], ["Sign types", "Front-lit 3D letters on ACP, lightbox, 10 mm acrylic 3D letters"],
      ["Finish", "Gold-finish letter returns on black"], ["Service", "Site measure, design, mockups, fabrication, wiring and installation"],
    ],
    highlights: [["800 mm", "front-lit gold 3D letters"], ["7.2 m", "black ACP sign panel"], ["Armstrong Creek", "Indian restaurant"]],
    published: "2026-11-24",
    partner: { name: "Quick Signage", url: "https://quicksignage.com.au" },
    category: "Commercial signage",
    tags: ["signs", "signage", "shopfronts"],
    services: ["Front-lit 3D illuminated letters", "Black ACP sign panel", "Outdoor lightbox", "10 mm laser-cut acrylic 3D sign (interior)", "Design, fabrication and installation"],
    featured: { src: `${len}/lentils-indian-cuisine-front-lit-sign-at-night.webp`, alt: "Lentils Indian Cuisine front-lit gold 3D letter sign glowing at night in Armstrong Creek", width: 1457, height: 1079 },
    heroPosition: "center 30%",
    challenge: {
      title: "The challenge: a second restaurant that feels premium from day one",
      paragraphs: [
        "Lentils Indian Cuisine has built a loyal following at its restaurant on Cliff Street in Torquay. Their second branch, in the new Armstrong Creek shopping precinct on Lagoon Street, opened into a brand-new building that was still under construction when we started.",
        "The client needed signage that would:",
      ],
      needs: ["make the restaurant stand out on a new strip of shops", "look premium, to match the dining experience inside", "glow at night, when most diners are choosing where to eat", "carry the brand inside, onto the arched feature wall in the dining room"],
      before: [
        { src: `${len}/lentils-armstrong-creek-before-shopfront.webp`, alt: "Lentils Indian Cuisine Armstrong Creek shopfront under construction before signage", width: 705, height: 534 },
        { src: `${len}/lentils-armstrong-creek-blank-facade-site-measure.webp`, alt: "Blank facade at T10/11 Lagoon Street, Armstrong Creek, during the site measure", width: 1600, height: 1200 },
        { src: `${len}/lentils-armstrong-creek-lightbox-frame-before.webp`, alt: "Empty outdoor lightbox frame at the Lentils Armstrong Creek site", width: 1200, height: 1600 },
        { src: `${len}/lentils-interior-arched-feature-wall-before.webp`, alt: "Arched interior feature wall at Lentils Armstrong Creek before signage", width: 1200, height: 1600 },
      ],
    },
    mockups: {
      title: "Design and mockups: gold on black",
      intro: "We started with a full site measure: the facade, the outdoor lightbox frame and the interior arched wall. We then prepared mockups showing different sign options on photos of the actual shopfront, so the client could compare them before choosing.",
      text: ["The final design uses gold-finish returns (the sides of each letter) against a black ACP panel. Gold on black gives a rich, upmarket look that suits a restaurant and stays readable from a distance."],
      images: [
        { src: `${len}/lentils-indian-cuisine-signage-mockup-options.webp`, alt: "Lentils Indian Cuisine signage mockup showing three design options", width: 1600, height: 1132 },
        { src: `${len}/lentils-indian-cuisine-signage-mockup-on-site.webp`, alt: "Mockup of the chosen Lentils Indian Cuisine sign on the Armstrong Creek shopfront", width: 1600, height: 1132 },
      ],
    },
    specs: {
      title: "Sign specifications",
      columns: ["Sign", "Size", "Construction", "Lighting"],
      rows: [
        ["Main shopfront sign", "800 mm high letters on a 7200 mm wide panel", "3D letters with gold-finish returns, mounted on black ACP", "Front-lit (LED)"],
        ["Outdoor lightbox", "800 x 800 mm", "Lightbox with branded faces", "Illuminated"],
        ["Interior feature sign", "Custom, to suit arched wall", "10 mm laser-cut CNC acrylic 3D letters", "Non-lit"],
      ],
    },
    production: {
      title: "Production: built and wired in the workshop",
      intro: "Each letter was fabricated with gold-finish returns, then fitted with LED modules and wired by hand so the faces light up evenly. The letters were then mounted on the 7200 mm black ACP panel in the workshop, so the whole sign could be checked before it went to site.",
      paragraphs: ["The interior sign was laser-cut on a CNC machine from 10 mm acrylic, giving crisp, clean edges."],
      images: [
        { src: `${len}/lentils-3d-letters-gold-finish-fabrication.webp`, alt: "Gold-finish 3D letters for Lentils Indian Cuisine during fabrication", width: 1600, height: 1200 },
        { src: `${len}/lentils-3d-letter-led-modules-wiring.webp`, alt: "LED modules wired inside a Lentils 3D illuminated letter", width: 1200, height: 1600 },
        { src: `${len}/lentils-illuminated-letter-led-installation-workshop.webp`, alt: "Technician fitting LEDs into a 3D letter in the workshop", width: 1200, height: 1600 },
        { src: `${len}/lentils-gold-3d-letters-close-up.webp`, alt: "Close-up of gold 3D letters for the Lentils sign", width: 1600, height: 1200 },
        { src: `${len}/lentils-3d-letters-assembled-on-black-acp-panel.webp`, alt: "Lentils gold 3D letters assembled on a black ACP panel", width: 1600, height: 1200 },
        { src: `${len}/lentils-acp-panel-sign-assembly-workshop.webp`, alt: "Lentils Indian Cuisine ACP panel sign being assembled in the workshop", width: 1200, height: 1600 },
      ],
      video: { src: `${len}/lentils-3d-letter-acp-sign-workshop-video.mp4`, poster: `${len}/lentils-3d-letter-acp-sign-workshop-video-poster.webp`, title: "Lentils Indian Cuisine 3D letter sign in the workshop", description: "Gold-finish 3D letters mounted on a black ACP panel for Lentils Indian Cuisine, Armstrong Creek, before installation.", width: 720, height: 1280, duration: "PT7S", uploadDate: "2026-11-24" },
    },
    result: {
      title: "Installation and result: a shopfront that glows",
      paragraphs: ["Once installed, the sign was wired up so the letters glow at night. The gold returns catch the light by day, and after dark the letters glow warmly across the car park. The outdoor lightbox marks the entrance for people walking past, and the acrylic sign brings the brand inside, onto the dining room's arched feature wall."],
      after: [
        { src: `${len}/lentils-indian-cuisine-3d-illuminated-sign-armstrong-creek.webp`, alt: "Lentils Indian Cuisine 3D illuminated letter sign on the Armstrong Creek shopfront", width: 1600, height: 1200 },
        { src: `${len}/lentils-indian-cuisine-outdoor-lightbox-sign.webp`, alt: "Lentils Indian Cuisine outdoor lightbox sign at the restaurant entrance", width: 1200, height: 1600 },
      ],
    },
    // Approved by Ajay (confirmed 24 Nov 2026).
    quote: { text: "We wanted the Armstrong Creek restaurant to feel as special as our Torquay one from the day we opened. The team measured everything while the building was still being finished, showed us mockups on photos of our actual shopfront, and the gold letters look even better in person. At night the sign really glows, and customers often mention it when they walk in. Great work from start to finish, and very easy to deal with.", name: "Ajay", role: "Manager, Lentils Indian Cuisine", approved: true },
    why: {
      title: "Why this signage works for a restaurant",
      points: [
        { label: "Lit when it matters.", text: "Most diners choose where to eat in the evening, and front-lit letters keep the name visible after dark." },
        { label: "Premium look.", text: "Gold on black signals quality before a customer walks in." },
        { label: "Signs for drivers and walkers.", text: "The large panel sign reaches the car park and road, while the lightbox catches people on foot." },
        { label: "The brand continues inside.", text: "The acrylic feature sign carries the same identity into the dining room, which makes a great backdrop for customer photos." },
      ],
    },
    partnerSection: {
      title: "Built with our signage partner, Quick Signage",
      paragraphs: ["Signs N' Wraps is a proud partner of Quick Signage, a Geelong-based signage company. For Lentils Indian Cuisine, the two teams worked together on the site measure, mockups, fabrication, wiring and installation."],
    },
    // Word for word with the FAQPage structured data.
    faqs: [
      { question: "What is the best sign for a restaurant shopfront?", answer: "For most restaurants, front-lit 3D letters on a backing panel work best. They are easy to read from the road, light up at night when diners are deciding where to eat, and the backing panel gives a clean, finished look. A smaller lightbox at the entrance helps people on foot." },
      { question: "What is a front-lit 3D letter sign?", answer: "Front-lit 3D letters have LED modules inside each letter, and the light shines out through the face so the letters glow. Lentils Indian Cuisine's 800 mm letters are front-lit with gold-finish returns, mounted on a 7200 mm black ACP panel." },
      { question: "What is an ACP sign panel?", answer: "ACP (aluminium composite panel) is a rigid, weatherproof sheet made of two thin aluminium skins with a solid core. It is a popular backing for 3D letters because it stays flat over long lengths and gives a smooth, high-contrast background." },
      { question: "Can you match signage for a second restaurant location?", answer: "Yes. When a business opens a new branch, we match its logo, colours and finishes so the new site feels instantly familiar to existing customers, while sizing every sign to suit the new building." },
      { question: "Do you install signage in Armstrong Creek and Geelong?", answer: "Yes. Signs N' Wraps designs, fabricates and installs business signage in Armstrong Creek, Geelong, the Surf Coast and across Melbourne, working with our Geelong-based signage partner, Quick Signage." },
    ],
    reels: [],
    cta: { title: "Opening a restaurant or a new branch?", text: "Book a free signage consultation and see mockups on photos of your own shopfront before anything is made. We'll help you choose the right mix of illuminated letters, lightboxes and interior signs for your site and budget." },
  },
  {
    slug: "dans-seafood-outlet-williamstown-signage",
    title: "Dans Seafood Outlet: Bold Shopfront Signage for a New Williamstown Store",
    seoTitle: "Dans Seafood Outlet Williamstown Signage | Case Study",
    metaDescription: "Lightbox, ACP entrance sign and a 3.25 m printed frosted-glass graphic for Dans Seafood Outlet in Williamstown, delivered with partner brand QuickNeons.",
    summary: "Dans Seafood Outlet opened a new store at 6/73-83 Douglas Parade, Williamstown. Signs N' Wraps, through our partner brand QuickNeons, designed, printed and installed the full shopfront package. It included a 1500 x 600 mm lightbox, an 1800 x 600 mm ACP sign over the main entrance, a matching ACP sign over the rear entry and a 1410 x 3250 mm full-colour print on white frosted glass.",
    client: "Dans Seafood Outlet",
    industry: "Retail seafood",
    location: "6/73-83 Douglas Parade, Williamstown VIC 3016",
    service: "Site measure, design, mockups, print and installation",
    signageTypes: "Lightbox, 2 ACP signs, frosted-glass graphic",
    snapshot: [
      ["Client", "Dans Seafood Outlet"], ["Industry", "Retail seafood"], ["Location", "6/73-83 Douglas Parade, Williamstown VIC 3016"],
      ["Scope", "Lightbox, 2 ACP signs, frosted-glass graphic"], ["Print", "Full-colour (CMYK) on polymeric hi-tack vinyl with polymeric over-laminate"],
      ["Service", "Site measure, design, mockups, print and installation"],
    ],
    highlights: [["3.25 m", "frosted-glass graphic"], ["4 signs", "lightbox and ACP"], ["Williamstown", "seafood shop"]],
    published: "2026-11-24",
    partner: { name: "QuickNeons", url: "https://quickneons.com.au", label: "Delivered by", note: ", a Signs N' Wraps partner brand", logo: "quickneons" },
    category: "Commercial signage",
    tags: ["signs", "shopfronts", "printing"],
    services: ["Lightbox sign (1500 x 600 mm)", "Vinyl print on white frosted glass (1410 x 3250 mm)", "ACP vinyl print sign over main entrance (1800 x 600 mm)", "ACP vinyl print sign over rear entry", "Design, print and installation"],
    featured: { src: `${dan}/dans-seafood-outlet-williamstown-shopfront-signage.webp`, alt: "Dans Seafood Outlet shopfront in Williamstown with a lightbox and ACP sign over the entrance", width: 1448, height: 1086 },
    journey: {
      title: "How it started: from a logo to a finished shopfront",
      intro: "Dans Seafood Outlet found us on social media. After seeing our signage work there, they reached out and uploaded their logo on the QuickNeons website. From that one file, our team took the project all the way to finished, installed signage.",
      steps: [
        { label: "Found us on social media", text: "Dans saw our recent signage projects on our social media pages." },
        { label: "Uploaded their logo on QuickNeons", text: "They got in touch and uploaded their logo through the QuickNeons website to get started." },
        { label: "Logo turned into sign designs", text: "We measured the shop and turned the logo into a mockup of every sign, on photos of the real shopfront." },
        { label: "Printed and installed", text: "Once the mockups were approved, every sign was printed and installed: from just a logo to a fully branded shopfront." },
      ],
    },
    challenge: {
      title: "The challenge: turning an empty shop into a seafood destination",
      paragraphs: [
        "The Douglas Parade tenancy had been sitting empty, with a blank lightbox under the awning, a plain entrance and a bare frosted-glass panel on the side of the building. Dans Seafood Outlet needed customers to know, at a glance, that a fresh seafood shop had opened.",
        "The signage had to:",
      ],
      needs: ["catch people walking along Douglas Parade from both directions", "mark the main entrance clearly", "use the large side wall to tell people what Dans is about", "carry one strong look in Dans' navy, white and blue brand colours"],
      before: [
        { src: `${dan}/dans-seafood-williamstown-before-blank-lightbox.webp`, alt: "Blank lightbox under the awning at 6/73-83 Douglas Parade, Williamstown, before signage", width: 1600, height: 1200 },
        { src: `${dan}/dans-seafood-williamstown-before-shopfront-entrance.webp`, alt: "Empty shopfront entrance in Williamstown before Dans Seafood Outlet signage", width: 1600, height: 900 },
        { src: `${dan}/dans-seafood-williamstown-before-rear-entry-wall.webp`, alt: "Plain wall above the rear roller-door entry before Dans Seafood Outlet signage", width: 1600, height: 1200 },
      ],
    },
    mockups: {
      title: "Design and mockups",
      intro: "After measuring the site, we prepared a mockup of every sign on photos of the actual shopfront, with exact dimensions, so the client could approve each one before printing.",
      text: ["The design uses Dans' bold navy and blue branding with the tuna logo. On the tall glass panel, we added the message that sums up the business: Fresh. Local. Sustainable. Premium Quality. From ocean to your table."],
      images: [
        { src: `${dan}/dans-seafood-lightbox-mockup-1500x600.webp`, alt: "Mockup of the Dans Seafood Outlet 1500 x 600 mm lightbox", ...mock },
        { src: `${dan}/dans-seafood-entrance-acp-sign-mockup-1800x600.webp`, alt: "Mockup of the Dans Seafood Outlet 1800 x 600 mm ACP sign over the main entrance", ...mock },
        { src: `${dan}/dans-seafood-frosted-glass-vinyl-mockup-1410x3250.webp`, alt: "Mockup of the Dans Seafood Outlet 1410 x 3250 mm print on white frosted glass", ...mock },
        { src: `${dan}/dans-seafood-rear-acp-sign-mockup.webp`, alt: "Mockup of the Dans Seafood Outlet ACP sign over the rear entry", ...mock },
      ],
    },
    specs: {
      title: "Sign specifications",
      columns: ["Sign", "Size (W x H)", "Construction"],
      rows: [
        ["Lightbox (under awning)", "1500 x 600 mm", "Lightbox with full-colour printed vinyl face"],
        ["Frosted-glass graphic (side wall)", "1410 x 3250 mm", "Full-colour vinyl print applied to white frosted glass"],
        ["Main entrance sign", "1800 x 600 mm", "ACP with full-colour vinyl print and laminate"],
        ["Rear entry sign", "Wide-format, to suit wall", "ACP with full-colour vinyl print and laminate"],
      ],
      note: "All prints use full-colour (CMYK) printing on polymeric hi-tack vinyl, finished with a polymeric over-laminate to protect against sun, rain and cleaning.",
    },
    result: {
      title: "The result: a shopfront that sells fresh seafood",
      paragraphs: ["Dans Seafood Outlet now stands out on Douglas Parade. The lightbox catches people walking under the awning, the ACP sign marks the entrance, and the 3.25 m frosted-glass graphic turns a plain side wall into a billboard for the business. Inside, the matching ACP sign over the rear entry keeps the brand consistent throughout."],
      after: [
        { src: `${dan}/dans-seafood-frosted-glass-vinyl-print-williamstown.webp`, alt: "Dans Seafood Outlet full-colour print on white frosted glass, Williamstown", width: 1086, height: 1448 },
        { src: `${dan}/dans-seafood-outlet-acp-sign-rear-entry.webp`, alt: "Dans Seafood Outlet ACP sign above the rear roller-door entry", width: 1448, height: 1086 },
      ],
    },
    // Approved by Abdo (confirmed 24 Nov 2026).
    quote: { text: "We needed the new shop to look the part from day one, and the team delivered. They measured everything, showed us mockups of every sign on photos of our shop, and the finished signs looked exactly like the designs. The big glass sign on the side gets noticed by everyone walking down Douglas Parade. Great service from start to finish, and I'd recommend them to any business opening a new store.", name: "Abdo Abawajii", role: "Dans Seafood Outlet", approved: true },
    why: {
      title: "Why this signage works for a retail food shop",
      points: [
        { label: "Seen from the footpath.", text: "The lightbox sticks out under the awning, where shoppers are already walking." },
        { label: "The message, not just the name.", text: "The glass graphic tells people what makes Dans different before they walk in." },
        { label: "Built to last.", text: "Laminated polymeric vinyl resists fading and handles regular cleaning, which matters for a food business." },
        { label: "Cost-effective impact.", text: "Printed ACP and vinyl deliver full-colour branding at a lower cost than fabricated letters, which suits a new store." },
      ],
    },
    partnerSection: {
      title: "Delivered with our partner brand, QuickNeons",
      paragraphs: ["This project was handled by QuickNeons, one of the Signs N' Wraps partner brands alongside Quick Signage and BannerGuru. Working as one group means every customer gets the right team for the job, with the same measure, mockup and installation process from start to finish."],
    },
    // Word for word with the FAQPage structured data.
    faqs: [
      { question: "What signage does a new retail shop need?", answer: "Most new shops need a main sign over the entrance, a projecting or lightbox sign that people can see while walking along the footpath, and window or glass graphics that say what the business sells. Dans Seafood Outlet in Williamstown used all three." },
      { question: "What is an ACP vinyl print sign?", answer: "An ACP vinyl print sign is an aluminium composite panel covered with a full-colour printed vinyl and a protective laminate. It is rigid, weatherproof and cost-effective, and it reproduces logos and photos in full colour." },
      { question: "Can you print signage onto frosted glass?", answer: "Yes. For Dans Seafood Outlet we printed a 1410 x 3250 mm full-colour graphic on hi-tack polymeric vinyl with a protective laminate and applied it to a white frosted glass panel, turning a blank side wall into a large branded billboard." },
      { question: "How do you make sure a sign fits before it is made?", answer: "We measure the site, then prepare a mockup of every sign on photos of the real shopfront with exact dimensions. The client approves the mockups before anything goes into production." },
      { question: "Do you install signage in Williamstown and Melbourne's west?", answer: "Yes. Williamstown is close to our Laverton North store, and we design, print and install business signage across Melbourne's west, working with our partner brands QuickNeons and Quick Signage." },
    ],
    reels: [],
    cta: { title: "Opening a new shop?", text: "Book a free signage consultation and see mockups of your signs on photos of your own shopfront before anything is made." },
  },
  {
    slug: "southern-services-group-byd-shark-6-ute-fleet-graphics",
    title: "Southern Services Group: Fleet Graphics for Three BYD Shark 6 Utes",
    seoTitle: "BYD Shark 6 Ute Fleet Graphics | Southern Services Case Study",
    metaDescription: "Door logos, icon graphics and tailgate decals for Southern Services Group's three BYD Shark 6 utes, for a repeat customer in Melbourne's west.",
    summary: "Southern Services Group, an electrical contracting company and repeat customer, added three new BYD Shark 6 utes to its fleet. Signs N' Wraps and our signage partner Quick Signage branded all three with 1400 x 375 mm door logos, 350 x 350 mm icon graphics and the company's safety slogan, \"Work Safe, Home Safe, Everyday.\", on every tailgate.",
    client: "Southern Services Group",
    industry: "Electrical contracting",
    location: "Melbourne, VIC",
    service: "Design, mockups, print and installation",
    signageTypes: "Door logos, icon graphics, tailgate slogan decals",
    snapshot: [
      ["Client", "Southern Services Group (southernsg.com.au)"], ["Industry", "Electrical contracting"], ["Vehicles", "3 x BYD Shark 6 utes"],
      ["Graphics", "Door logos, icon graphics, tailgate slogan decals"], ["Material", "Full-colour (CMYK) print on polymeric hi-tack vinyl with polymeric over-laminate"],
      ["Service", "Design, mockups, print and installation"],
    ],
    highlights: [["3 utes", "BYD Shark 6"], ["11 graphics", "doors, quarters, tailgates"], ["Repeat", "fleet customer"]],
    published: "2026-11-24",
    partner: { name: "Quick Signage", url: "https://quicksignage.com.au" },
    category: "Vehicle wraps",
    tags: ["wraps", "vehicle-wraps", "fleet"],
    services: ["Door logo graphics (1400 x 375 mm)", "Icon graphics (350 x 350 mm)", "Tailgate safety slogan decals (950 x 60 mm)", "Design, print and installation"],
    heroPosition: "center 75%",
    featured: { src: `${ssg}/southern-services-group-byd-shark-6-fleet-graphics.webp`, alt: "Southern Services Group BYD Shark 6 utes with door logos, icon graphics and tailgate decals", width: 1600, height: 1200 },
    challenge: {
      title: "The challenge: three new utes, one recognisable fleet",
      paragraphs: [
        "Southern Services Group provides electrical installations, high-voltage infrastructure, communications and maintenance across Melbourne and regional Victoria. Their utes are on the road and on job sites every day, so every vehicle works as a moving billboard.",
        "When they added three brand-new, plain white BYD Shark 6 utes, Southern Services came back to us because we already knew their brand. The new utes needed to:",
      ],
      needs: ["match the look of the rest of the fleet", "show the company name clearly on both sides", "carry the company's safety message to drivers behind them", "be on the road quickly, without a full wrap"],
      before: [
        { src: `${ssg}/byd-shark-6-ute-before-signage-side.webp`, alt: "Plain white BYD Shark 6 ute before fleet signage", width: 1448, height: 1086 },
        { src: `${ssg}/southern-services-group-byd-shark-6-fleet-before-graphics.webp`, alt: "Three new BYD Shark 6 utes for Southern Services Group before graphics", width: 1448, height: 1086 },
        { src: `${ssg}/byd-shark-6-tailgate-before-signage.webp`, alt: "BYD Shark 6 tailgate before signage", width: 1448, height: 1086 },
      ],
    },
    mockups: {
      title: "Design and mockups",
      intro: "We prepared a mockup for each ute showing exactly where every graphic would go and its size. Utes 1 and 2 received matching door logos and tailgate slogans. Ute 3 also received the Southern Services icon on each rear quarter panel for extra visibility.",
      images: [
        { src: `${ssg}/southern-services-group-ute-signage-mockup-utes-1-2.webp`, alt: "Ute signage mockup for Southern Services Group utes 1 and 2", width: 1600, height: 1131 },
        { src: `${ssg}/southern-services-group-ute-signage-mockup-ute-3.webp`, alt: "Ute signage mockup for Southern Services Group ute 3 with icon graphics", width: 1600, height: 1131 },
      ],
    },
    specs: {
      title: "Graphics specifications",
      columns: ["Graphic", "Size (W x H)", "Placement", "Quantity"],
      rows: [
        ["\"Southern Services Group\" door logo", "1400 x 375 mm", "Both sides, all 3 utes", "6"],
        ["Southern Services icon", "350 x 350 mm", "Both rear quarters, ute 3", "2"],
        ["\"Work Safe, Home Safe, Everyday.\" slogan", "950 x 60 mm", "Tailgate, all 3 utes", "3"],
      ],
      note: "All graphics are printed in full colour (CMYK) on polymeric hi-tack vinyl with a polymeric over-laminate, so they handle sun, rain and regular washing.",
    },
    result: {
      title: "The result: a fleet that looks like one team",
      paragraphs: ["All three BYD Shark 6 utes now carry the Southern Services Group brand clearly on both sides, and the tailgate slogan reminds everyone behind them of the company's safety-first values. With white utes and clean navy and blue graphics, the fleet looks professional on every job site and road across Melbourne."],
      after: [
        { src: `${ssg}/southern-services-group-ute-door-logo-signage.webp`, alt: "Southern Services Group logo on the door of a BYD Shark 6 ute", width: 1600, height: 1200 },
        { src: `${ssg}/byd-shark-6-tailgate-decal-work-safe-home-safe.webp`, alt: "Work Safe, Home Safe, Everyday tailgate decal on a BYD Shark 6", width: 1600, height: 1200 },
      ],
    },
    // DRAFT in the source file: hidden until Sam approves it (then set approved: true).
    quote: { text: "We've used the team before, so when our three new BYD Shark 6 utes arrived, we knew who to call. They already had our artwork, showed us a mockup for each ute, and had them branded and back on the road quickly. The graphics match the rest of our fleet perfectly and look sharp on site. Easy to deal with and great quality every time.", name: "Sam Sherwood", role: "Manager, Southern Services Group", approved: false },
    why: {
      title: "Why ute signage works for trade businesses",
      points: [
        { label: "Advertising every day.", text: "A branded ute is seen by other drivers, neighbours and clients on every job." },
        { label: "Instant trust on site.", text: "A clearly signed vehicle tells clients the right contractor has arrived." },
        { label: "Values on show.", text: "A safety slogan on the tailgate tells the public what the business stands for." },
        { label: "Easy to expand.", text: "With artwork and sizes on file, new vehicles can be matched to the fleet quickly." },
      ],
    },
    partnerSection: {
      title: "Built with our signage partner, Quick Signage",
      paragraphs: ["Signs N' Wraps is a proud partner of Quick Signage. For Southern Services Group, the two teams worked together on the mockups, printing and installation."],
    },
    // Word for word with the FAQPage structured data.
    faqs: [
      { question: "Can you put signage on a BYD Shark 6?", answer: "Yes. For Southern Services Group we branded three BYD Shark 6 utes with 1400 x 375 mm door logos, 350 x 350 mm icon graphics and 950 x 60 mm tailgate decals, sized to suit the Shark 6's doors and tailgate." },
      { question: "What is the difference between ute signage and a full wrap?", answer: "Ute signage, also called decals or part graphics, places logos and text on key panels such as the doors and tailgate. A full wrap covers the whole vehicle in printed or coloured film. Signage costs less and suits white work vehicles; a full wrap changes the vehicle's whole look." },
      { question: "How do you keep a work fleet looking consistent?", answer: "We keep each client's artwork and graphic sizes on file and prepare a mockup for every vehicle. When a business adds new vehicles, the graphics match the rest of the fleet exactly, even when the vehicle model changes." },
      { question: "What material is used for vehicle logos and decals?", answer: "Southern Services Group's graphics are printed in full colour (CMYK) on polymeric hi-tack vinyl with a polymeric over-laminate, which protects them from sun, weather and washing." },
      { question: "Do you do fleet graphics in Melbourne's west?", answer: "Yes. Signs N' Wraps designs and installs vehicle signage and wraps from our Laverton North store, working with our signage partner, Quick Signage." },
    ],
    reels: [],
    cta: { title: "Need your work vehicles branded?", text: "Whether it's one ute or a whole fleet, book a free consultation and see mockups of your graphics on your own vehicles before anything is printed." },
  },
  {
    slug: "a-class-fencing-toyota-hilux-ute-signage",
    title: "A Class Fencing Solution: Ute Signage That Works as a Mobile Billboard",
    seoTitle: "Toyota Hilux Ute Signage | A Class Fencing Case Study",
    metaDescription: "Door and bonnet signage on a new Toyota Hilux tray ute for A Class Fencing Solution, a long-time client whose fleet and shopfronts we've branded.",
    summary: "A Class Fencing Solution, a long-time client based in Ravenhall, added a new Toyota Hilux single cab tray ute to its fleet. Signs N' Wraps and our signage partner Quick Signage branded it with door signage on both sides, featuring the logo, the \"Trusted Name in Quality\" tagline, phone numbers and email, plus a bonnet logo decal. We've also branded A Class Fencing's fleet and shopfront signage in Geelong and Ravenhall, so the new ute matches everything else the business owns.",
    client: "A Class Fencing Solution",
    industry: "Fencing and gates",
    location: "Ravenhall, VIC",
    service: "Measure, design, print and installation",
    signageTypes: "Door signage (both sides), bonnet logo",
    snapshot: [
      ["Client", "A Class Fencing Solution (aclassfencingsolution.com.au)"], ["Related business", "A Class Building Materials (aclassbuildingmaterials.com.au)"], ["Industry", "Fencing and gates"],
      ["Vehicle", "Toyota Hilux single cab tray ute"], ["Graphics", "Door signage (both sides), bonnet logo"], ["Service", "Measure, design, print and installation"],
      ["Relationship", "Long-time client: fleet and shopfront signage in Geelong and Ravenhall"],
    ],
    highlights: [["Toyota Hilux", "tray ute signage"], ["Doors + bonnet", "logo and contact details"], ["Long-time", "fleet & shopfront client"]],
    published: "2026-11-24",
    partner: { name: "Quick Signage", url: "https://quicksignage.com.au" },
    category: "Vehicle wraps",
    tags: ["wraps", "vehicle-wraps", "fleet"],
    services: ["Door signage with logo, tagline and contact details (both sides)", "Bonnet logo decal", "Design, print and installation"],
    featured: { src: `${acl}/a-class-fencing-toyota-hilux-ute-signage-side.webp`, alt: "A Class Fencing Solution Toyota Hilux tray ute with door signage, logo and contact details", width: 900, height: 1600 },
    heroPosition: "center 45%",
    challenge: {
      title: "Why vehicle signage matters for a trade business",
      paragraphs: [
        "For a fencing company, the ute is the most visible thing the business owns. It is on the road every day, parked outside clients' homes for hours, and seen by every neighbour who might need a new fence or gate next.",
        "A Class Fencing Solution installs residential, commercial and industrial fencing, gates, landscaping and retaining walls across Victoria. When a brand-new, plain white Hilux joined the fleet, it was a missed opportunity until it carried the brand. The goal was simple: turn the new ute into a mobile billboard that generates calls.",
      ],
      needs: [],
      before: [
        { src: `${acl}/new-toyota-hilux-tray-ute-before-signage.webp`, alt: "New Toyota Hilux tray ute before vehicle signage", width: 1600, height: 1200 },
        { src: `${acl}/toyota-hilux-door-before-vehicle-signage.webp`, alt: "Plain Toyota Hilux door before signage", width: 341, height: 453 },
        { src: `${acl}/toyota-hilux-tray-ute-rear-before-signage.webp`, alt: "Rear of the new Toyota Hilux tray ute before signage", width: 556, height: 413 },
      ],
    },
    design: {
      title: "Design: everything a customer needs, at a glance",
      intro: "We measured the Hilux's doors and bonnet first, so every graphic would sit neatly around the door handles, the HILUX badge and the body lines. The layout follows the rules that make ute signage work:",
      points: [
        { label: "Logo and name first", text: "the red and grey A Class Fencing Solution logo is big enough to read from across the road." },
        { label: "Trust message", text: "the \"Trusted Name in Quality\" tagline sits on a dark banner for contrast." },
        { label: "Two ways to call", text: "the office number (03 8375 1800) and mobile (0406 200 002) in large red figures." },
        { label: "Email for quotes", text: "info@aclassfencingsolution.com.au underneath." },
        { label: "Bonnet logo", text: "visible from the front, in other drivers' mirrors and when the ute is parked nose-out on site." },
      ],
      image: { src: `${acl}/measuring-toyota-hilux-bonnet-for-decal.webp`, alt: "Measuring the Toyota Hilux bonnet for the logo decal", width: 349, height: 463 },
    },
    installation: {
      title: "Installation",
      paragraphs: ["Our installers applied every graphic by hand, using a squeegee to lay the vinyl smooth and bubble-free across the door panels and bonnet."],
      image: { src: `${acl}/vehicle-signage-installation-squeegee-a-class-fencing.webp`, alt: "Applying vinyl contact details to the Hilux door with a squeegee", width: 900, height: 1600 },
      video: { src: `${acl}/a-class-fencing-ute-signage-installation-video.mp4`, poster: `${acl}/a-class-fencing-ute-signage-installation-video-poster.webp`, title: "Installing ute signage on a Toyota Hilux for A Class Fencing", description: "Vinyl contact details being applied to the door of A Class Fencing Solution's new Toyota Hilux tray ute.", width: 720, height: 1280, duration: "PT16S", uploadDate: "2026-11-24" },
    },
    result: {
      title: "The result: a new ute that sells fences",
      paragraphs: ["The new Hilux now carries the A Class Fencing brand on both sides and across the bonnet. Every job it drives to, every street it parks in and every set of traffic lights it stops at is now a chance to win the next customer."],
      after: [
        { src: `${acl}/a-class-fencing-hilux-door-signage-close-up.webp`, alt: "Close-up of A Class Fencing Solution door signage on a Toyota Hilux", width: 900, height: 1600 },
        { src: `${acl}/a-class-fencing-hilux-bonnet-logo-decal.webp`, alt: "A Class Fencing logo decal on the Toyota Hilux bonnet", width: 900, height: 1600 },
        { src: `${acl}/a-class-fencing-branded-hilux-ute-front-angle.webp`, alt: "Branded A Class Fencing Toyota Hilux from the front angle", width: 900, height: 1600 },
        { src: `${acl}/a-class-fencing-hilux-bonnet-graphic-angle.webp`, alt: "A Class Fencing bonnet graphic on the Toyota Hilux, side angle", width: 900, height: 1600 },
      ],
      video: { src: `${acl}/a-class-fencing-branded-hilux-video.mp4`, poster: `${acl}/a-class-fencing-branded-hilux-video-poster.webp`, title: "A Class Fencing Toyota Hilux with finished vehicle signage", description: "Walk-around of A Class Fencing Solution's Toyota Hilux tray ute with door signage and bonnet logo.", width: 720, height: 1280, duration: "PT8S", uploadDate: "2026-11-24" },
    },
    relationship: {
      title: "A long-term signage partner",
      intro: "A Class Fencing Solution has trusted us with its branding for years. Beyond this ute, we've delivered:",
      items: [{ label: "Fleet signage", text: "across their work vehicles" }, { label: "Shopfront signage", text: "for their Geelong location" }, { label: "Shopfront signage", text: "for their Ravenhall premises" }],
      outro: "Because we keep their artwork, colours and sizes on file, every new vehicle can be matched to the rest of the fleet quickly, with no need to start the design from scratch.",
    },
    why: {
      title: "5 reasons to put signage on your work ute",
      points: [
        { label: "It advertises 24/7.", text: "Your ute promotes your business while you're driving, working and even when it's parked at home." },
        { label: "One-off cost, years of exposure.", text: "Unlike paid ads, you pay once and quality vinyl signage keeps working for years." },
        { label: "Local reach where you work.", text: "Your ute is seen by homeowners and businesses in the exact suburbs you service." },
        { label: "Instant credibility.", text: "A professionally signed vehicle tells clients you're an established, trustworthy business." },
        { label: "Easy to call.", text: "Large phone numbers mean people can call while they're still looking at your ute." },
      ],
    },
    partnerSection: {
      title: "Built with our signage partner, Quick Signage",
      paragraphs: ["Signs N' Wraps is a proud partner of Quick Signage. Together we have looked after A Class Fencing Solution's fleet and shopfront signage in both Geelong and Melbourne's west."],
    },
    // Word for word with the FAQPage structured data.
    faqs: [
      { question: "Is ute signage worth it for a small business?", answer: "Yes. A signed ute advertises your business everywhere it goes: on the road, parked at job sites and outside your clients' homes. Unlike online ads, you pay once and the signage keeps working every day for years." },
      { question: "What should go on a work ute?", answer: "Keep it simple: your logo, what you do, a phone number and a website or email, in large, high-contrast text that can be read from a distance. A bonnet logo adds visibility from the front, in mirrors and when parked nose-out." },
      { question: "Can you put signage on a new Toyota Hilux?", answer: "Yes. For A Class Fencing Solution we branded a new Toyota Hilux tray ute with door signage on both sides and a bonnet logo. We measure each panel first so the graphics sit neatly around the door handles, badges and body lines." },
      { question: "How long does it take to put signage on a ute?", answer: "Door and bonnet signage on a single ute is usually fitted within a day once the artwork is approved, so the vehicle is back at work quickly. Larger graphics, part wraps and full wraps take longer." },
      { question: "Do you do vehicle signage in Melbourne's west and Geelong?", answer: "Yes. Signs N' Wraps designs and installs vehicle signage, fleet graphics and wraps from our Laverton North store, close to Ravenhall, and in Geelong with our signage partner, Quick Signage." },
    ],
    reels: [],
    cta: { title: "Turn your ute into a mobile billboard", text: "Whether it's one new ute or your whole fleet, book a free consultation. We'll measure your vehicle and show you a mockup of your signage before anything is printed." },
  },
];

export const getCaseStudy = (slug: string) => caseStudies.find((item) => item.slug === slug);

/** Case studies tagged for a page, newest first. */
export const caseStudiesFor = (tag: string, limit = 3) => caseStudies.filter((item) => item.tags.includes(tag)).sort((a, b) => b.published.localeCompare(a.published)).slice(0, limit);
