import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { ComparePage } from "@/components/wraps/catalog-pages";
export const metadata: Metadata = pageMetadata({ title: "DIY vs Professional PPF Installation", description: "Compare fitting a pre-cut PPF kit yourself with a professional studio install at Signsnwraps in Laverton North: edges, difficulty, support and who each suits.", path: "/wraps/compare" });
export default function Page(){return <ComparePage/>;}
