import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AnalyticsTracker } from "@/components/analytics-tracker";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://signsnwraps.com.au";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Signsnwraps | Expert Signage, Wraps & Protection", template: "%s | Signsnwraps" },
  description: "Expert advice. Bold results. Signs, print, wraps and protection, professionally planned and delivered by the Signsnwraps team in Laverton North, Melbourne.",
  openGraph: { type: "website", locale: "en_AU", siteName: "SIGNSNWRAPS", title: "Expert Advice. Bold Results.", description: "Make your brand stand out with signs, print, wraps and protection from Signsnwraps." },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const schema = { "@context": "https://schema.org", "@type": "LocalBusiness", name: "Signsnwraps", url: siteUrl, email: "hello@signsnwraps.com.au", telephone: "+61 3 0000 0000", address: { "@type": "PostalAddress", addressLocality: "Laverton North", addressRegion: "VIC", postalCode: "3026", addressCountry: "AU" } };
  return <html lang="en-AU" data-scroll-behavior="smooth"><body><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /><AnalyticsTracker /><Header /><main>{children}</main><Footer /></body></html>;
}
