import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata, SITE } from "@/lib/seo";
import { HomeChooser } from "@/components/home/home-chooser";
import { FaqSection } from "@/components/seo/faq-section";
import { BrandScrollStory } from "@/components/home/brand-scroll-story";

export const metadata: Metadata = pageMetadata({ title: "Signsnwraps | Signage, Vehicle Wraps & PPF in Melbourne", description: "Signage, printing, vehicle wraps, fleet branding and paint protection film from one Laverton North studio in Melbourne. Book a consultation or shop PPF kits.", path: "/", absoluteTitle: true });

const pillars = [
  { title: "Signs", text: "Shopfront, building, illuminated and neon signs, designed, made and installed.", links: [["Commercial signage", "/signs/signage"], ["Shopfronts", "/signs/shopfronts"], ["Neon signs", "/signs/neon"]] },
  { title: "Print", text: "Banners, event displays, stickers and wall, window and floor graphics.", links: [["Banners & printing", "/signs/printing"], ["Get a print quote", "/quote"]] },
  { title: "Wraps", text: "Colour change and commercial wraps, fleet livery and fleet signage.", links: [["Vehicle wraps", "/wraps/vehicle-wraps"], ["Fleet wraps", "/wraps/fleet"], ["Fleet signage", "/signs/fleet"]] },
  { title: "Protect", text: "Colour PPF fitted in our studio, or pre-cut clear PPF kits to fit yourself.", links: [["Colour PPF", "/wraps/ppf"], ["Clear PPF kits by vehicle", "/wraps/kits"], ["Shop online", "/wraps/shop"]] },
];

export default function HomePage() {
  return <>
    <HomeChooser />
    <BrandScrollStory />
    <section className="section home-about"><div className="container">
      <div className="home-about-lead"><span className="eyebrow">WHO WE ARE</span><h2 className="heading-lg">One studio for signs, print, wraps and protection.</h2><p className="body-lg">{SITE.summary}</p></div>
      <div className="home-pillars">{pillars.map((pillar, index) => <article key={pillar.title}><span>0{index + 1}</span><h3>{pillar.title}</h3><p>{pillar.text}</p><ul>{pillar.links.map(([label, href]) => <li key={href}><Link href={href}>{label}</Link></li>)}</ul></article>)}</div>
      <p className="home-process">How every project runs: <b>Idea → Planning → Production → Installation → Ongoing support.</b> <Link href="/book">Book an in-store consultation</Link></p>
    </div></section>
    <FaqSection page="home" />
    <style>{`.home-about-lead{max-width:820px}.home-about-lead h2{margin:16px 0}.home-pillars{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:40px}.home-pillars article{border:1px solid var(--line);padding:22px}.home-pillars span{font-size:11px;font-weight:800;color:var(--electric-blue-ink)}.home-pillars h3{font-size:22px;letter-spacing:-.03em;margin:14px 0 8px}.home-pillars p{font-size:14px;color:#555;line-height:1.6;margin:0 0 12px}.home-pillars ul{list-style:none;padding:0;margin:0;display:grid;gap:6px}.home-pillars a{font-size:13px;font-weight:700}.home-pillars a:hover{color:var(--electric-blue-ink)}.home-process{margin-top:28px;font-size:14px;color:#444}.home-process a{text-decoration:underline;font-weight:700;margin-left:6px}@media(max-width:900px){.home-pillars{grid-template-columns:1fr 1fr}}@media(max-width:560px){.home-pillars{grid-template-columns:1fr}}`}</style>
  </>;
}
