import type { Metadata } from "next";
import { VehicleWrapsPage } from "@/components/wraps/catalog-pages";
export const metadata: Metadata = { title: "Vehicle Wraps & Fleet Branding", description: "Explore colour-change wraps, commercial graphics and fleet branding with the Signsnwraps Vehicle Studio in Laverton North.", alternates: { canonical: "/wraps/vehicle-wraps" } };
export default function Page(){return <VehicleWrapsPage/>;}
