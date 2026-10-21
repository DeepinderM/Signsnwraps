import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { WrapsHero, ThreePaths, CoverageGrid, ColourFilmStrip, HowKitWorks, TrustSection, WrapsClosingCTA } from "@/components/sections/wraps-sections";
import { ProjectCard } from "@/components/sections/blocks";
import { projects } from "@/lib/data/content";
import { FaqSection } from "@/components/seo/faq-section";
export const metadata: Metadata = pageMetadata({ title: "Vehicle Wraps, PPF & DIY Kits Melbourne", description: "Vehicle wraps, paint protection film and pre-cut DIY PPF kits from the Signsnwraps studio in Laverton North, Melbourne. Fit it yourself or let us fit it.", path: "/wraps" });
export default function WrapsHomePage(){return <>
  <WrapsHero/>
  <ThreePaths/>
  <CoverageGrid/>
  <ColourFilmStrip/>
  <section className="section wraps-work"><div className="container"><div className="section-head"><div><span className="eyebrow">LAVERTON NORTH STUDIO</span><h2 className="heading-lg">Real installs.<br/>Real protection.</h2></div><Link className="text-link" href="/work">View project stories</Link></div><div className="grid-2">{projects.filter((project)=>["PPF","Vehicle wraps"].includes(project.category)).slice(0,2).map((project)=><ProjectCard key={project.slug} project={project} featured/>)}</div><p className="wraps-preview-note">Project imagery and examples shown are illustrative until replaced with approved Signsnwraps studio work.</p></div></section>
  <HowKitWorks/>
  <TrustSection/>
  <section className="section wraps-services"><div className="container service-entry-grid"><Link href="/wraps/vehicle-wraps"><span className="eyebrow">VEHICLE STUDIO</span><h2>Vehicle wraps<br/>& fleet branding</h2><p>Colour changes, commercial wraps and fleet graphics, planned with our team.</p><b>Explore vehicle wraps</b></Link><Link href="/wraps/ppf"><span className="eyebrow">COLOUR PPF</span><h2>Colour that<br/>protects</h2><p>Change your vehicle's colour or finish and protect the paint, fitted in our studio.</p><b>Explore colour PPF</b></Link></div></section>
  <FaqSection page="wraps"/>
  <WrapsClosingCTA/>
  <style>{`.wraps-work{background:#f4f4f4}.wraps-preview-note{font-size:10px;color:#666;margin-top:19px}.wraps-services{background:#fff}.service-entry-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.service-entry-grid>a{border:1px solid #d5d5d5;padding:27px;min-height:245px;display:flex;flex-direction:column;align-items:flex-start}.service-entry-grid h2{font-size:clamp(1.7rem,3vw,2.4rem);line-height:1;letter-spacing:-.05em;margin:24px 0 10px}.service-entry-grid p{font-size:13px;color:#555;line-height:1.6;max-width:400px;flex:1}.service-entry-grid b{font-size:11px}.service-entry-grid>a:hover{background:#000;color:#fff}.service-entry-grid>a:hover p{color:#ddd}@media(max-width:600px){.service-entry-grid{grid-template-columns:1fr}}`}</style>
</>;}
