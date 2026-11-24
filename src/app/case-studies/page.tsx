import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { caseStudies } from "@/lib/data/case-studies";
import { CaseStudyCard } from "@/components/case-studies/case-study-card";
import { ConsultationCTA } from "@/components/sections/blocks";

export const metadata: Metadata = pageMetadata({ title: "Signage & Wrap Case Studies", description: "Real projects from brief to installation: how Signs N' Wraps designs, builds and installs signage and vehicle wraps across Melbourne and Geelong.", path: "/case-studies" });

export default function CaseStudiesPage() {
  return <>
    <section className="page-intro cs-intro"><div className="container"><span className="eyebrow">CASE STUDIES</span><h1 className="heading-xl">Real projects.<br />Real results.</h1><p className="body-lg">The full story behind our work: the brief, the design, the build and the finished result, with before and after photos.</p></div></section>
    <section className="section" style={{ paddingTop: 10 }}><div className="container cs-grid">{caseStudies.map((study) => <CaseStudyCard key={study.slug} study={study} />)}</div></section>
    <ConsultationCTA title="Your project could be next." />
  </>;
}
