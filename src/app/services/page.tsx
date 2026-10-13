import type { Metadata } from "next";
import { services } from "@/lib/data/content";
import { ServiceCard, ConsultationCTA } from "@/components/sections/blocks";
export const metadata: Metadata = { title: "Our Services", description: "Explore signage, printing, vehicle wraps, PPF, brand rollout and maintenance services from Signsnwraps in Melbourne.", alternates: { canonical: "/services" } };
export default function ServicesPage(){return <><section className="page-intro"><div className="container"><span className="eyebrow">OUR CAPABILITIES</span><h1 className="heading-xl">The right expertise<br/>for your next move.</h1><p className="body-lg">One connected team for signage, print, vehicle wraps and protection. Start with a conversation and we'll help shape the right solution.</p></div></section><section className="section" style={{paddingTop:20}}><div className="container grid-3">{services.map((service)=><ServiceCard key={service.slug} service={service}/>)}</div></section><ConsultationCTA/><style>{`.page-intro{padding:90px 0 58px}.page-intro h1{margin:20px 0}.page-intro p{max-width:620px}.page-intro .container{max-width:1240px}`}</style></>;
}
