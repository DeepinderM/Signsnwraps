import type { Metadata } from "next";
import { SharedFaqPage } from "@/components/wraps/catalog-pages";
export const metadata: Metadata={title:"Wraps & PPF FAQs",description:"Answers about PPF kits, fitting options, film, availability and visiting the Signsnwraps studio.",alternates:{canonical:"/wraps/faq"}};
export default function Page(){return <SharedFaqPage/>;}
