import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { SharedFaqPage } from "@/components/wraps/catalog-pages";
export const metadata: Metadata = pageMetadata({ title: "Vehicle Wrap & PPF FAQs", description: "Answers to common questions about PPF kits, fitting options, paint protection film, ordering online and visiting the Signsnwraps studio in Laverton North.", path: "/wraps/faq" });
export default function Page(){return <SharedFaqPage/>;}
