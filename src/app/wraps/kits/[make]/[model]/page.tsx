import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VehicleCollectionPage } from "@/components/wraps/catalog-pages";
import { getVehicleSelection } from "@/lib/data/wraps";
import { pageMetadata } from "@/lib/seo";
type Props={params:Promise<{make:string;model:string}>};
export const dynamic = "force-dynamic";
export async function generateMetadata({params}:Props):Promise<Metadata>{const {make,model}=await params;const vehicle=getVehicleSelection(make,model);// Year variants (e.g. hilux-2023) share content with the model page, so they canonicalise to it.
  if(!vehicle)return{title:"Vehicle not found"};const name=`${vehicle.make.name} ${vehicle.model.name}`;const years=`${vehicle.model.years.at(-1)}–${vehicle.model.years[0]}`;return pageMetadata({title:`${name} PPF Kits (${years})`,description:`Pre-cut PPF kits for the ${name} ${years}: front protection, full front, door edges, sills and headlights. Order online or book a studio fit.`,path:`/wraps/kits/${make}/${vehicle.model.slug}`});}
export default async function Page({params}:Props){const {make,model}=await params;if(!getVehicleSelection(make,model))notFound();return <VehicleCollectionPage makeSlug={make} modelSlug={model}/>;}
