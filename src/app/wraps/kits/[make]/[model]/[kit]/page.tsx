import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KitProductPage } from "@/components/wraps/catalog-pages";
import { getVehicleSelection, kitCoverage, vehicleMakes } from "@/lib/data/wraps";
type Props={params:Promise<{make:string;model:string;kit:string}>};
export function generateStaticParams(){return vehicleMakes.flatMap(make=>make.models.flatMap(model=>model.years.flatMap(year=>kitCoverage.map(kit=>({make:make.slug,model:`${model.slug}-${year}`,kit:kit.slug})))));}
export async function generateMetadata({params}:Props):Promise<Metadata>{const {make,model,kit}=await params;const vehicle=getVehicleSelection(make,model);const coverage=kitCoverage.find(x=>x.slug===kit);return vehicle&&coverage?{title:`${coverage.name} · ${vehicle.make.name} ${vehicle.model.name}${vehicle.year?` ${vehicle.year}`:""}`,description:`Review ${coverage.name.toLowerCase()} fitment for ${vehicle.make.name} ${vehicle.model.name}${vehicle.year?` ${vehicle.year}`:""}. Pattern and price confirmation required.`,alternates:{canonical:`/wraps/kits/${make}/${model}/${kit}`}}:{title:"Kit not found"};}
export default async function Page({params}:Props){const {make,model,kit}=await params;if(!getVehicleSelection(make,model)||!kitCoverage.some(x=>x.slug===kit))notFound();return <KitProductPage makeSlug={make} modelSlug={model} kitSlug={kit}/>;}
