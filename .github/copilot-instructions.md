# Signsnwraps website project guide

- Project: Next.js App Router, TypeScript, Tailwind CSS.
- Brand palette: electric blue `#03AAFA`, brand black `#000000`, and white only. Follow the 60/30/10 ratio: black/dark foundations, white content, blue recognition and CTAs.
- Use local Inter Variable; bold, clean, precise, premium automotive imagery and sharp crops. Avoid generic decoration, gradients, invented marks, and recreating the logo manually.
- Brand voice: confident, expert, clear, approachable. Lead with “Expert Advice. Bold Results.” / “Stand Out.” and “Make Your Brand Stand Out.”
- Primary CTA: “Book an In-Store Consultation”; secondary CTA: outlined “Get a Quote”.
- Keep the consultation booking CTA prominent; the sticky header compacts on scroll and mobile keeps a visible booking action.
- Keep structured content in `src/lib/data` and reusable UI in `src/components`.
- Keep the two site experiences distinct: `/signs` for Signs/Print; `/wraps` for vehicle wraps, studio PPF and PPF kits. Keep the high-contrast Signs | Wraps header selector recognizable on desktop and mobile.
- Keep all pages mobile-first and accessible; the Wraps side supports kit discovery and fitting paths but does not imply a live checkout, verified fitment catalogue or certified installer network.
- Keep booking, CRM, and quote integrations behind server-side service abstractions; do not imply that Odoo is connected until configured.
- Run `npm run typecheck`, `npm run lint`, and `npm run build` after significant changes.

## Progress
- [x] Requirements clarified from the supplied brief.
- [x] Next.js project scaffolded manually after the folder's uppercase name was rejected by create-next-app.
- [x] Website pages and shared UI built for split Signs and Wraps home paths, service/kit discovery, vehicle finder routes, work, advice, booking, quote, location, company and legal pages.
- [x] Structured content, route metadata, lead attribution, analytics hooks, API validation, and CRM/booking/quote service abstractions added; no commerce, patterns or installer network represented as live.
- [x] TypeScript, lint, and production build checks completed; README includes setup and launch-readiness notes.

## Launch readiness
- Replace the sample Unsplash photography and project stories with approved Signsnwraps assets and verified case studies.
- The supplied brand-book PDF shows logo placeholders, while official artwork files are available in `Assets`; confirm those supplied logo files are the approved current master artwork before launch. Do not recreate the lion or wordmark manually.
- Verify every starter vehicle make/model/year against the actual plotter/pattern supplier catalogue; replace illustrative listings and colour swatches with confirmed kit data before sale.
- Confirm ecommerce platform, product prices, kit warranty, shipping/returns policy and checkout integration before enabling purchases.
- Confirm the full street address, phone number, email, opening hours, social links, and location-specific service coverage.
- Connect secure booking availability, quote persistence/file storage, notifications, spam protection, and the CRM/Odoo adapter before accepting enquiries.
- Replace preliminary legal copy with reviewed policies and terms; test real devices, form delivery, analytics consent, and production domain metadata before launch.
