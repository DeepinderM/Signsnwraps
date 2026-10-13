# SIGNSNWRAPS website

Premium, mobile-first website for SIGNSNWRAPS, built with Next.js App Router, TypeScript, Tailwind CSS and locally bundled Inter Variable. The supplied brand book guides the electric-blue `#03AAFA`, black `#000000`, and white palette. Site navigation now separates two experiences under the shared brand: `/signs` for signs and print, `/wraps` for vehicle wraps, studio PPF and DIY kit discovery. The first configured location is Laverton North; content is data-driven for expansion.

## Development

- `npm install`
- `npm run dev` to start the local development server
- `npm run typecheck`, `npm run lint` and `npm run build` for validation

## Integrations

Booking, quote and CRM adapters live under `src/lib/services`. Current API routes validate requests, then return a clear unavailable response because they do not persist customer data or connect to Odoo. Configure secure server-side persistence, real calendar availability, private upload storage, spam protection, notification delivery and Odoo credentials before production launch. Appointment dates/times shown are preferred-time examples, not live availability.

## Content and launch readiness

Structured content lives in `src/lib/data`. The supplied official logo artwork in `Assets/logo1.png` is used in the shared header and footer. Replace sample Unsplash photography and illustrative project stories with approved Signsnwraps images and verified case studies. The Wraps fitment examples, colour swatches and kit sections are discovery prototypes only; confirm pattern availability, year/trim compatibility, film specifications, pricing, warranty and stock before enabling sales. No cart checkout or installer network is live. Confirm the full business address, phone, email, hours, social links, legal copy and domain before publishing.

Signs-only partner logos are bundled from `Assets/Logos` and display with accessible typographic fallbacks if an image cannot load. The partner feature is intentionally not rendered in the `/wraps` experience.
