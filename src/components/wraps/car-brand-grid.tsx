import Image from "next/image";
import Link from "next/link";
import { vehicleMakes } from "@/lib/data/wraps";

/** "Shop by car brand": a logo tile for every make we cut kits for, each opening that brand's models. */
export function CarBrandGrid({ eyebrow = "SHOP BY CAR BRAND", title = "Choose your car brand.", intro, headingLevel = "h2" }: { eyebrow?: string; title?: string; intro?: string; headingLevel?: "h1" | "h2" }) {
  const Heading = headingLevel;
  return <section className="section car-brands" aria-labelledby="car-brands-title"><div className="container">
    <div className="section-head"><div><span className="eyebrow">{eyebrow}</span><Heading id="car-brands-title" className="heading-lg">{title}</Heading></div><p className="body-lg">{intro ?? `Pre-cut PPF kits for ${vehicleMakes.length} brands of utes, 4WDs and SUVs. Pick your brand, then your car.`}</p></div>
    <ul className="car-brand-grid">{vehicleMakes.map((make) => {
      const kits = make.models.reduce((sum, model) => sum + (model.kits ?? 0), 0);
      return <li key={make.slug}><Link href={`/wraps/kits/${make.slug}`} className="car-brand">
        <span className="car-brand-logo">{make.logo ? <Image src={make.logo} alt="" width={435} height={240} sizes="(max-width: 640px) 40vw, 180px" /> : <span className="car-brand-word" aria-hidden="true">{make.name}</span>}</span>
        <span className="car-brand-text"><b>{make.name}</b><small>{make.models.length} {make.models.length === 1 ? "model" : "models"}{kits ? ` · ${kits} ${kits === 1 ? "kit" : "kits"}` : ""}</small></span>
      </Link></li>;
    })}</ul>
  </div></section>;
}
