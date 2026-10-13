import type { Metadata } from "next";
import { FilmPage } from "@/components/wraps/catalog-pages";
export const metadata: Metadata={title:"AusPPF Film Specifications",description:"Understand the film brand behind Signsnwraps pre-cut kits. Verify current AusPPF technical sheets and warranty details before purchase.",alternates:{canonical:"/wraps/film"}};
export default function Page(){return <FilmPage/>;}
