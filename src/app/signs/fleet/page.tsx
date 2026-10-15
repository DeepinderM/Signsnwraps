import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { FleetPage } from "@/components/fleet/fleet-page";

export const metadata: Metadata = pageMetadata({ title: "Fleet Signage & Vehicle Lettering Melbourne", description: "Fleet signage for cars, utes, vans, trucks and trailers: vehicle lettering, graphics and safety markings, rolled out across your fleet from Laverton North.", path: "/signs/fleet" });

export default function FleetSignagePage() {
  return <FleetPage side="signs" />;
}
