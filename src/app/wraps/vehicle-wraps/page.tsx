import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { VehicleWrapsPage } from "@/components/wraps/catalog-pages";
export const metadata: Metadata = pageMetadata({ title: "Vehicle Wraps & Colour Change Melbourne", description: "Colour change wraps, commercial vehicle wraps and fleet branding for cars, utes, vans and trucks at the Signsnwraps studio in Laverton North, Melbourne.", path: "/wraps/vehicle-wraps" });
export default function Page(){return <VehicleWrapsPage/>;}
