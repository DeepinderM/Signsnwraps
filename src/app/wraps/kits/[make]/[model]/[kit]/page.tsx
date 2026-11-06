import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KitProductPage } from "@/components/wraps/catalog-pages";
import { getVehicleSelection } from "@/lib/data/wraps";
import { getVehicleKit } from "@/lib/shop/products";
import { pageMetadata } from "@/lib/seo";
type Props={params:Promise<{make:string;model:string;kit:string}>};
export const dynamic = "force-dynamic";
export async function generateMetadata({params}:Props):Promise<Metadata>{const {make,model,kit}=await params;const vehicle=getVehicleSelection(make,model);const product=vehicle?await getVehicleKit(vehicle.make.slug,vehicle.model.slug,kit):undefined;if(!vehicle||!product)return{title:"Kit not found"};return pageMetadata({title:product.name.replace(/^Signs N Wraps /,""),description:product.description.slice(0,158),path:`/wraps/kits/${vehicle.make.slug}/${vehicle.model.slug}/${kit}`});}
export default async function Page({params}:Props){const {make,model,kit}=await params;const vehicle=getVehicleSelection(make,model);if(!vehicle)notFound();
  // undefined = no such kit (404); null = the store couldn't be reached, which the page explains.
  if((await getVehicleKit(vehicle.make.slug,vehicle.model.slug,kit))===undefined)notFound();
  return <KitProductPage makeSlug={make} modelSlug={model} kitSlug={kit}/>;}
