import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaqSection } from "@/components/seo/faq-section";
import { JsonLd } from "@/components/seo/json-ld";
import { ConsultationCTA } from "@/components/sections/blocks";
import { pageMetadata, serviceLd } from "@/lib/seo";
import type { PageFaqKey } from "@/lib/data/faqs";

type SignPage = { title: string; h1: string; seoTitle: string; seoDescription: string; serviceType: string; intro: string; details: string; image: string; imageAlt: string; offers: string[]; faq: PageFaqKey };

const pages: Record<string, SignPage> = {
  signage: {
    title: "Commercial signage", h1: "Commercial signage", seoTitle: "Commercial Signage Melbourne", serviceType: "Commercial signage",
    seoDescription: "Shopfront, building, illuminated, 3D and wayfinding signs for Melbourne businesses, designed, fabricated and installed by Signsnwraps in Laverton North.",
    intro: "Make your business easy to find, recognise and remember.",
    details: "Shopfronts, building identification, illuminated signs, wayfinding and custom fabrication, planned around the site, viewing distance and the way your business works.",
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=85", imageAlt: "Modern commercial interior with branded signage",
    offers: ["Shopfront and building signs", "Illuminated signs and lightboxes", "Fabricated 3D letters", "Wayfinding and directional signs", "Safety and compliance signs", "Site measure, fabrication and installation"], faq: "signage",
  },
  shopfronts: {
    title: "Shopfronts", h1: "Shopfront signage", seoTitle: "Shopfront Signs & Window Graphics Melbourne", serviceType: "Shopfront signage",
    seoDescription: "Shopfront signage, fascia signs, window graphics, frosting and door signs for Melbourne retail and hospitality businesses, installed by Signsnwraps.",
    intro: "Create a clear, confident first impression.",
    details: "Bring the fascia sign, window graphics and entry details together as one considered storefront. We plan practical materials, visibility and installation with you.",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=85", imageAlt: "Retail shopfront with window displays and signage",
    offers: ["Fascia and above-door signs", "Window graphics and lettering", "Frosted and privacy film", "One-way vision film", "Door signs with hours and contact details", "Projecting and blade signs"], faq: "shopfronts",
  },
  printing: {
    title: "Printing", h1: "Banners & printing", seoTitle: "Banner & Large Format Printing Melbourne", serviceType: "Large format printing",
    seoDescription: "Vinyl and mesh banners, pull-up banners, posters, stickers and wall, window and floor graphics, printed in Melbourne by Signsnwraps with installation available.",
    intro: "Give your message a place to land.",
    details: "Banners, stickers, promotional graphics and displays for events, campaigns and branded spaces. Share your brief and we'll help you choose suitable formats and finishes.",
    image: "https://images.unsplash.com/photo-1504274066651-8d31a536b11a?auto=format&fit=crop&w=1600&q=85", imageAlt: "Large format printed graphics for an event",
    offers: ["Vinyl and mesh banners", "Pull-up banners and event displays", "Posters and promotional print", "Stickers and labels", "Wall, window and floor graphics", "Graphic installation"], faq: "printing",
  },
  neon: {
    title: "Neon & illuminated signs", h1: "Neon & illuminated signs", seoTitle: "Custom Neon & LED Signs Melbourne", serviceType: "Neon and illuminated signage",
    seoDescription: "Custom LED neon signs, lightboxes and illuminated letters for shops, cafes, bars and offices in Melbourne. Designed from your logo by Signsnwraps.",
    intro: "Give your space a distinct glow.",
    details: "Illuminated signage and feature pieces for retail, hospitality and branded environments. We talk through placement, visibility and power requirements before production.",
    image: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1600&q=85", imageAlt: "Illuminated neon-style sign in a dark interior",
    offers: ["Custom LED neon signs", "Logo and lettering neon", "Lightboxes", "Illuminated 3D letters", "Indoor feature signs", "Installation and mounting"], faq: "neon",
  },
};
const slugs = Object.keys(pages);
type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return slugs.map((slug) => ({ slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params; const item = pages[slug];
  return item ? pageMetadata({ title: item.seoTitle, description: item.seoDescription, path: `/signs/${slug}` }) : { title: "Signs page not found" };
}

export default async function SignsDetailPage({ params }: Props) {
  const { slug } = await params; const item = pages[slug];
  if (!item) notFound();
  const related = slugs.filter((other) => other !== slug);
  return <>
    <JsonLd data={serviceLd({ name: item.h1, description: item.seoDescription, path: `/signs/${slug}`, serviceType: item.serviceType, offers: item.offers })} />
    <section className="sign-detail-hero"><div className="container sign-detail-grid"><div><span className="eyebrow">SIGNS · PRINT · FABRICATION</span><h1 className="heading-xl">{item.h1}<br/><em>made to stand out.</em></h1><p className="body-lg">{item.intro} {item.details}</p><div className="sign-detail-actions"><Link className="button button-orange" href="/signs/book">Book a Signage Consultation</Link><Link className="button sign-outline" href="/quote">Get a Quote</Link></div></div><div className="sign-detail-image image-frame"><Image src={item.image} alt={item.imageAlt} fill priority sizes="(max-width: 700px) 100vw, 50vw"/></div></div></section>
    <section className="section"><div className="container signs-service-detail"><div><span className="eyebrow">WHAT WE MAKE</span><h2 className="heading-lg">{item.title}<br/>from brief to install.</h2><p className="body-lg">Every site and business is different. We help you weigh up viewing distance, materials, finish, site conditions, approvals and installation before production starts.</p></div><div><ul className="sign-offers">{item.offers.map((offer) => <li key={offer}>{offer}</li>)}</ul><div className="sign-service-links">{related.map((other) => <Link key={other} href={`/signs/${other}`}>{pages[other].title}</Link>)}<Link href="/signs/fleet">Fleet signage</Link><Link href="/signs/projects">Projects</Link></div></div></div></section>
    <FaqSection page={item.faq} />
    <ConsultationCTA title={`Planning ${item.title.toLowerCase()}?`} text="Book a consultation in Laverton North and we'll help you plan it with confidence."/>
    <style>{`.sign-detail-hero{background:#000;color:#fff;padding:55px 0}.sign-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:8%;align-items:center}.sign-detail-grid h1{font-size:clamp(2.8rem,5vw,5rem);line-height:.98;letter-spacing:-.06em;text-transform:uppercase;margin:23px 0}.sign-detail-grid h1 em{font-style:normal;color:var(--electric-blue)}.sign-detail-grid .body-lg{font-size:15px;color:#ddd}.sign-detail-actions{display:flex;gap:12px;flex-wrap:wrap}.sign-detail-actions .button{font-size:12px}.sign-outline{background:transparent;border-color:#fff;color:#fff}.sign-outline:hover{background:#fff;color:#000}.sign-detail-image{height:450px}.sign-detail-image img{object-fit:cover}.signs-service-detail{display:grid;grid-template-columns:1fr 1fr;gap:10%}.signs-service-detail h2{margin:20px 0}.sign-offers{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:1fr 1fr;border-top:1px solid var(--line)}.sign-offers li{padding:14px 12px 14px 0;border-bottom:1px solid var(--line);font-size:15px;font-weight:600}.sign-offers li::before{content:"—";color:var(--electric-blue-ink);margin-right:10px}.sign-service-links{display:flex;gap:18px;flex-wrap:wrap;margin-top:22px}.sign-service-links a{font-size:12px;font-weight:700}.sign-service-links a:hover{color:var(--electric-blue-ink)}@media(max-width:700px){.sign-detail-grid,.signs-service-detail{grid-template-columns:1fr;gap:28px}.sign-detail-image{height:65vw;min-height:250px}.sign-offers{grid-template-columns:1fr}}`}</style>
  </>;
}
