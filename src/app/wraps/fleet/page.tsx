import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { FleetPage } from "@/components/fleet/fleet-page";

export const metadata: Metadata = pageMetadata({ title: "Fleet Wraps & Commercial Vehicle Wraps", description: "Commercial fleet wraps, livery design, colour change and fleet paint protection for cars, utes, vans and trucks, fitted at Signsnwraps in Laverton North.", path: "/wraps/fleet" });

export default function FleetWrapsPage() {
  return <FleetPage side="wraps" />;
}
