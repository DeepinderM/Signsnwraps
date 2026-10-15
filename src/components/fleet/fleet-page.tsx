import Image from "next/image";
import Link from "next/link";
import { fleetSides, type FleetSide } from "@/lib/data/fleet";
import { FleetEnquiry } from "./fleet-enquiry";
import { FaqSection } from "@/components/seo/faq-section";
import { JsonLd } from "@/components/seo/json-ld";
import { serviceLd } from "@/lib/seo";

// Shared layout for /signs/fleet and /wraps/fleet; content comes from fleetSides in src/lib/data/fleet.ts.
const heroImages: Record<FleetSide, string> = {
  signs: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1600&q=85",
  wraps: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=85",
};

export function FleetPage({ side }: { side: FleetSide }) {
  const content = fleetSides[side];
  return <>
    <JsonLd data={serviceLd({ name: content.service, description: content.intro, path: content.path, serviceType: content.service, offers: content.types.map((type) => type.title) })} />
    <section className="sign-detail-hero fleet-hero"><div className="container sign-detail-grid">
      <div>
        <span className="eyebrow">{content.eyebrow}</span>
        <h1 className="heading-xl">{content.title[0]}<br/><em>{content.title[1]}</em></h1>
        <p className="body-lg">{content.intro}</p>
        <div className="fleet-actions"><a className="button button-orange" href="#fleet-book">Book a Fleet Consultation</a><a className="button fleet-outline" href="#fleet-quote">Get a Fleet Quote</a></div>
      </div>
      <div className="sign-detail-image image-frame"><Image src={heroImages[side]} alt={content.imageAlt} fill priority sizes="(max-width: 700px) 100vw, 50vw"/></div>
    </div></section>

    <section className="section"><div className="container">
      <div className="section-head"><div><span className="eyebrow">WHAT WE DO</span><h2 className="heading-lg">{content.typesHeading[0]}<br/>{content.typesHeading[1]}</h2></div><p className="body-lg">{content.typesIntro}</p></div>
      <div className="fleet-types">{content.types.map((item, index) => <article key={item.slug}><span>0{index + 1}</span><h3>{item.title}</h3><p>{item.detail}</p></article>)}</div>
      <p className="fleet-wraps-note">{content.crossLink.text} <Link href={content.crossLink.href}>{content.crossLink.label}</Link></p>
    </div></section>

    <section className="section dark fleet-process-section"><div className="container">
      <span className="eyebrow">HOW A FLEET PROJECT RUNS</span><h2 className="heading-lg">From first vehicle<br/>to full rollout.</h2>
      <ol className="fleet-process">{content.process.map((step, index) => <li key={step.title}><span>0{index + 1}</span><h3>{step.title}</h3><p>{step.detail}</p></li>)}</ol>
    </div></section>

    <section className="section fleet-enquiry-section" id="fleet-book"><div className="container" id="fleet-quote">
      <div className="fleet-enquiry-head"><span className="eyebrow">GET STARTED</span><h2 className="heading-lg">Book an appointment<br/>or get a quotation.</h2><p className="body-lg">Not sure what you need yet? Book a consultation. Already know your vehicles? Send the details for a quote.</p></div>
      <FleetEnquiry service={content.service} workTypes={content.types} workTypesLegend={content.typesLegend}/>
    </div></section>

    <FaqSection eyebrow="FLEET QUESTIONS" title="Fleet questions, answered." intro={content.intro} items={content.faqs.map(([question, answer]) => ({ question, answer }))} />

    <style>{`
      .sign-detail-hero{background:#000;color:#fff;padding:55px 0}.sign-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:8%;align-items:center}.sign-detail-grid h1{font-size:clamp(2.8rem,5vw,5rem);line-height:.98;letter-spacing:-.06em;text-transform:uppercase;margin:23px 0}.sign-detail-grid h1 em{font-style:normal;color:var(--electric-blue)}.sign-detail-grid .body-lg{font-size:15px;color:#ddd}.sign-detail-image{height:450px}.sign-detail-image img{object-fit:cover}
      .fleet-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:25px}.fleet-actions .button{font-size:12px}.fleet-outline{background:transparent;border-color:#fff;color:#fff}.fleet-outline:hover{background:#fff;border-color:#fff;color:#000}
      .fleet-types{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.fleet-types article{border:1px solid var(--line);padding:24px;min-height:190px}.fleet-types span{font-size:11px;font-weight:700;color:var(--electric-blue-ink)}.fleet-types h3{font-size:20px;letter-spacing:-.03em;margin:18px 0 8px}.fleet-types p{font-size:14px;line-height:1.6;color:#555;margin:0}
      .fleet-wraps-note{font-size:13px;color:#555;margin-top:20px}.fleet-wraps-note a{text-decoration:underline;font-weight:700}
      .fleet-process{list-style:none;padding:0;margin:40px 0 0;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:0;border-top:1px solid #ffffff30}.fleet-process li{padding:22px 18px 0 0}.fleet-process span{font-size:11px;font-weight:700;color:var(--electric-blue)}.fleet-process h3{font-size:18px;margin:14px 0 8px;letter-spacing:-.02em}.fleet-process p{font-size:13px;line-height:1.6;color:#ccc;margin:0}
      .fleet-enquiry-section{background:#f4f4f4;scroll-margin-top:110px}#fleet-quote{scroll-margin-top:110px}.fleet-enquiry-head{max-width:720px;margin-bottom:28px}.fleet-enquiry-head h2{margin:16px 0 12px}
      .fleet-tabs{display:grid;grid-template-columns:1fr 1fr;gap:0;max-width:900px}.fleet-tabs a{display:grid;gap:4px;padding:18px 20px;border:1px solid #cfcfcf;border-bottom:0;background:#e9e9e9;color:#333}.fleet-tabs a b{font-size:16px}.fleet-tabs a span{font-size:12px;color:#666}.fleet-tabs a[aria-current]{background:#fff;color:#000;box-shadow:inset 0 3px 0 var(--electric-blue);border-color:#fff}.fleet-tabs a:not([aria-current]):hover{background:#f7f7f7}
      .fleet-form{max-width:900px;background:#fff}.fleet-form .booking-card,.fleet-form .quote-form{background:#fff}
      .fleet-faq .catalog-faq{margin-top:28px;max-width:860px}
      @media(max-width:900px){.fleet-types{grid-template-columns:repeat(2,minmax(0,1fr))}.fleet-process{grid-template-columns:1fr 1fr;gap:0 18px}}
      @media(max-width:700px){.sign-detail-grid{grid-template-columns:1fr;gap:28px}.sign-detail-image{height:65vw;min-height:250px}.fleet-types,.fleet-process{grid-template-columns:1fr}.fleet-tabs a{padding:14px}.fleet-tabs a span{display:none}}
    `}</style>
  </>;
}
