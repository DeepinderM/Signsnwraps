import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { WrapsBookingPage } from "@/components/wraps/catalog-pages";
export const metadata: Metadata = pageMetadata({ title: "Book a Wrap or PPF Consultation", description: "Book a vehicle wrap, paint protection film or PPF kit fitting consultation at the Signsnwraps studio in Laverton North, Melbourne. Plan finish and coverage.", path: "/wraps/book" });
export default function Page(){return <WrapsBookingPage/>;}
