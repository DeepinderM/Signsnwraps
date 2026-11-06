import Image from "next/image";
import Link from "next/link";
import type { MediaImage, MediaVideo } from "@/lib/data/media";
import { HeroVideo } from "./hero-video";

/** "Recent work" style gallery of real project photos with short captions. */
export function MediaGallery({ eyebrow, title, intro, images, link, tone = "light", video }: {
  eyebrow: string; title: string; intro?: string; images: MediaImage[]; link?: { href: string; label: string }; tone?: "light" | "plain";
  /** Optional clip shown as the first, two-row-tall tile. */
  video?: MediaVideo;
}) {
  return <section className={`section media-gallery-section${tone === "plain" ? " is-plain" : ""}`}>
    <div className="container">
      <div className="section-head">
        <div><span className="eyebrow">{eyebrow}</span><h2 className="heading-lg">{title}</h2></div>
        {intro || link ? <div className="media-gallery-side">{intro && <p className="body-lg">{intro}</p>}{link && <Link className="text-link" href={link.href}>{link.label}</Link>}</div> : null}
      </div>
      <ul className="media-gallery">
        {video && <li className="media-gallery-video"><figure><div className="media-gallery-frame"><HeroVideo video={video} /></div><figcaption>{video.label}</figcaption></figure></li>}
        {images.map((image) => <li key={image.src}>
          <figure>
            <div className="media-gallery-frame"><Image src={image.src} alt={image.alt} fill sizes="(max-width: 640px) 50vw, (max-width: 1000px) 33vw, 25vw" /></div>
            <figcaption>{image.caption}</figcaption>
          </figure>
        </li>)}
      </ul>
    </div>
  </section>;
}
