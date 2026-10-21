# Signsnwraps website project guide

- Project: Next.js App Router, TypeScript, Tailwind CSS. Hosted on Firebase App Hosting (GCP); Firestore, Cloud Storage and Firebase Auth via the Admin SDK; Stripe Checkout for payments.
- Brand palette (see `docs/Signsnwraps Brand Book new theme.html`, light theme): Ice Blue `#E3ECF6` page/hero backgrounds, Mist Grey `#E5E5E6` alternate sections/panels, white cards, Ink Navy `#13233A` for text (replaces black; black only for one-colour print), Electric Blue `#03AAFA` for CTAs (navy text), logo and highlights. Small blue text uses `--electric-blue-ink` `#026BA3`, large blue display text `--electric-blue-display` `#0284C7`. Colours live in `src/app/theme-light.css`, shapes/depth in `src/app/spatial.css`.
- Logo: use the supplied artwork only. On light backgrounds (header, share image) use the black + blue logo (`Assets/logo-black-blue.png`, master `Assets/Logos/logo final-black-blue.png`) and `Assets/lion-icon-black-blue.png` below 150px; on navy (footer) use the white + blue reverse logo (`Assets/logo-white-blue.png`). Never recolour, redraw or add effects.
- Use local Inter Variable; bold, clean, precise, premium automotive imagery and sharp crops. Avoid generic decoration, gradients, invented marks, and recreating the logo manually.
- Brand voice: confident, expert, clear, approachable. Lead with “Expert Advice. Bold Results.” / “Stand Out.” and “Make Your Brand Stand Out.”
- Primary CTA: “Book an In-Store Consultation”; secondary CTA: outlined “Get a Quote”.
- Keep the consultation booking CTA prominent; the sticky header compacts on scroll and mobile keeps a visible booking action.
- Keep structured content in `src/lib/data` and reusable UI in `src/components`.
- Keep the two site experiences distinct: `/signs` for Signs/Print; `/wraps` for vehicle wraps, studio PPF and PPF kits. Keep the high-contrast Signs | Wraps header selector recognizable on desktop and mobile.
- Keep all pages mobile-first and accessible. Only the Wraps side sells online (`/wraps/shop`, kit pages, `/wraps/cart`); the Signs side stays enquiry-only. Do not imply a verified fitment catalogue or certified installer network.
- Shop rules: products and orders are only read/written on the server (`src/lib/shop`, `src/lib/firebase/admin.ts`); never trust client prices. Orders are created only by the Stripe webhook. Admin pages and actions must call `requireAdmin()`.
- Keep booking, CRM, and quote integrations behind server-side service abstractions; do not imply that Odoo is connected until configured.
- Run `npm run typecheck`, `npm run lint`, and `npm run build` after significant changes.

## Progress
- [x] Requirements clarified from the supplied brief.
- [x] Next.js project scaffolded manually after the folder's uppercase name was rejected by create-next-app.
- [x] Website pages and shared UI built for split Signs and Wraps home paths, service/kit discovery, vehicle finder routes, work, advice, booking, quote, location, company and legal pages.
- [x] Structured content, route metadata, lead attribution, analytics hooks, API validation, and CRM/booking/quote service abstractions added; no commerce, patterns or installer network represented as live.
- [x] TypeScript, lint, and production build checks completed; README includes setup and launch-readiness notes.
- [x] Wraps online shop: Firestore product catalogue, browser cart, Stripe Checkout (guest), webhook order recording with stock, staff admin for products and orders.

## Launch readiness
- Replace the sample Unsplash photography and project stories with approved Signsnwraps assets and verified case studies.
- The supplied brand-book PDF shows logo placeholders, while official artwork files are available in `Assets`; confirm those supplied logo files are the approved current master artwork before launch. Do not recreate the lion or wordmark manually.
- Verify every starter vehicle make/model/year against the actual plotter/pattern supplier catalogue; replace illustrative listings and colour swatches with confirmed kit data before sale.
- Replace or confirm the sample product catalogue (prices, stock, fitment), review the draft shipping & returns terms, and switch Stripe to live keys before taking real orders.
- Confirm the full street address, phone number, email, opening hours, social links, and location-specific service coverage.
- Connect secure booking availability, quote persistence/file storage, notifications, spam protection, and the CRM/Odoo adapter before accepting enquiries.
- Replace preliminary legal copy with reviewed policies and terms; test real devices, form delivery, analytics consent, and production domain metadata before launch.
