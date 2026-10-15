import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { StudioPpfPage } from "@/components/wraps/catalog-pages";
export const metadata: Metadata = pageMetadata({ title: "Paint Protection Film (PPF) Melbourne", description: "Professional paint protection film (PPF) fitting in Laverton North, Melbourne. Protect your paint from stone chips and scratches, or fit a pre-cut kit yourself.", path: "/wraps/ppf" });
export default function Page(){return <StudioPpfPage/>;}
