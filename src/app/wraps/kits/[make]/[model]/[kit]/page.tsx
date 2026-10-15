import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KitProductPage } from "@/components/wraps/catalog-pages";
import { getVehicleSelection, kitCoverage } from "@/lib/data/wraps";
import { pageMetadata } from "@/lib/seo";
type Props={params:Promise<{make:string;model:string;kit:string}>};
export const dynamic = "force-dynamic";
export async function generateMetadata({params}:Props):Promise<Metadata>{const {make,model,kit}=await params;const vehicle=getVehicleSelection(make,model);const coverage=kitCoverage.find(x=>x.slug===kit);if(!vehicle||!coverage)return{title:"Kit not found"};const name=`${vehicle.make.name} ${vehicle.model.name}`;return pageMetadata({title:`${name} ${coverage.name} PPF Kit`,description:`Pre-cut ${coverage.name.toLowerCase()} paint protection film kit for the ${name} (${vehicle.model.years.at(-1)}–${vehicle.model.years[0]}). Order online with Australia-wide shipping or book a studio fit.`,path:`/wraps/kits/${make}/${vehicle.model.slug}/${kit}`});}
export default async function Page({params}:Props){const {make,model,kit}=await params;if(!getVehicleSelection(make,model)||!kitCoverage.some(x=>x.slug===kit))notFound();return <KitProductPage makeSlug={make} modelSlug={model} kitSlug={kit}/>;}
