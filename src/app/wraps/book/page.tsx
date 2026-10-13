import type { Metadata } from "next";
import { WrapsBookingPage } from "@/components/wraps/catalog-pages";
export const metadata: Metadata={title:"Book a Wrap or PPF Consultation",description:"Discuss vehicle wraps, studio PPF, or pre-cut kit fitting with Signsnwraps in Laverton North.",alternates:{canonical:"/wraps/book"}};
export default function Page(){return <WrapsBookingPage/>;}
