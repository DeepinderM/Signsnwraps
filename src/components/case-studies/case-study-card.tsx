import Image from "next/image";
import Link from "next/link";
import type { CaseStudy } from "@/lib/data/case-studies";

/** "South Geelong VIC 3220" from a full address; "Ravenhall, VIC" stays as it is. */
const place = (location: string) => { const parts = location.split(",").map((part) => part.trim()); return parts.length > 1 && /^[A-Z]{2,3}$/.test(parts.at(-1)!) ? parts.join(", ") : parts.at(-1)!; };

/** A case study in a list: featured photo, client, location, timeline and the headline. */
export function CaseStudyCard({ study }: { study: CaseStudy }) {
  return <article className="cs-card">
    <Link href={`/case-studies/${study.slug}`} className="cs-card-image image-frame"><Image src={study.featured.src} alt={study.featured.alt} fill sizes="(max-width: 760px) 100vw, 50vw" style={study.heroPosition ? { objectPosition: study.heroPosition } : undefined} /><span className="cs-card-badge">Case study · {study.highlights[0]?.[0]}</span></Link>
    <div className="cs-card-meta"><span>{study.category} · {place(study.location)}</span><h3><Link href={`/case-studies/${study.slug}`}>{study.title}</Link></h3><p>{study.metaDescription}</p>
      <Link className="cs-card-link" href={`/case-studies/${study.slug}`}>Read the story →</Link></div>
  </article>;
}
