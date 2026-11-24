import Link from "next/link";
import { caseStudiesFor } from "@/lib/data/case-studies";
import { CaseStudyCard } from "./case-study-card";

/** "Case studies" strip for a service page: up to four projects tagged for it (nothing renders if there are none). */
export function CaseStudyHighlights({ tag, eyebrow = "CASE STUDIES", title = "Real projects, start to finish." }: { tag: string; eyebrow?: string; title?: string }) {
  const studies = caseStudiesFor(tag, 4);
  if (!studies.length) return null;
  return <section className="section cs-highlights" aria-label="Case studies"><div className="container">
    <div className="cs-heading-row"><div><span className="eyebrow">{eyebrow}</span><h2 className="heading-lg">{title}</h2></div><Link className="text-link" href="/case-studies">All case studies →</Link></div>
    <div className={`cs-grid cs-grid-${studies.length}`}>{studies.map((study) => <CaseStudyCard key={study.slug} study={study} />)}</div>
  </div></section>;
}
