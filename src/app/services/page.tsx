import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { services } from "@/lib/data/content";
import { ServiceCard, ConsultationCTA } from "@/components/sections/blocks";
import { FaqSection } from "@/components/seo/faq-section";
export const metadata: Metadata = pageMetadata({ title: "Signage, Wrap, Print & PPF Services", description: "Commercial signage, printing, vehicle wraps, paint protection film, multi-site brand rollouts and signage maintenance from Signsnwraps in Melbourne.", path: "/services" });
export default function ServicesPage(){return <><section className="page-intro"><div className="container"><span className="eyebrow">OUR CAPABILITIES</span><h1 className="heading-xl">The right expertise<br/>for your next move.</h1><p className="body-lg">One connected team for signage, print, vehicle wraps and protection. Start with a conversation and we'll help shape the right solution.</p></div></section><section className="section" style={{paddingTop:20}}><div className="container"><h2 className="grid-heading">All services</h2><div className="grid-3">{services.map((service)=><ServiceCard key={service.slug} service={service}/>)}</div></div></section><FaqSection page="services"/><ConsultationCTA/><style>{`.page-intro{padding:90px 0 58px}.page-intro h1{margin:20px 0}.page-intro p{max-width:620px}.page-intro .container{max-width:1240px}`}</style></>;
}
