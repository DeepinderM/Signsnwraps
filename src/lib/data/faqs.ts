import type { Faq } from "@/lib/seo";

// Page FAQs, written answer-first for search snippets and AI answer engines.
// Rules: lead with the direct answer, stay factual, don't promise prices, timeframes or warranties we haven't confirmed.

type PageFaqs = { title: string; intro: string; items: Faq[] };

export const pageFaqs = {
  home: {
    title: "Signsnwraps, answered.",
    intro: "Signsnwraps is a signage, printing, vehicle wrap and paint protection film studio in Laverton North, Melbourne. One team plans, produces and installs your signs, prints, wraps and protection.",
    items: [
      { question: "What does Signsnwraps do?", answer: "Signsnwraps designs, produces and installs commercial signage, shopfronts, printing, neon and fleet signage, and fits vehicle wraps, fleet wraps and paint protection film (PPF). It also sells pre-cut PPF kits, colour PPF and install tools online." },
      { question: "Where is Signsnwraps located?", answer: "The studio is in Laverton North, in Melbourne's west, Victoria 3026. Consultations are by appointment, and the team works with businesses and vehicle owners across Melbourne, Geelong and wider Victoria." },
      { question: "How do I get started?", answer: "Book an in-store consultation to talk through your project, or send the details through the quote form. Photos, sizes, quantities and timing help the team give you accurate advice." },
      { question: "Can I buy PPF kits online?", answer: "Yes. Pre-cut PPF kits for popular utes, 4WDs, SUVs and cars, plus colour PPF, universal protection pieces and tools, can be ordered online with Australia-wide shipping or free click and collect in Laverton North." },
    ],
  },
  signs: {
    title: "Signage questions, answered.",
    intro: "Signsnwraps plans, makes and installs signage and print for businesses in Melbourne: shopfronts, building signs, illuminated and neon signs, banners, window graphics and fleet signage.",
    items: [
      { question: "What types of signage do you make?", answer: "Shopfront and building signs, illuminated and 3D signs, neon, wayfinding and safety signs, window, wall and floor graphics, banners and event displays, and vehicle and fleet signage." },
      { question: "Do I need a permit for a business sign in Victoria?", answer: "Often, yes. Many business signs need a planning permit from the local council under the sign rules in Victorian planning schemes (Clause 52.05). Requirements depend on the zone, size, illumination and location, so check with your council early. We can help you prepare sign details for an application." },
      { question: "Do you install signage as well as make it?", answer: "Yes. Projects can include a site measure, production and installation. Access, mounting surface and any electrical work are confirmed during planning." },
      { question: "How much does a business sign cost?", answer: "It depends on size, materials, illumination, quantity and installation access. Send your details through the quote form or book a consultation for a tailored quote." },
    ],
  },
  signage: {
    title: "Commercial signage, answered.",
    intro: "Commercial signage covers the signs that identify and promote a business: shopfront and building signs, illuminated and 3D signs, wayfinding and safety signs. Signsnwraps plans, fabricates and installs them in Melbourne.",
    items: [
      { question: "What should I consider before ordering a business sign?", answer: "Where people will see it from and how far away, what they need to read in a few seconds, the conditions it must withstand, whether it should be illuminated, council permit requirements, and how it will be mounted and installed." },
      { question: "What materials are business signs made from?", answer: "Common options include aluminium composite panels, acrylic, routed and fabricated 3D letters, printed vinyl and lightboxes. The right choice depends on the look, budget, location and how long the sign needs to last." },
      { question: "Do business signs need a planning permit?", answer: "Many do. In Victoria, sign permits are handled by your local council under Clause 52.05 of the planning scheme. Illuminated, large or high-mounted signs are more likely to need one, so check before production." },
      { question: "Can you match signs to our brand guidelines?", answer: "Yes. Supply your logo files and brand guidelines and the signs are produced to match your colours and typography, with a proof to approve before production." },
    ],
  },
  shopfronts: {
    title: "Shopfronts, answered.",
    intro: "A shopfront brings together the fascia sign, window graphics, door details and lighting into one first impression. Signsnwraps plans and installs complete storefronts for retail, hospitality and service businesses in Melbourne.",
    items: [
      { question: "What is included in a shopfront signage package?", answer: "Usually a main fascia or building sign, window graphics or frosting, door signage with hours and contact details, and sometimes illuminated or projecting signs. The mix depends on the site and what customers need to see." },
      { question: "What are window graphics?", answer: "Vinyl applied to glass, such as printed graphics, cut lettering, frosted privacy film or one-way vision film that shows a print outside while keeping a view from inside." },
      { question: "Will a new shopfront need landlord or council approval?", answer: "Often. Many leases require landlord approval for signage, and some signs need a council planning permit. It's worth confirming both before production." },
      { question: "Can you install outside business hours?", answer: "Installation timing is planned around the site. Talk to us about access, trading hours and any centre management requirements when you book." },
    ],
  },
  printing: {
    title: "Printing, answered.",
    intro: "Signsnwraps prints banners, posters, stickers, labels and wall, window and floor graphics for campaigns, events and branded spaces in Melbourne, with installation available for graphics.",
    items: [
      { question: "What can you print?", answer: "Vinyl and mesh banners, pull-up banners and event displays, posters, stickers and labels, and wall, window and floor graphics." },
      { question: "What file format should I send for printing?", answer: "Print-ready PDF or vector files (AI, EPS or PDF) are best. Include bleed, outline your fonts and supply images at full size. If you're unsure, send what you have and we'll check it." },
      { question: "What's the difference between vinyl and mesh banners?", answer: "Vinyl banners give the sharpest, most solid print. Mesh banners have small holes that let wind through, so they suit fences and windy outdoor sites." },
      { question: "Can you install wall and window graphics?", answer: "Yes. Graphics can be supplied ready to apply or installed by our team. Surface type and condition affect which material and adhesive we recommend." },
    ],
  },
  neon: {
    title: "Neon signs, answered.",
    intro: "Neon and illuminated signs make a business visible after dark and add a feature to interiors. Signsnwraps creates LED neon, lightboxes and illuminated letters for retail, hospitality and branded spaces.",
    items: [
      { question: "Is a modern neon sign real glass neon?", answer: "Most modern neon-style signs use LED neon flex, which looks similar to glass neon but runs cooler, uses less power and is more durable. Ask us if you specifically need traditional glass neon." },
      { question: "Can neon signs be used outdoors?", answer: "Some can. Outdoor signs need weather-rated components and suitable mounting, and illuminated signs may need a council permit. Tell us where the sign will go when you enquire." },
      { question: "Can you make a neon sign from my logo?", answer: "Often, yes. Simple line-based logos and lettering translate best. We'll review your artwork and suggest any adjustments needed for it to read well when lit." },
    ],
  },
  wraps: {
    title: "Wraps and PPF, answered.",
    intro: "Signsnwraps wraps and protects vehicles at its Laverton North studio: colour-change and commercial wraps, fleet branding and paint protection film (PPF), plus pre-cut PPF kits you can fit yourself.",
    items: [
      { question: "What's the difference between a vehicle wrap and PPF?", answer: "A vehicle wrap is a coloured or printed vinyl film that changes how the vehicle looks. Paint protection film (PPF) is a clear or coloured urethane film designed to protect the paint from stone chips, scratches and stains." },
      { question: "Can I fit PPF myself?", answer: "Yes, with a pre-cut kit made for your vehicle, patience and the right tools. Complex panels are harder, so many owners choose a studio fit instead. Compare the options before you buy." },
      { question: "Do you wrap and protect commercial fleets?", answer: "Yes. Fleet wraps, livery design and fleet PPF are planned so every vehicle stays consistent, with installs scheduled around your roster." },
      { question: "Where can I get my vehicle wrapped or protected?", answer: "At the Signsnwraps studio in Laverton North, Melbourne. Book a consultation to talk through finish, coverage and timing." },
    ],
  },
  vehicleWraps: {
    title: "Vehicle wraps, answered.",
    intro: "A vehicle wrap is a vinyl film applied over the original paint to change its colour or add printed branding. It can be removed later, and quality films help protect the paint underneath. Signsnwraps wraps cars, utes, vans and trucks in Laverton North, Melbourne.",
    items: [
      { question: "How much does a vehicle wrap cost?", answer: "It depends on the vehicle's size and shape, full or partial coverage, the film and finish, and design work. We quote after confirming the vehicle and what you want to achieve." },
      { question: "How long does a car wrap last?", answer: "Quality cast wrap films commonly last several years. Sun exposure, washing habits and the film you choose all affect it, so we'll recommend a film suited to how the vehicle is used." },
      { question: "Will a wrap damage my paint?", answer: "On original factory paint in good condition, quality films are designed to be removed cleanly when removed correctly. Resprayed, chipped or damaged paint can lift with the film, so we check the paint first." },
      { question: "Full wrap or partial wrap: which should I choose?", answer: "A full wrap changes the whole look or carries branding on every panel. A partial wrap uses the paint colour as part of the design and costs less. The right choice depends on your goal, vehicle and budget." },
      { question: "How should I wash a wrapped vehicle?", answer: "Hand wash with a pH-neutral car wash, avoid harsh brushes and high-pressure water close to edges, and clean off bird droppings and fuel spills quickly." },
    ],
  },
  ppf: {
    title: "Colour PPF, answered.",
    intro: "Colour PPF is a coloured paint protection film that changes the colour or finish of a vehicle and protects the paint underneath from stone chips and scratches. Signsnwraps fits colour PPF in its studio; clear PPF is available as pre-cut DIY kits.",
    items: [
      { question: "What is colour PPF?", answer: "Colour PPF is paint protection film with a colour or finish built in. Like clear PPF it is a tough urethane film that protects against stone chips and scratches, but it also changes how the vehicle looks, in gloss, satin or matte." },
      { question: "Colour PPF or vinyl wrap: what's the difference?", answer: "Both change the vehicle's colour. Colour PPF is thicker and designed to absorb stone chips, and many films are self-healing. Vinyl wraps are thinner and mostly cosmetic, with the widest choice of colours and printed designs at a lower cost." },
      { question: "Can I get clear PPF?", answer: "Yes. Clear PPF is available as pre-cut DIY kits for popular utes, 4WDs, SUVs and cars, so you can protect high-impact areas such as the bonnet, bumper, mirrors and headlights yourself." },
      { question: "Can you do part of the car in colour PPF?", answer: "Yes. Besides a full colour change, popular options include the roof, bonnet, mirrors, pillars and trim accents." },
      { question: "How long does colour PPF last?", answer: "It depends on the film, sun exposure and care. Ask us for the current manufacturer specifications and warranty for the film you choose." },
      { question: "Can colour PPF be removed?", answer: "Yes. Quality colour PPF is designed to come off original factory paint cleanly when removed correctly, leaving the protected paint underneath." },
    ],
  },
  kits: {
    title: "PPF kits, answered.",
    intro: "A pre-cut PPF kit is clear paint protection film cut to the shape of specific panels on a specific vehicle, so you can protect high-impact areas without cutting film on the paint. Signsnwraps sells kits for popular Australian utes, 4WDs, SUVs and cars.",
    items: [
      { question: "What is a pre-cut PPF kit?", answer: "Paint protection film already cut to fit particular panels of your make, model and year, such as the bonnet edge, bumper, mirrors, door cups or headlights. It removes the need to trim film on the vehicle." },
      { question: "How do I know a kit will fit my vehicle?", answer: "Choose your make, model and year in the kit finder, then check the trim and body variant. Bumpers, sensors and accessories can differ between variants. If you're unsure, ask us before ordering." },
      { question: "What do I need to install a PPF kit?", answer: "A clean, dust-free space, slip solution, tack solution, a soft squeegee, lint-free cloths and patience. Our install kit includes the basics, and the install guide walks through the process." },
      { question: "Can Signsnwraps fit the kit for me?", answer: "Yes. Book a studio fit at Laverton North if you'd rather have a professional install, especially for larger or more complex panels." },
    ],
  },
  shop: {
    title: "Ordering online, answered.",
    intro: "Order PPF kits, colour PPF, protection pieces and install tools online and pay securely by card through Stripe. Orders ship Australia-wide or can be collected free from Laverton North.",
    items: [
      { question: "How much is shipping?", answer: "Standard shipping within Australia is a flat $15 per order and free on orders over $250. Click and collect from Laverton North is free." },
      { question: "How long does delivery take?", answer: "Vehicle kits are cut to order and usually dispatch within 3–5 business days. In-stock items usually dispatch within 1–2 business days, then delivery time depends on your location." },
      { question: "Why do I need an account to see prices?", answer: "Prices are shown to account holders only. Log in or create a free account and you'll see prices for every kit, film and tool, and can order online." },
      { question: "Are prices in Australian dollars and include GST?", answer: "Yes. All prices are in AUD and include GST." },
      { question: "Can I return a PPF kit?", answer: "Unused, unopened items can be returned within 30 days. Cut-to-order vehicle kits can't be returned once the backing is removed unless faulty or not matching the vehicle they were sold for. See shipping and returns for details." },
    ],
  },
  compare: {
    title: "Choosing a fitting option, answered.",
    intro: "You can fit a pre-cut PPF kit yourself, have it fitted at the Signsnwraps studio in Laverton North, or ask about installer options. The best choice depends on your experience, the panels and how perfect you need the edges.",
    items: [
      { question: "Is DIY PPF installation hard?", answer: "Small, flat pieces such as door cups and headlights are manageable for a careful first-timer. Bonnets and bumpers are harder because film has to be stretched and positioned without trapping dust or creasing." },
      { question: "What's the advantage of a professional PPF install?", answer: "Experience with stretching, edges and difficult curves, a controlled clean environment, and the ability to wrap edges where the vehicle and pattern allow." },
    ],
  },
  installers: {
    title: "Installers, answered.",
    intro: "The Signsnwraps installer network is still being developed. Right now, professional fitting of Signsnwraps PPF kits is available at the Laverton North studio.",
    items: [
      { question: "Is there a Signsnwraps installer near me?", answer: "Not yet outside Laverton North. Contact us with your suburb and vehicle and we'll tell you what fitting options we can confirm." },
      { question: "Can I become a Signsnwraps installer?", answer: "Applications aren't open yet. Register your interest by email and we'll share details once program requirements and training are finalised." },
    ],
  },
  location: {
    title: "Visiting the studio, answered.",
    intro: "The Signsnwraps studio is in Laverton North, in Melbourne's west. Consultations are by appointment so the right person is available to talk through your signage, wrap or PPF project.",
    items: [
      { question: "Do I need an appointment?", answer: "Yes, please book a consultation so the right team member is available and can prepare samples for your project." },
      { question: "Which areas do you service?", answer: "Laverton North and Melbourne's western suburbs, greater Melbourne and Geelong. Regional Victorian and multi-site projects can be discussed." },
      { question: "What should I bring to a consultation?", answer: "Photos or plans of the site or vehicle, approximate sizes, your logo or artwork, examples you like and your timing." },
    ],
  },
  services: {
    title: "Our services, answered.",
    intro: "Signsnwraps offers commercial signage, printing and banners, vehicle wraps, paint protection film, multi-site brand rollouts and signage maintenance, all coordinated by one team in Laverton North, Melbourne.",
    items: [
      { question: "Can one company handle signage and vehicle branding together?", answer: "Yes. Signsnwraps handles signs, print, vehicle wraps and protection, so your shopfront, fleet and printed material can be planned to match." },
      { question: "Do you work with multi-site businesses?", answer: "Yes. Brand rollouts cover site surveys, specifications, production, logistics and installation so every location stays consistent." },
    ],
  },
  quote: {
    title: "Quotes, answered.",
    intro: "Send your project details and the Signsnwraps team will review them and reply with questions or a quote. The more detail you include, the more accurate the quote.",
    items: [
      { question: "What information do you need for a quote?", answer: "What you need made, approximate sizes and quantities, where it will be installed, your timing, and any artwork, photos or reference images." },
      { question: "Am I committed once I request a quote?", answer: "No. A quote request or consultation comes with no obligation to go ahead." },
    ],
  },
} satisfies Record<string, PageFaqs>;

export type PageFaqKey = keyof typeof pageFaqs;
