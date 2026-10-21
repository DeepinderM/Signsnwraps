import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { StudioPpfPage } from "@/components/wraps/catalog-pages";
export const metadata: Metadata = pageMetadata({ title: "Colour PPF: Colour Change Paint Protection Film", description: "Colour PPF changes your vehicle's colour or finish and protects the paint from stone chips. Studio-fitted in gloss, satin or matte. Clear PPF comes as DIY kits.", path: "/wraps/ppf" });
export default function Page(){return <StudioPpfPage/>;}
