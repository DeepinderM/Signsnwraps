# SIGNSNWRAPS website

Premium, mobile-first website for SIGNSNWRAPS, built with Next.js App Router, TypeScript, Tailwind CSS and locally bundled Inter Variable. The brand book (`docs/Signsnwraps Brand Book.pdf`) sets the palette: Electric Blue `#03AAFA`, black `#000000` and white, with a darker `#0275B0` used only for small blue text on light backgrounds. Buttons use black text on blue for legibility. Site navigation now separates two experiences under the shared brand: `/signs` for signs and print, `/wraps` for vehicle wraps, studio PPF and DIY kit discovery. The first configured location is Laverton North; content is data-driven for expansion.

## Development

- `npm install`
- `npm run dev` to start the local development server
- `npm run typecheck`, `npm run lint` and `npm run build` for validation

## Integrations

Booking and quote requests from every form (including the fleet pages at `/signs/fleet` and `/wraps/fleet`, which share `src/components/fleet`) are validated by `/api/bookings` and `/api/quotes` and saved to the Firestore `enquiries` collection, with attachments in Cloud Storage under `enquiries/{id}/`. Staff work through them at `/admin/enquiries` (status, internal notes, attachment downloads). Appointment times are the customer's preferred time; staff confirm the actual time with them. A hidden honeypot field filters basic spam bots. To get an email for each new request, install the Firebase **Trigger Email from Firestore** extension and set `ENQUIRY_NOTIFY_EMAIL`. The Odoo CRM adapter (`src/lib/services/crm.ts`) is still a placeholder.

## Wraps online shop (Firebase + Stripe)

Only the `/wraps` side sells online. Customers add PPF kits, colour film, universal pieces and tools to a cart, choose shipping (flat $15 AU, free over $250) or click & collect at Laverton North, and pay with Stripe Checkout as a guest.

| Piece | Where |
| --- | --- |
| Hosting | Firebase App Hosting (Next.js on Cloud Run in the GCP project), configured by `apphosting.yaml` |
| Products & orders | Cloud Firestore `products` and `orders` collections, read and written only by the server via the Admin SDK (`firestore.rules` denies all browser access) |
| Product photos | Cloud Storage for Firebase, uploaded from the admin page |
| Staff sign-in | Firebase Authentication (Google), allow-listed by `ADMIN_EMAILS`, stored as an httpOnly `__session` cookie |
| Payments | Stripe Checkout (`/api/checkout`), orders recorded by the webhook (`/api/stripe/webhook`) |

How an order flows: the cart lives in the browser (`localStorage`). At checkout, `/api/checkout` re-prices every line from Firestore, checks stock, and creates a Stripe Checkout Session; the browser never sets prices. When Stripe sends `checkout.session.completed`, the webhook creates `orders/{sessionId}` and decrements tracked stock in one transaction. It is idempotent, so Stripe retries are safe. If stock ran out between checkout and payment, the order is flagged with a stock issue in the admin.

Staff use `/admin` to add/edit products (price, stock, photo, live/hidden), load the sample catalogue, and work through orders (status, tracking number, internal note). Refunds are issued in the Stripe dashboard.

The sample catalogue (`src/lib/shop/sample-catalog.ts`) contains placeholder prices and is labelled "sample listing" on the site. Confirm pattern fitment, prices and stock, and untick "Sample listing" (or replace the products) before launch. While `STRIPE_SECRET_KEY` is a test key, the shop shows a test-mode banner.

### First-time setup

1. **Firebase project.** In the [Firebase console](https://console.firebase.google.com) create a project (Blaze plan, which App Hosting requires) and add a Web app. Enable **Firestore** (production mode, region `australia-southeast1`), **Storage**, and **Authentication → Google** sign-in.
2. **CLI.** `brew install firebase-cli`, then `firebase login` and `firebase use --add` to select the project.
3. **Rules.** `firebase deploy --only firestore,storage`.
4. **App Hosting backend.** `firebase apphosting:backends:create` (region `asia-southeast1` or the nearest available). Connect it to this GitHub repository and the `main` branch for automatic deploys on push, or deploy from your machine with `firebase deploy --only apphosting`.
5. **Secrets.** Create the Stripe secrets the backend reads:
   `firebase apphosting:secrets:set stripe-secret-key` (Stripe secret key, `sk_test_...` until launch)
   `firebase apphosting:secrets:set stripe-webhook-secret` (from step 6)
6. **Stripe webhook.** Stripe Dashboard → Developers → Webhooks → add endpoint `https://<your-site>/api/stripe/webhook` with events `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Copy its signing secret into `stripe-webhook-secret`.
7. **Settings.** In `apphosting.yaml` set `ADMIN_EMAILS` to the staff Google accounts and `NEXT_PUBLIC_SITE_URL` to the live URL (use the `*.hosted.app` URL until the custom domain is connected). Under Authentication → Settings → Authorized domains, add the `*.hosted.app` domain and the custom domain.
8. Deploy, sign in at `/admin`, and click **Load sample catalogue** (or add products yourself). Place a test order with card `4242 4242 4242 4242`.

If the server logs permission errors from Firestore, Storage or Auth, give the App Hosting runtime service account (`firebase-app-hosting-compute@<project>.iam.gserviceaccount.com`) the roles *Cloud Datastore User*, *Storage Object Admin* and *Firebase Authentication Admin*.

To go live: switch both secrets to live-mode Stripe keys (create a live webhook endpoint), confirm prices and stock, and review the shipping & returns copy at `/shipping-returns`.

### Local development

Copy `.env.example` to `.env.local` and fill it in, then sign in with `gcloud auth application-default login` (or set `FIREBASE_SERVICE_ACCOUNT_KEY`). To receive webhooks locally, run `stripe listen --forward-to localhost:3000/api/stripe/webhook` and put the `whsec_...` it prints in `STRIPE_WEBHOOK_SECRET`.

To work fully offline against the Firebase emulators (requires Java: `brew install openjdk@21`):

```
firebase emulators:start --project demo-signsnwraps --only auth,firestore,storage
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199 NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-signsnwraps npm run dev
```

## SEO & answer engines

- **Metadata:** every page uses `pageMetadata()` from `src/lib/seo.ts` (title, description, canonical, Open Graph/Twitter). The default share image is generated by `src/app/opengraph-image.tsx`.
- **Structured data:** the root layout outputs Organization, WebSite and LocalBusiness (`siteGraph()`); pages add Service, FAQPage, Product, HowTo and BreadcrumbList via the builders in `src/lib/seo.ts` and `<JsonLd>`. Breadcrumbs (visible + schema) come from the URL in `src/components/seo/breadcrumbs.tsx`.
- **Answer-first FAQs:** page FAQs live in `src/lib/data/faqs.ts` and render with `<FaqSection>`. Lead with the direct answer; don't add prices, timeframes or guarantees that haven't been confirmed.
- **One URL per page:** `/services/{signage,printing,vehicle-wraps,ppf}` and `/wraps/film` redirect (see `next.config.ts`); vehicle kit year variants and `/wraps/shop/kit-*` canonicalise to `/wraps/kits/{make}/{model}/{coverage}`. The sitemap lists canonical URLs only.
- **AI crawlers:** `/llms.txt` summarises the business and key pages; `robots.txt` allows all public pages.
- **Before launch:** add the real phone number to `SITE.telephone` in `src/lib/seo.ts`, confirm opening hours there, and submit the sitemap in Google Search Console and Bing Webmaster Tools. Create a Google Business Profile with the same name, address and phone.

## Content and launch readiness

Structured content lives in `src/lib/data`. The master logos are `Assets/Logos/logo final-white-blue.png` (reverse, for dark backgrounds) and `Assets/Logos/logo final-black-blue.png` (for light backgrounds). The site uses trimmed web copies: `Assets/logo-white-blue.png` in the black header and footer, `Assets/logo-black-blue.png` on the share image, and the lion from the white master (`Assets/lion-icon-white-blue.png`) as the small-screen header mark; the favicon (`src/app/icon.png`) is that lion on black. Replace sample Unsplash photography and illustrative project stories with approved Signsnwraps images and verified case studies. The Wraps fitment list (`src/lib/data/wraps.ts`) drives the kit finder and the sample catalogue; confirm pattern availability, year/trim compatibility, film specifications, pricing, warranty and stock before launch. No installer network is live. Confirm the full business address, phone, email, hours, social links, legal copy and domain before publishing.

Signs-only partner logos are bundled from `Assets/Logos` and display with accessible typographic fallbacks if an image cannot load. The partner feature is intentionally not rendered in the `/wraps` experience.
