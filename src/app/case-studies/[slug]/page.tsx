import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { caseStudies, getCaseStudy, type CaseImage, type CaseVideo } from "@/lib/data/case-studies";
import { InstagramReel } from "@/components/case-studies/instagram-reel";
import { CaseStudyCard } from "@/components/case-studies/case-study-card";
import { ConsultationCTA } from "@/components/sections/blocks";
import { FaqSection } from "@/components/seo/faq-section";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, BUSINESS_ID, ORG_ID, pageMetadata } from "@/lib/seo";
import quickNeonsLogo from "../../../../Assets/Logos/web/quickneons.png";
import quickSignageLogo from "../../../../Assets/Logos/web/quick-signage.png";

const partnerLogos = { quickneons: quickNeonsLogo, "quick-signage": quickSignageLogo };

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return caseStudies.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const study = getCaseStudy((await params).slug);
  if (!study) return { title: "Case study not found" };
  const base = pageMetadata({ title: study.seoTitle, absoluteTitle: true, description: study.metaDescription, path: `/case-studies/${study.slug}`, type: "article" });
  const image = { url: study.featured.src, width: study.featured.width, height: study.featured.height, alt: study.featured.alt };
  return { ...base, openGraph: { ...base.openGraph, images: [image] }, twitter: { ...base.twitter, images: [study.featured.src] } };
}

// Galleries crop to one shape so the rows line up: 3:4 when mostly portrait, square when portrait and landscape are mixed.
const galleryShape = (images: CaseImage[]) => {
  const portrait = images.filter((image) => image.height > image.width).length;
  // Up to three photos: one justified row (widths follow each photo's shape, so heights match and nothing is cropped).
  if (images.length <= 3 && portrait > 0 && portrait < images.length) return " is-row";
  return portrait > images.length / 2 ? " is-portrait" : portrait > 0 && images.length > 2 ? " is-mixed" : "";
};
const Gallery = ({ images, label, wide = false }: { images: CaseImage[]; label: string; wide?: boolean }) => <div className={`cs-gallery cs-gallery-${images.length}${wide ? " is-wide" : ""}${galleryShape(images)}`} role="group" aria-label={label}>
  {images.map((image) => <figure key={image.src} className="cs-photo" style={{ ["--ar" as string]: image.width / image.height }}><Image src={image.src} alt={image.alt} width={image.width} height={image.height} sizes="(max-width: 760px) 100vw, 50vw" /></figure>)}
</div>;

/** Photos with a video: the video is a tall tile on the left (two rows), photos are square tiles in rows beside it. */
const MediaGrid = ({ images, video, label }: { images: CaseImage[]; video: CaseVideo; label: string }) => <div className="cs-media-grid" role="group" aria-label={label} style={{ ["--cols" as string]: Math.max(1, Math.ceil(images.length / 2)) }}>
  <figure className="cs-media-video"><video controls preload="none" playsInline poster={video.poster} width={video.width} height={video.height}><source src={video.src} type="video/mp4" />{video.description}</video><span className="cs-media-tag">▶ Video</span><figcaption className="sr-only">{video.title}</figcaption></figure>
  {images.map((image) => <figure key={image.src} className="cs-media-photo"><Image src={image.src} alt={image.alt} width={image.width} height={image.height} sizes="(max-width: 700px) 50vw, 25vw" /></figure>)}
</div>;

const VideoFigure = ({ video }: { video: CaseVideo }) => <figure className="cs-video cs-video-solo"><video controls preload="none" playsInline poster={video.poster} width={video.width} height={video.height}><source src={video.src} type="video/mp4" />{video.description}</video><figcaption>{video.title}</figcaption></figure>;

/** A full project story: summary, snapshot, before photos, design / production / installation, after photos, quote, reels, FAQ. */
export default async function CaseStudyPage({ params }: Props) {
  const study = getCaseStudy((await params).slug);
  if (!study) notFound();
  const url = absoluteUrl(`/case-studies/${study.slug}`);
  const others = caseStudies.filter((item) => item.slug !== study.slug).slice(0, 2);
  const article = {
    "@context": "https://schema.org", "@type": "Article", headline: study.title, description: study.metaDescription, image: absoluteUrl(study.featured.src),
    datePublished: study.published, dateModified: study.published, author: { "@id": ORG_ID }, publisher: { "@id": ORG_ID }, mainEntityOfPage: url,
    ...(study.partner ? { contributor: { "@type": "Organization", name: study.partner.name, url: study.partner.url } } : {}),
    about: { "@type": "Service", name: study.service, provider: { "@id": BUSINESS_ID }, areaServed: study.location },
  };
  const snapshot: [string, React.ReactNode][] = [
    ...(study.snapshot ?? [["Client", study.client], ["Industry", study.industry], ["Location", study.location], ["Service", study.service], ["Signage types", study.signageTypes], ...(study.timeline ? [["Timeline", study.timeline] as [string, string]] : [])]),
    ...(study.partner ? [[study.partner.label ?? "Signage partner", <><a key="p" href={study.partner.url} target="_blank" rel="noopener">{study.partner.name}</a>{study.partner.note}</>] as [string, React.ReactNode]] : []),
  ];

  return <article className="cs-page">
    <JsonLd data={article} />
    {[study.production?.video, study.installation?.video, study.result.video].filter((video): video is CaseVideo => !!video).map((video) => <JsonLd key={video.src} data={{ "@context": "https://schema.org", "@type": "VideoObject", name: video.title, description: video.description, thumbnailUrl: absoluteUrl(video.poster), contentUrl: absoluteUrl(video.src), uploadDate: video.uploadDate, duration: video.duration }} />)}
    <header className="cs-hero image-frame">
      <Image src={study.featured.src} alt={study.featured.alt} fill priority sizes="100vw" style={study.heroPosition ? { objectPosition: study.heroPosition } : undefined} />
      <div className="cs-hero-shade"><div className="container">
        <span className="eyebrow">CASE STUDY · {study.category.toUpperCase()}</span>
        <h1 className="heading-xl">{study.title}</h1>
        <p className="cs-hero-meta">{study.location}{study.timeline ? ` · ${study.timeline.split(" (")[0]} from design to installation` : ` · ${study.highlights.map(([value, label]) => `${value} ${label}`)[0]}`}</p>
      </div></div>
    </header>

    <section className="section cs-intro-row"><div className="container cs-two">
      <p className="body-lg cs-summary"><b>Project summary:</b> {study.summary}</p>
      <aside className="cs-snapshot" aria-label="Project snapshot"><h2>Project snapshot</h2><dl>{snapshot.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></aside>
    </div></section>

    {study.journey && <section className="section cs-block cs-journey-section"><div className="container">
      <span className="eyebrow">HOW IT STARTED</span><h2 className="heading-lg">{study.journey.title}</h2>
      <div className="cs-text"><p>{study.journey.intro}</p></div>
      <ol className="cs-journey">{study.journey.steps.map((step, index) => <li key={step.label}><span className="cs-journey-num" aria-hidden>{index + 1}</span><b>{step.label}</b><p>{step.text}</p></li>)}</ol>
    </div></section>}

    <section className="section cs-block"><div className="container">
      <span className="eyebrow">BEFORE</span><h2 className="heading-lg">{study.challenge.title}</h2>
      <div className="cs-text">{study.challenge.paragraphs.map((text) => <p key={text}>{text}</p>)}{study.challenge.needs.length > 0 && <ul className="cs-list">{study.challenge.needs.map((need) => <li key={need}>{need}</li>)}</ul>}</div>
      <Gallery images={study.challenge.before} label="Before photos" />
    </div></section>

    {study.design && <section className="section cs-block cs-tint"><div className="container cs-two">
      <div><span className="eyebrow">DESIGN</span><h2 className="heading-lg">{study.design.title}</h2><p className="cs-lead">{study.design.intro}</p>{study.design.image && <figure className="cs-photo cs-design-photo"><Image src={study.design.image.src} alt={study.design.image.alt} width={study.design.image.width} height={study.design.image.height} sizes="320px" /></figure>}</div>
      <div className="cs-text"><ul className="cs-points">{study.design.points.map((point) => <li key={point.label}><b>{point.label}:</b> {point.text}</li>)}</ul>{study.design.finish && <p>{study.design.finish}</p>}</div>
    </div></section>}

    {study.mockups && <section className="section cs-block cs-tint"><div className="container">
      <span className="eyebrow">DESIGN &amp; MOCKUPS</span><h2 className="heading-lg">{study.mockups.title}</h2>
      <div className="cs-text"><p>{study.mockups.intro}</p>{study.mockups.text?.map((text) => <p key={text}>{text}</p>)}</div>
      {study.mockups.steps && <ol className="cs-steps">{study.mockups.steps.map((step) => <li key={step.label}><b>{step.label}:</b> {step.text}</li>)}</ol>}
      <Gallery images={study.mockups.images} label="Design mockups" wide />
    </div></section>}

    {study.specs && <section className="section cs-block"><div className="container">
      <span className="eyebrow">SPECIFICATIONS</span><h2 className="heading-lg">{study.specs.title}</h2>
      <div className="cs-spec-wrap"><table className="cs-specs"><thead><tr>{study.specs.columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr></thead>
        <tbody>{study.specs.rows.map((row) => <tr key={row[0]}>{row.map((cell, index) => index === 0 ? <th key={index} scope="row">{cell}</th> : <td key={index}>{cell}</td>)}</tr>)}</tbody></table></div>
      {study.specs.note && <p className="cs-spec-note">{study.specs.note}</p>}
    </div></section>}

    {study.production && (study.production.points ? <section className="section cs-block"><div className="container cs-two">
      <div><span className="eyebrow">PRODUCTION</span><h2 className="heading-lg">{study.production.title}</h2><p className="cs-lead">{study.production.intro}</p></div>
      <ul className="cs-points cs-text">{study.production.points.map((point) => <li key={point.label}><b>{point.label}</b> {point.text}</li>)}</ul>
    </div></section> : <section className="section cs-block"><div className="container">
      <span className="eyebrow">PRODUCTION</span><h2 className="heading-lg">{study.production.title}</h2>
      <div className="cs-text"><p>{study.production.intro}</p>{study.production.paragraphs?.map((text) => <p key={text}>{text}</p>)}</div>
      {study.production.images && study.production.video ? <MediaGrid images={study.production.images} video={study.production.video} label="Production photos and video" />
        : study.production.images ? <Gallery images={study.production.images} label="Production photos" /> : study.production.video && <VideoFigure video={study.production.video} />}
    </div></section>)}

    {study.installation?.images && <section className="section cs-block cs-tint"><div className="container">
      <span className="eyebrow">PRODUCTION &amp; INSTALLATION</span><h2 className="heading-lg">{study.installation.title}</h2>
      <div className="cs-text">{study.installation.paragraphs.map((text) => <p key={text}>{text}</p>)}</div>
      <Gallery images={study.installation.images} label="Production and installation photos" />
    </div></section>}
    {study.installation && !study.installation.images && <section className="section cs-block cs-tint"><div className="container cs-two cs-align">
      <div><span className="eyebrow">INSTALLATION</span><h2 className="heading-lg">{study.installation.title}</h2><div className="cs-text">{study.installation.paragraphs.map((text) => <p key={text}>{text}</p>)}</div></div>
      {study.installation.video ? <figure className="cs-media-video cs-install-video"><video controls preload="none" playsInline poster={study.installation.video.poster} width={study.installation.video.width} height={study.installation.video.height}><source src={study.installation.video.src} type="video/mp4" />{study.installation.video.description}</video><span className="cs-media-tag">▶ Video</span><figcaption className="sr-only">{study.installation.video.title}</figcaption></figure>
        : study.installation.image && <figure className="cs-photo"><Image src={study.installation.image.src} alt={study.installation.image.alt} width={study.installation.image.width} height={study.installation.image.height} sizes="(max-width: 760px) 100vw, 50vw" /></figure>}
    </div></section>}

    <section className="section cs-block"><div className="container">
      <span className="eyebrow">AFTER</span><h2 className="heading-lg">{study.result.title}</h2>
      <div className="cs-text">{study.result.paragraphs.map((text) => <p key={text}>{text}</p>)}</div>
      {study.result.video ? <MediaGrid images={study.result.after} video={study.result.video} label="After photos and video" /> : <Gallery images={study.result.after} label="After photos" />}
      {study.quote && study.quote.approved !== false && <blockquote className="cs-quote"><p>&ldquo;{study.quote.text}&rdquo;</p><footer>— <b>{study.quote.name}</b>, {study.quote.role}</footer></blockquote>}
    </div></section>

    {study.relationship && <section className="section cs-block cs-tint"><div className="container">
      <span className="eyebrow">LONG-TERM PARTNER</span><h2 className="heading-lg">{study.relationship.title}</h2>
      <div className="cs-text"><p>{study.relationship.intro}</p><ul className="cs-list">{study.relationship.items.map((item) => <li key={item.text}><b>{item.label}</b> {item.text}</li>)}</ul><p>{study.relationship.outro}</p></div>
    </div></section>}

    {study.reels.length > 0 && <section className="section cs-block cs-reels-section"><div className="container">
      <span className="eyebrow">WATCH THE PROJECT</span><h2 className="heading-lg">See it on Instagram.</h2>
      <div className="cs-reels">{study.reels.map((id, index) => <InstagramReel key={id} id={id} title={`${study.client} project video ${index + 1} on Instagram`} />)}</div>
    </div></section>}

    {study.earlier && <section className="section cs-block cs-earlier" id="earlier-projects"><div className="container">
      <span className="eyebrow">EARLIER PROJECTS</span><h2 className="heading-lg">{study.earlier.title}</h2>
      <div className="cs-text"><p>{study.earlier.intro}</p></div>
      {study.earlier.groups.map((group) => <div key={group.title} className="cs-earlier-group"><h3>{group.title}</h3><p>{group.text}</p><Gallery images={group.images} label={group.title} /></div>)}
      {study.earlier.videos.length > 0 && <div className="cs-earlier-group"><h3>Videos from these projects</h3>
        <div className="cs-videos">{study.earlier.videos.map((video) => <figure key={video.src} className={`cs-video${video.height > video.width ? " is-portrait" : ""}`}>
          <video controls preload="none" playsInline poster={video.poster} width={video.width} height={video.height}><source src={video.src} type="video/mp4" /></video>
          <figcaption>{video.title}</figcaption></figure>)}</div></div>}
    </div></section>}

    {study.why && <section className="section cs-block cs-tint"><div className="container">
      <span className="eyebrow">WHY IT WORKS</span><h2 className="heading-lg">{study.why.title}</h2>
      <ol className="cs-why">{study.why.points.map((point) => <li key={point.label}><b>{point.label}</b> {point.text}</li>)}</ol>
    </div></section>}

    {study.partnerSection && study.partner && <section className="section cs-block"><div className={`container${study.partnerSection.image ? " cs-two cs-align" : ""}`}>
      <div><span className="eyebrow">OUR PARTNER</span>{study.partner.logo && <a className="cs-partner-logo" href={study.partner.url} target="_blank" rel="noopener" aria-label={`${study.partner.name} website`}><Image src={partnerLogos[study.partner.logo]} alt={`${study.partner.name} logo`} sizes="220px" /></a>}<h2 className="heading-lg">{study.partnerSection.title}</h2><div className="cs-text">{study.partnerSection.paragraphs.map((text) => <p key={text}>{text.split(study.partner!.name).flatMap((part, index, all) => index < all.length - 1 ? [part, <a key={index} href={study.partner!.url} target="_blank" rel="noopener">{study.partner!.name}</a>] : [part])}</p>)}</div>{study.partner.logo && <a className="cs-card-link" href={study.partner.url} target="_blank" rel="noopener">Visit {study.partner.name} →</a>}</div>
      {study.partnerSection.image && <figure className="cs-photo"><Image src={study.partnerSection.image.src} alt={study.partnerSection.image.alt} width={study.partnerSection.image.width} height={study.partnerSection.image.height} sizes="(max-width: 760px) 100vw, 50vw" /></figure>}
    </div></section>}

    <FaqSection items={study.faqs} title="Frequently asked questions." eyebrow="QUESTIONS & ANSWERS" />

    {others.length > 0 && <section className="section"><div className="container"><h2 className="grid-heading">More case studies</h2><div className="cs-grid">{others.map((item) => <CaseStudyCard key={item.slug} study={item} />)}</div></div></section>}
    <ConsultationCTA title={study.cta.title} text={study.cta.text} />
    <p className="container cs-back"><Link href="/case-studies">← All case studies</Link> · <Link href="/work">All projects</Link></p>
  </article>;
}
