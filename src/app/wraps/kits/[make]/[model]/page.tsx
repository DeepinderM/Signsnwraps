import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VehicleCollectionPage } from "@/components/wraps/catalog-pages";
import { vehicleMakes, getVehicleSelection } from "@/lib/data/wraps";
type Props={params:Promise<{make:string;model:string}>};
export function generateStaticParams(){return vehicleMakes.flatMap(make=>make.models.flatMap(model=>[ {make:make.slug,model:model.slug}, ...model.years.map(year=>({make:make.slug,model:`${model.slug}-${year}`})) ]));}
export async function generateMetadata({params}:Props):Promise<Metadata>{const {make,model}=await params;const vehicle=getVehicleSelection(make,model);return vehicle?{title:`${vehicle.make.name} ${vehicle.model.name}${vehicle.year?` ${vehicle.year}`:""} PPF Kits`,description:`Check pre-cut paint protection coverage options for the ${vehicle.make.name} ${vehicle.model.name}${vehicle.year?` ${vehicle.year}`:""}. Fitment must be confirmed before purchase.`,alternates:{canonical:`/wraps/kits/${make}/${model}`}}:{title:"Vehicle not found"};}
export default async function Page({params}:Props){const {make,model}=await params;if(!getVehicleSelection(make,model))notFound();return <VehicleCollectionPage makeSlug={make} modelSlug={model}/>;}
