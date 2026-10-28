import type { Metadata } from "next";

// Single source of truth for search metadata and structured data (schema.org JSON-LD).
// Keep business facts here accurate: answer engines quote them directly.

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://signsnwraps.com.au").replace(/\/$/, "");

export const SITE = {
  name: "Signsnwraps",
  alternateNames: ["Signs N' Wraps", "Signs n Wraps", "SIGNSNWRAPS"],
  tagline: "Expert advice. Bold results.",
  summary: "Signsnwraps is a signage, printing, vehicle wrap and paint protection film (PPF) studio in Laverton North, Melbourne. It helps businesses and vehicle owners plan, create and protect the way they are seen, from shopfront signs and fleet branding to colour-change wraps and pre-cut PPF kits.",
  email: "sale@signsnwraps.com.au",
  // Placeholder number on the site; leave out of structured data until the real one is confirmed.
  telephone: null as string | null,
  address: { locality: "Laverton North", region: "VIC", postalCode: "3026", country: "AU" },
  areaServed: ["Laverton North", "Melbourne", "Geelong", "Victoria", "Australia"],
  openingHours: [{ days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:30", closes: "17:00" }],
} as const;

export const absoluteUrl = (path = "/") => `${SITE_URL}${path === "/" ? "" : path}`;

const DEFAULT_SHARE_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: "Signsnwraps: signage, printing, vehicle wraps and paint protection film in Laverton North, Melbourne" };

type PageSeo = { title: string; description: string; path: string; absoluteTitle?: boolean; noindex?: boolean; type?: "website" | "article" };

/** Page metadata with a canonical URL and matching Open Graph / Twitter tags. */
export function pageMetadata({ title, description, path, absoluteTitle, noindex, type = "website" }: PageSeo): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} | ${SITE.name}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    // Setting openGraph on a page replaces the inherited object, so re-attach the default share image (src/app/opengraph-image.tsx).
    openGraph: { type, locale: "en_AU", siteName: SITE.name, url: path, title: fullTitle, description, images: [DEFAULT_SHARE_IMAGE] },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [DEFAULT_SHARE_IMAGE.url] },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

// ---------- JSON-LD builders ----------

export const ORG_ID = `${SITE_URL}/#organization`;
export const BUSINESS_ID = `${SITE_URL}/#localbusiness`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export function siteGraph() {
  const address = { "@type": "PostalAddress", addressLocality: SITE.address.locality, addressRegion: SITE.address.region, postalCode: SITE.address.postalCode, addressCountry: SITE.address.country };
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": ORG_ID, name: SITE.name, alternateName: SITE.alternateNames, url: absoluteUrl("/"), logo: absoluteUrl("/icon.png"), email: SITE.email, slogan: SITE.tagline, description: SITE.summary },
      { "@type": "WebSite", "@id": WEBSITE_ID, url: absoluteUrl("/"), name: SITE.name, alternateName: SITE.alternateNames, inLanguage: "en-AU", publisher: { "@id": ORG_ID } },
      {
        "@type": ["LocalBusiness", "AutomotiveBusiness"], "@id": BUSINESS_ID, name: SITE.name, alternateName: SITE.alternateNames, url: absoluteUrl("/"), image: absoluteUrl("/opengraph-image"), logo: absoluteUrl("/icon.png"),
        description: SITE.summary, email: SITE.email, ...(SITE.telephone ? { telephone: SITE.telephone } : {}), address, parentOrganization: { "@id": ORG_ID },
        areaServed: SITE.areaServed.map((name) => ({ "@type": "Place", name })),
        openingHoursSpecification: SITE.openingHours.map((slot) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: slot.days, opens: slot.opens, closes: slot.closes })),
        knowsAbout: ["Commercial signage", "Shopfront signage", "Large format printing", "Neon signs", "Fleet signage", "Vehicle wraps", "Fleet wraps", "Colour change wraps", "Paint protection film", "Pre-cut PPF kits"],
      },
    ],
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: absoluteUrl(item.path) })) };
}

export type Faq = { question: string; answer: string };

export function faqLd(items: readonly Faq[]) {
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) };
}

export function serviceLd({ name, description, path, serviceType, offers }: { name: string; description: string; path: string; serviceType: string; offers?: string[] }) {
  return {
    "@context": "https://schema.org", "@type": "Service", name, description, serviceType, url: absoluteUrl(path),
    provider: { "@id": BUSINESS_ID }, areaServed: SITE.areaServed.slice(0, 4).map((place) => ({ "@type": "Place", name: place })),
    ...(offers?.length ? { hasOfferCatalog: { "@type": "OfferCatalog", name, itemListElement: offers.map((offer) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: offer } })) } } : {}),
  };
}

export function productLd(product: { id: string; name: string; description: string; priceCents: number; imageUrl: string | null; inStock: boolean; path: string; category: string }) {
  return {
    "@context": "https://schema.org", "@type": "Product", name: product.name, description: product.description, sku: product.id, category: product.category,
    ...(product.imageUrl ? { image: [product.imageUrl] } : {}), brand: { "@type": "Brand", name: SITE.name },
    offers: {
      "@type": "Offer", url: absoluteUrl(product.path), priceCurrency: "AUD", price: (product.priceCents / 100).toFixed(2), itemCondition: "https://schema.org/NewCondition",
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", seller: { "@id": ORG_ID },
      shippingDetails: { "@type": "OfferShippingDetails", shippingDestination: { "@type": "DefinedRegion", addressCountry: "AU" }, shippingRate: { "@type": "MonetaryAmount", value: "15.00", currency: "AUD" } },
    },
  };
}

export function howToLd({ name, description, steps, path }: { name: string; description: string; steps: readonly string[]; path: string }) {
  return { "@context": "https://schema.org", "@type": "HowTo", name, description, url: absoluteUrl(path), step: steps.map((text, index) => ({ "@type": "HowToStep", position: index + 1, name: text.split(/[.;]/)[0], text })) };
}
