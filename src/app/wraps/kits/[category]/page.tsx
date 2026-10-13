import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ColourKitsPage, KitCategoryPage } from "@/components/wraps/catalog-pages";
import { kitCategories, kitCoverage } from "@/lib/data/wraps";
type Props={params:Promise<{category:string}>};
export function generateStaticParams(){return [...kitCategories.map(({slug})=>({category:slug})),...kitCoverage.map(({slug})=>({category:slug}))];}
export async function generateMetadata({params}:Props):Promise<Metadata>{const {category}=await params;const productCategory=kitCategories.find(x=>x.slug===category);const coverage=kitCoverage.find(x=>x.slug===category);const title=productCategory?.title??coverage?.name;const description=productCategory?.description??coverage?.detail;return title&&description?{title:category==="colour"?"Colour PPF Kits":title,description,alternates:{canonical:`/wraps/kits/${category}`}}:{title:"Kit category not found"};}
export default async function Page({params}:Props){const {category}=await params;const item=kitCategories.some(x=>x.slug===category)||kitCoverage.some(x=>x.slug===category);if(!item)notFound();return category==="colour"?<ColourKitsPage/>:<KitCategoryPage slug={category}/>;}
