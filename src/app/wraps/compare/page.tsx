import type { Metadata } from "next";
import { ComparePage } from "@/components/wraps/catalog-pages";
export const metadata: Metadata={title:"Compare DIY, Studio & Installer PPF",description:"Compare PPF kit installation paths, from DIY to a Laverton North studio fit or future installer availability.",alternates:{canonical:"/wraps/compare"}};
export default function Page(){return <ComparePage/>;}
