import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import { services, projects, industries } from "@/lib/data/content";
import { ServiceCard, ProjectCard, ConsultationCTA } from "@/components/sections/blocks";
import { BrandStorySection } from "@/components/sections/brand-story";
import { ProudPartners } from "@/components/sections/proud-partners";
import { FaqSection } from "@/components/seo/faq-section";

export const metadata: Metadata = pageMetadata({ title: "Signage & Printing Melbourne", description: "Shopfront and building signs, printing, neon and fleet signage, planned, made and installed by Signsnwraps in Laverton North, Melbourne. Get expert advice.", path: "/signs" });

const signServices = services.filter((service) => ["signage", "printing"].includes(service.slug));
const partnerOrganizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SIGNSNWRAPS",
  url: "https://signsnwraps.com.au/signs",
  member: [
    { "@type": "Organization", name: "Quick Signage", url: "https://www.quicksignage.com.au/" },
    { "@type": "Organization", name: "QuickNeons", url: "https://quickneons.com.au/" },
    { "@type": "Organization", name: "BannerGuru", url: "https://bannerguru.com.au/" },
    { "@type": "Organization", name: "Prestige Car Cleaning" },
  ],
};

export default function SignsHomePage() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(partnerOrganizationSchema).replace(/</g, "\\u003c") }} />
    <section className="signs-hero">
      <div className="container signs-hero-grid">
        <div>
          <span className="eyebrow">SIGNS · PRINT · NEON · INSTALLATION</span>
          <h1 className="heading-xl">Make your brand<br/><em>stand out.</em></h1>
          <p className="body-lg">Signs, print and complete brand presentation. We help you plan the right solution, make it with care and deliver it professionally.</p>
          <div className="signs-actions">
            <Link className="button button-orange" href="/signs/book">Book a Signage Consultation ↗</Link>
            <Link className="button signs-outline" href="/quote">Get a Quote ↗</Link>
          </div>
          <div className="signs-trust"><span>IDEA</span><i>→</i><span>PLANNING</span><i>→</i><span>PRODUCTION</span><i>→</i><span>INSTALLATION</span></div>
        </div>
        <div className="signs-hero-image image-frame">
          <Image src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1500&q=85" alt="Modern commercial workspace featuring brand and wayfinding signage" fill priority sizes="(max-width: 700px) 100vw, 52vw"/>
          <span>COMMERCIAL BRAND PRESENTATION</span>
        </div>
      </div>
    </section>

    <ProudPartners variant="strip" />

    <section className="section signs-services">
      <div className="container">
        <div className="section-head">
          <div><span className="eyebrow">THE SIGNS & PRINT PILLARS</span><h2 className="heading-lg">One partner for<br/>the whole picture.</h2></div>
          <p className="body-lg">From shopfronts and offices to events and multi-site rollouts, get expert advice before production begins.</p>
        </div>
        <div className="grid-2 signs-service-grid">{signServices.map((service) => <ServiceCard key={service.slug} service={service} hrefPrefix="/signs"/>)}</div>
        <div className="pillar-links"><Link href="/signs/signage">Explore custom signage ↗</Link><Link href="/signs/printing">Explore print & banners ↗</Link><Link href="/signs/shopfronts">Plan a storefront ↗</Link><Link href="/signs/fleet">Fleet signage ↗</Link></div>
      </div>
    </section>


    <BrandStorySection />

    <section className="section signs-projects">
      <div className="container">
        <div className="section-head">
          <div><span className="eyebrow">SELECTED PROJECTS</span><h2 className="heading-lg">Built to stand out.</h2></div>
          <Link className="text-link" href="/work">View projects ↗</Link>
        </div>
        <div className="grid-2">{projects.filter((project) => ["Commercial signage", "Retail"].includes(project.category)).slice(0, 2).map((project) => <ProjectCard key={project.slug} project={project}/>)}</div>
      </div>
    </section>

    <section className="section sign-industries">
      <div className="container industries-strip">
        <div><span className="eyebrow">FOR BUSINESS, RETAIL & MORE</span><h2 className="heading-lg">One strong brand.<br/>Every touchpoint.</h2><p className="body-lg">Explore signage and print solutions for retail, hospitality, property, automotive, corporate and growing multi-site businesses.</p><Link className="text-link" href="/industries">Explore industries ↗</Link></div>
        <div className="industry-chips">{industries.slice(0, 8).map((industry) => <Link href={`/industries/${industry.slug}`} key={industry.slug}>{industry.title}<span>↗</span></Link>)}</div>
      </div>
    </section>

    <ProudPartners variant="cards" />
    <section className="signs-fleet-band">
      <div className="container signs-fleet-inner">
        <div><span className="eyebrow">NEW · FLEET SIGNAGE</span><h2 className="heading-lg">Put your brand<br/>on the road.</h2><p className="body-lg">Lettering, graphics and safety markings for cars, utes, vans, trucks and trailers, rolled out consistently across your fleet.</p></div>
        <div className="signs-fleet-actions"><Link className="button button-orange" href="/signs/fleet#fleet-book">Book a Fleet Consultation ↗</Link><Link className="button signs-outline" href="/signs/fleet#fleet-quote">Get a Fleet Quote ↗</Link><Link className="text-link" href="/signs/fleet">Explore fleet signage ↗</Link></div>
      </div>
    </section>
    <FaqSection page="signs" />
    <ConsultationCTA title="Have a signage project in mind?" text="Book a signage consultation in Laverton North. We'll help you plan with confidence."/>

    <style>{`.signs-fleet-band{background:#000;color:#fff;padding:64px 0;border-top:1px solid #ffffff20}.signs-fleet-inner{display:grid;grid-template-columns:1.2fr 1fr;gap:6%;align-items:center}.signs-fleet-band h2{margin:16px 0 12px}.signs-fleet-band .body-lg{color:#ddd;font-size:15px;max-width:540px}.signs-fleet-band .eyebrow{color:var(--electric-blue)}.signs-fleet-actions{display:flex;flex-wrap:wrap;gap:12px;align-items:center}.signs-fleet-actions .button{font-size:12px}.signs-fleet-actions .text-link{color:#fff}@media(max-width:800px){.signs-fleet-inner{grid-template-columns:1fr;gap:24px}}.signs-hero{background:#000;color:#fff;padding:56px 0}.signs-hero-grid{display:grid;grid-template-columns:.95fr 1.05fr;gap:5%;align-items:center}.signs-hero h1{font-size:clamp(3.1rem,6vw,6rem);line-height:.96;letter-spacing:-.07em;text-transform:uppercase;margin:22px 0}.signs-hero h1 em{color:var(--electric-blue);font-style:normal}.signs-hero .body-lg{font-size:15px;color:#ddd;max-width:510px}.signs-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:25px}.signs-actions .button{font-size:10px}.signs-outline{background:transparent;color:#fff;border-color:#fff}.signs-outline:hover{background:#fff;color:#000}.signs-hero-image{height:480px;position:relative}.signs-hero-image img{object-fit:cover}.signs-hero-image:after{content:"";position:absolute;inset:65% 0 0;background:linear-gradient(transparent,#000a)}.signs-hero-image span{position:absolute;z-index:1;bottom:18px;left:20px;font-size:9px;letter-spacing:.15em}.signs-trust{display:flex;gap:11px;align-items:center;margin-top:34px;color:#ccc;font-size:8px;letter-spacing:.1em}.signs-trust i{font-style:normal;color:var(--electric-blue)}.signs-services{background:#fff}.signs-service-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.pillar-links{border-top:1px solid #ddd;margin-top:28px;padding-top:20px;display:flex;gap:26px;flex-wrap:wrap}.pillar-links a{font-size:11px;font-weight:700}.pillar-links a:hover{color:var(--electric-blue)}.signs-projects{background:#f4f4f4}.sign-industries{background:#000;color:#fff}.industries-strip{display:grid;grid-template-columns:1fr 1fr;gap:10%;align-items:center}.industries-strip .body-lg{font-size:14px;color:#ddd;max-width:450px;margin-bottom:20px}.industries-strip .text-link{color:white}.industry-chips{display:grid;grid-template-columns:1fr 1fr}.industry-chips a{padding:16px 0;border-top:1px solid #ffffff45;display:flex;justify-content:space-between;font-size:13px}.industry-chips span{color:var(--electric-blue)}@media(max-width:700px){.signs-hero{padding:35px 0}.signs-hero-grid{grid-template-columns:1fr;gap:28px}.signs-hero-image{height:65vw;min-height:250px}.signs-service-grid{grid-template-columns:1fr}.industries-strip{grid-template-columns:1fr;gap:30px}.industry-chips a{font-size:12px}.pillar-links{gap:14px 20px}}`}</style>
  </>;
}
