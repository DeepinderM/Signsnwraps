"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import { usePathname } from "next/navigation";
import "@fontsource-variable/manrope";
// Trimmed web copies of the partner artwork with transparent backgrounds (originals in Assets/Logos).
// Logos are shown in full colour on light surfaces; on the dark footer, partners are listed as text links.
import quickSignageLogo from "../../../Assets/Logos/web/quick-signage.png";
import quickNeonsLogo from "../../../Assets/Logos/web/quickneons.png";
import bannerGuruLogo from "../../../Assets/Logos/web/banner-guru.png";
import prestigeCarCleaningLogo from "../../../Assets/Logos/web/prestige-car-cleaning.png";

type Partner = {
  name: string;
  url?: string;
  logo: StaticImageData;
  description: string;
  /** Near-square artwork: use tighter tile padding so it reads at the same visual size as wide logos. */
  compact?: boolean;
};

const partners: Partner[] = [
  {
    name: "Quick Signage",
    url: "https://www.quicksignage.com.au/",
    logo: quickSignageLogo,
    description: "Signage, 3D and illuminated signs, and print, based in Geelong.",
  },
  {
    name: "QuickNeons",
    url: "https://quickneons.com.au/",
    logo: quickNeonsLogo,
    description: "Custom LED neon signs, designed and made to order.",
  },
  {
    name: "BannerGuru",
    url: "https://bannerguru.com.au/",
    logo: bannerGuruLogo,
    description: "Our large-format print production partner: banners, corflute, stickers and pull-ups, printed in-house in Geelong.",
  },
  {
    name: "Prestige Car Cleaning",
    logo: prestigeCarCleaningLogo,
    description: "Car cleaning and vehicle detailing.",
    compact: true,
  },
];

function PartnerLogo({ partner, variant }: { partner: Partner; variant: "strip" | "cards" }) {
  const [missing, setMissing] = useState(false);

  return (
    <span className={`partner-logo partner-logo-${variant}${partner.compact ? " partner-logo-compact" : ""}`}>
      {!missing ? (
        <Image
          src={partner.logo}
          alt={`${partner.name} logo`}
          width={partner.logo.width}
          height={partner.logo.height}
          sizes={variant === "cards" ? "260px" : "180px"}
          onError={() => setMissing(true)}
        />
      ) : (
        <span className="partner-logo-fallback" role="img" aria-label={`${partner.name} logo`}>
          {partner.name}
        </span>
      )}
    </span>
  );
}

function PartnerLink({ partner, variant }: { partner: Partner; variant: "strip" }) {
  const content = (
    <PartnerLogo partner={partner} variant={variant} />
  );

  if (!partner.url) return <span className={`partner-logo-link partner-logo-link-${variant}`}>{content}</span>;

  return (
    <a
      className={`partner-logo-link partner-logo-link-${variant}`}
      href={partner.url}
      target="_blank"
      rel="noopener"
      aria-label={`${partner.name} — opens in a new tab`}
    >
      {content}
    </a>
  );
}

export function ProudPartners({ variant }: { variant: "strip" | "cards" | "footer" }) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let revertContext: (() => void) | undefined;
    let cancelled = false;
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([gsapModule, scrollTriggerModule]) => {
      if (cancelled || !sectionRef.current) return;
      const { gsap } = gsapModule;
      gsap.registerPlugin(scrollTriggerModule.ScrollTrigger);
      const context = gsap.context(() => {
        gsap.fromTo(
          ".partner-reveal",
          { autoAlpha: 0, y: 20 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.1,
            ease: "power2.out",
            scrollTrigger: { trigger: sectionRef.current, start: "top 88%", once: true },
          },
        );
      }, sectionRef);
      revertContext = () => context.revert();
    });
    return () => { cancelled = true; revertContext?.(); };
  }, []);

  if (variant === "strip") {
    return (
      <section className="proud-partners partners-strip" aria-label="Proud partners" ref={sectionRef}>
        <div className="partners-strip-inner">
          <p className="partners-label partner-reveal">PROUD PARTNER OF</p>
          <div className="partners-strip-logos">
            {partners.map((partner) => <PartnerLink key={partner.name} partner={partner} variant="strip" />)}
          </div>
        </div>
        <PartnersStyles />
      </section>
    );
  }

  if (variant === "cards") {
    return (
      <section className="proud-partners partners-cards-section" aria-labelledby="partners-heading" ref={sectionRef}>
        <div className="container">
          <div className="partners-cards-heading partner-reveal">
            <span className="partners-kicker">PROUD PARTNERS</span>
            <h2 id="partners-heading">Backed by the specialists.</h2>
            <p>Signsnwraps works with the teams behind Quick Signage, QuickNeons and BannerGuru, so every sign is planned, produced and installed by specialists.</p>
          </div>
          <div className="partners-cards-grid">
            {partners.map((partner) => (
              <article className="partner-card partner-reveal" key={partner.name}>
                <div className="partner-card-logo"><PartnerLogo partner={partner} variant="cards" /></div>
                <p>{partner.description}</p>
                {partner.url ? <a className="partner-visit-link" href={partner.url} target="_blank" rel="noopener">Visit site <span aria-hidden="true">→</span></a> : <span className="partner-affiliation">Vehicle care</span>}
              </article>
            ))}
          </div>
        </div>
        <PartnersStyles />
      </section>
    );
  }

  return (
    <section className="proud-partners partners-footer" aria-label="Proud partner of" ref={sectionRef}>
      <span className="partners-label partner-reveal">PROUD PARTNER OF</span>
      <ul className="partners-footer-names">
        {partners.map((partner) => <li key={partner.name}>{partner.url ? <a href={partner.url} target="_blank" rel="noopener">{partner.name}</a> : <span>{partner.name}</span>}</li>)}
      </ul>
      <PartnersStyles />
    </section>
  );
}

export function SignsFooterPartners() {
  const pathname = usePathname();
  if (!pathname.startsWith("/signs")) return null;
  return <ProudPartners variant="footer" />;
}

function PartnersStyles() {
  return (
    <style>{`
      .proud-partners{--partner-ink:#0A0B0D;--partner-blue:#03AAFA;color:#fff;font-family:var(--sans);}
      .partners-label,.partners-kicker{font-family:"Manrope Variable",Manrope,Inter,sans-serif;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--partner-blue);}
      .partners-label{font-size:10px;white-space:nowrap;margin:0;}
      .partner-logo{display:flex;align-items:center;justify-content:center;max-width:100%;box-sizing:border-box;}
      .partner-logo img{display:block;width:auto;height:auto;max-width:100%;max-height:100%;object-fit:contain;}
      .partner-logo-fallback{font-family:"Manrope Variable",Manrope,Inter,sans-serif;font-size:clamp(15px,1.4vw,20px);line-height:1;font-weight:800;letter-spacing:-.04em;color:#0A0B0D;white-space:nowrap;}
      .partner-logo-strip.partner-logo-compact{height:74px;margin:-8px auto;}.partner-logo-cards.partner-logo-compact{height:104px;margin:-6px 0;}
      .partner-logo-link{display:inline-flex;align-items:center;justify-content:center;min-width:0;transition:transform .2s ease,opacity .2s ease;}
      .partner-logo-link:hover{transform:translateY(-2px);opacity:.85;}
      .partners-strip{background:#f2f3f5;border-bottom:1px solid #e3e5e8;padding:26px 0;}
      .partners-strip .partners-label{color:var(--electric-blue-ink);}
      .partners-strip-inner{width:min(1240px,calc(100% - 48px));margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:40px;}
      .partners-strip-logos{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));align-items:center;justify-items:center;gap:28px;flex:1;}
      .partner-logo-link-strip{width:100%;}
      .partner-logo-strip{width:100%;max-width:190px;height:58px;margin:0 auto;}
      .partners-cards-section{background:#fff;padding:90px 0;}
      .partners-cards-heading{max-width:760px;margin-bottom:34px;}
      .partners-cards-heading h2{font-family:"Manrope Variable",Manrope,Inter,sans-serif;font-weight:800;font-size:clamp(2rem,4vw,3.4rem);line-height:1.05;letter-spacing:-.055em;color:#0A0B0D;margin:12px 0;}
      .partners-cards-heading p{max-width:710px;color:#333;font-size:15px;line-height:1.7;margin:0;}
      .partners-kicker{font-size:10px;color:var(--electric-blue-ink);}
      .partners-cards-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;}
      .partner-card{min-height:255px;padding:26px;background:#fff;border:1px solid #e3e5e8;border-top:4px solid var(--partner-blue);display:flex;flex-direction:column;align-items:flex-start;}
      .partner-card-logo{width:100%;}
      .partner-logo-cards{width:100%;height:92px;padding:6px 0;justify-content:flex-start;}
      
      .partner-card>p{font-size:13px;line-height:1.65;color:#444;margin:18px 0 24px;flex:1;}
      .partner-visit-link{font-size:12px;font-weight:700;color:#0A0B0D;display:inline-flex;gap:8px;align-items:center;border-bottom:1px solid var(--partner-blue);padding-bottom:6px;}
      .partner-visit-link:hover{color:var(--electric-blue-ink);}
      .partner-affiliation{font-size:12px;color:#666;}
      .partners-footer{border-top:1px solid #ffffff25;padding:23px 0;margin-bottom:25px;display:flex;align-items:center;justify-content:space-between;gap:24px;}
      .partners-footer-names{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px 26px;}
      .partners-footer-names a,.partners-footer-names span{font-size:13px;font-weight:600;color:#cfd3d8;}
      .partners-footer-names a:hover{color:var(--partner-blue);}
      @media(max-width:950px){.partners-cards-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}
      @media(max-width:800px){.partners-strip{padding:22px 0;}.partners-strip-inner{width:calc(100% - 36px);display:grid;gap:18px;justify-items:center}.partners-strip-logos{width:100%;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 20px}.partner-logo-strip{height:50px}.partner-logo-strip .partner-logo-fallback{font-size:clamp(11px,3vw,16px)}.partners-cards-section{padding:66px 0}.partner-card{min-height:210px}}
      @media(max-width:600px){.partners-cards-grid{grid-template-columns:1fr;}}
      @media(max-width:540px){.partners-footer{align-items:flex-start;flex-direction:column;gap:12px}.partners-strip-logos{gap:16px}}
      @media(prefers-reduced-motion:reduce){.partner-logo-link{transition:none!important}.partner-reveal{visibility:visible!important;opacity:1!important;transform:none!important}}
    `}</style>
  );
}
