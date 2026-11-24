import Image from "next/image";
import Link from "next/link";
import { caseStudies } from "@/lib/data/case-studies";
import { InstagramReel } from "./instagram-reel";
import { CaseStudyCard } from "./case-study-card";

/** Home page: the latest case study (finished + before photo, key facts, quote) and its Instagram reels. */
export function HomeCaseStudies() {
  const study = caseStudies[0];
  if (!study) return null;
  const before = study.challenge.before[0];
  const facts = study.highlights;
  return <section className="section home-cs" aria-labelledby="home-cs-title"><div className="container">
    <div className="home-cs-head"><div><span className="eyebrow">OUR WORK · CASE STUDY</span><h2 id="home-cs-title" className="heading-lg">From blank building to a workshop you can&apos;t miss.</h2></div>
      <Link className="text-link" href="/case-studies">All case studies →</Link></div>
    <div className="home-cs-grid">
      <article className="home-cs-feature">
        <Link href={`/case-studies/${study.slug}`} className="home-cs-photo" aria-label={`Read the ${study.client} case study`}>
          <Image src={study.featured.src} alt={study.featured.alt} fill sizes="(max-width: 900px) 100vw, 60vw" style={study.heroPosition ? { objectPosition: study.heroPosition } : undefined} />
          <figure className="home-cs-before"><Image src={before.src} alt={before.alt} fill sizes="160px" /><figcaption>Before</figcaption></figure>
          <span className="home-cs-after">After</span>
        </Link>
        <div className="home-cs-body">
          <span className="home-cs-client">{study.client} · {study.category}</span>
          <h3><Link href={`/case-studies/${study.slug}`}>{study.title}</Link></h3>
          <dl className="home-cs-facts">{facts.map(([value, label]) => <div key={label}><dt>{value}</dt><dd>{label}</dd></div>)}</dl>
          {study.quote && study.quote.approved !== false && <blockquote>&ldquo;{study.quote.text.split(". ").slice(1, 3).join(". ")}.&rdquo;<footer>— {study.quote.name}, {study.quote.role}</footer></blockquote>}
          <div className="home-cs-actions"><Link className="button button-orange" href={`/case-studies/${study.slug}`}>Read the case study</Link><Link className="button button-light" href="/work">See all our work</Link></div>
        </div>
      </article>
      {study.reels.length > 0 && <div className="home-cs-reels"><span className="eyebrow">WATCH IT ON INSTAGRAM</span><div>{study.reels.slice(0, 2).map((id, index) => <InstagramReel key={id} id={id} title={`${study.client} project video ${index + 1} on Instagram`} />)}</div></div>}
    </div>
    {caseStudies.length > 1 && <div className="home-cs-more"><h3>More case studies</h3><div className="cs-grid">{caseStudies.slice(1, 3).map((item) => <CaseStudyCard key={item.slug} study={item} />)}</div></div>}
  </div></section>;
}
