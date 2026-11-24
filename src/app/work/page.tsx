import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { projects } from "@/lib/data/content";
import { ProjectCard, ConsultationCTA } from "@/components/sections/blocks";
import { caseStudies } from "@/lib/data/case-studies";
import { CaseStudyCard } from "@/components/case-studies/case-study-card";
import Link from "next/link";
export const metadata: Metadata = pageMetadata({ title: "Signage & Vehicle Wrap Projects", description: "Selected signage, shopfront, fleet branding and paint protection projects by Signsnwraps in Melbourne. See how projects go from brief to installation.", path: "/work" });
export default function WorkPage(){return <><section className="page-intro"><div className="container"><span className="eyebrow">SELECTED PROJECTS</span><h1 className="heading-xl">Made with intent.<br/>Built to be seen.</h1><p className="body-lg">Every project begins with a brief. Here&apos;s a look at the kind of thoughtful work our team loves bringing to life.</p></div></section>{caseStudies.length>0&&<section className="section" style={{paddingTop:10,paddingBottom:20}}><div className="container"><div className="cs-heading-row"><h2 className="grid-heading">Case studies</h2><Link className="text-link" href="/case-studies">All case studies →</Link></div><div className="cs-grid">{caseStudies.slice(0,4).map(s=><CaseStudyCard key={s.slug} study={s}/>)}</div></div></section>}<section className="section" style={{paddingTop:10}}><div className="container"><h2 className="grid-heading">Selected projects</h2><div className="work-grid">{projects.map(p=><ProjectCard key={p.slug} project={p} featured/>)}</div></div></section><ConsultationCTA title="Your project could be next."/><style>{`.page-intro{padding:90px 0 52px}.page-intro h1{margin:20px 0}.page-intro p{max-width:610px}.work-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:46px 24px}@media(max-width:640px){.work-grid{grid-template-columns:1fr;gap:30px}}`}</style></>;
}
