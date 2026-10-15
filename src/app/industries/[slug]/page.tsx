import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { industries, services } from "@/lib/data/content";
import { ServiceCard, ConsultationCTA } from "@/components/sections/blocks";
import { pageMetadata } from "@/lib/seo";
type Props={params:Promise<{slug:string}>};
export function generateStaticParams(){return industries.map(({slug})=>({slug}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{const {slug}=await params;const industry=industries.find(x=>x.slug===slug);return industry?pageMetadata({title:`Signage & Branding for ${industry.title}`,description:`${industry.description} Planned and installed by Signsnwraps in Melbourne.`.slice(0,158),path:`/industries/${slug}`}):{title:"Industry not found"};}
export default async function IndustryPage({params}:Props){const {slug}=await params;const industry=industries.find(x=>x.slug===slug);if(!industry)notFound();const relevant=services.filter(s=>industry.services.includes(s.slug));return <><section className="page-intro"><div className="container"><span className="eyebrow">INDUSTRY SOLUTIONS · {industry.title.toUpperCase()}</span><h1 className="heading-xl">Signage & branding<br/>for {industry.title.toLowerCase()}.</h1><p className="body-lg">{industry.description}</p><Link className="button button-orange" href="/book">Plan your project</Link></div></section><section className="section" style={{paddingTop:20}}><div className="container"><div className="section-head"><div><span className="eyebrow">SOLUTIONS FOR {industry.title.toUpperCase()}</span><h2 className="heading-lg">A connected approach.</h2></div><p className="body-lg">Choose one service or bring the pieces together with one experienced point of contact.</p></div><div className="grid-3">{relevant.map(s=><ServiceCard key={s.slug} service={s}/>)}</div></div></section><ConsultationCTA title={`Let's talk about your ${industry.title.toLowerCase()} project.`}/></>}
