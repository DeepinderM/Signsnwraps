import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import "./spatial.css";
import "./theme-light.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { SectionSwitch } from "@/components/layout/section-switch";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE, SITE_URL, siteGraph } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Signsnwraps | Signage, Vehicle Wraps & PPF in Melbourne", template: `%s | ${SITE.name}` },
  description: "Signage, printing, vehicle wraps, fleet branding and paint protection film from one Laverton North studio in Melbourne. Book a consultation or shop PPF kits.",
  applicationName: SITE.name,
  openGraph: { type: "website", locale: "en_AU", siteName: SITE.name },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-AU" data-scroll-behavior="smooth"><body><JsonLd data={siteGraph()} /><AnalyticsTracker /><Header /><main><SectionSwitch /><Breadcrumbs />{children}</main><Footer /></body></html>;
}
