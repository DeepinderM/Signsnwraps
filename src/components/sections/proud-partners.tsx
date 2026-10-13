"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import { usePathname } from "next/navigation";
import "@fontsource-variable/manrope";
import quickSignageLogo from "../../../Assets/Logos/quick-signage-Geelong.webp";
import quickNeonsLogo from "../../../Assets/Logos/Quickneons-logo.png";
import bannerGuruLogo from "../../../Assets/Logos/Banner Guru (1).png";
import prestigeCarCleaningLogo from "../../../Assets/Logos/Prestige car Cleaning-logo.png";

type Partner = {
  name: string;
  url?: string;
  logo: StaticImageData;
  description: string;
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
  },
];

function PartnerLogo({ partner, variant }: { partner: Partner; variant: "strip" | "cards" | "footer" }) {
  const [missing, setMissing] = useState(false);
  const size = variant === "footer" ? 28 : 40;

  return (
    <span className={`partner-logo partner-logo-${variant}`}>
      {!missing ? (
        <Image
          src={partner.logo}
          alt={`${partner.name} logo`}
          width={partner.logo.width}
          height={partner.logo.height}
          style={{ height: size, width: "auto" }}
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

function PartnerLink({ partner, variant }: { partner: Partner; variant: "strip" | "footer" }) {
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
      <div className="partners-footer-logos">
        {partners.map((partner) => <PartnerLink key={partner.name} partner={partner} variant="footer" />)}
      </div>
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
      .partner-logo{display:inline-flex;align-items:center;justify-content:center;max-width:100%;}
      .partner-logo img{display:block;max-width:min(100%,220px);object-fit:contain;filter:grayscale(1) brightness(0) invert(1);transition:filter .2s ease;}
      .partner-logo-fallback{font-family:"Manrope Variable",Manrope,Inter,sans-serif;font-size:clamp(15px,1.4vw,20px);line-height:1;font-weight:800;letter-spacing:-.04em;color:#fff;white-space:nowrap;}
      .partner-logo-link{display:inline-flex;align-items:center;justify-content:center;min-width:0;}
      .partner-logo-link:hover .partner-logo img{filter:none;}
      .partner-logo-link:hover .partner-logo-fallback{color:var(--partner-blue);}
      .partners-strip{height:120px;background:var(--partner-ink);display:flex;align-items:center;}
      .partners-strip-inner{width:min(1240px,calc(100% - 48px));margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:36px;}
      .partners-strip-logos{display:grid;grid-template-columns:repeat(4,minmax(120px,1fr));align-items:center;justify-items:center;gap:20px;flex:1;}
      .partner-logo-link-strip{min-height:48px;padding:4px 14px;}
      .partner-logo-strip{height:40px;}
      .partner-logo-strip img{height:40px!important;}
      .partners-cards-section{background:#fff;padding:90px 0;}
      .partners-cards-heading{max-width:760px;margin-bottom:34px;}
      .partners-cards-heading h2{font-family:"Manrope Variable",Manrope,Inter,sans-serif;font-weight:800;font-size:clamp(2rem,4vw,3.4rem);line-height:1.05;letter-spacing:-.055em;color:#0A0B0D;margin:12px 0;}
      .partners-cards-heading p{max-width:710px;color:#333;font-size:15px;line-height:1.7;margin:0;}
      .partners-kicker{font-size:10px;}
      .partners-cards-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;}
      .partner-card{min-height:255px;padding:26px;background:#15181C;border-top:4px solid var(--partner-blue);display:flex;flex-direction:column;align-items:flex-start;}
      .partner-card-logo{height:48px;display:flex;align-items:center;}
      .partner-logo-cards{height:40px;}
      .partner-logo-cards img{height:40px!important;}
      .partner-card>p{font-size:13px;line-height:1.65;color:#e7e9eb;margin:22px 0 24px;flex:1;}
      .partner-visit-link{font-size:12px;font-weight:700;color:#fff;display:inline-flex;gap:8px;align-items:center;border-bottom:1px solid var(--partner-blue);padding-bottom:6px;}
      .partner-visit-link:hover{color:var(--partner-blue);}
      .partner-affiliation{font-size:12px;color:#aeb4bd;}
      .partners-footer{border-top:1px solid #ffffff25;padding:23px 0;margin-bottom:25px;display:flex;align-items:center;justify-content:space-between;gap:24px;}
      .partners-footer-logos{display:flex;align-items:center;gap:32px;}
      .partner-logo-link-footer{opacity:.62;transition:opacity .2s ease;}
      .partner-logo-link-footer:hover{opacity:1;}
      .partner-logo-footer{height:28px;}
      .partner-logo-footer img{height:28px!important;}
      .partner-logo-footer .partner-logo-fallback{font-size:13px;}
      @media(max-width:950px){.partners-cards-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}
      @media(max-width:800px){.partners-strip{height:auto;min-height:120px;padding:24px 0;}.partners-strip-inner{width:calc(100% - 36px);display:grid;gap:18px;justify-items:center}.partners-strip-logos{width:100%;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.partner-logo-link-strip{width:100%;padding:6px 4px}.partner-logo-strip .partner-logo-fallback{font-size:clamp(11px,3vw,16px)}.partners-cards-section{padding:66px 0}.partner-card{min-height:210px}}
      @media(max-width:600px){.partners-cards-grid{grid-template-columns:1fr;}}
      @media(max-width:540px){.partners-footer{align-items:flex-start;flex-direction:column;gap:15px}.partners-footer-logos{width:100%;justify-content:space-between;gap:10px}.partner-logo-link-footer{max-width:32%}.partner-logo-footer .partner-logo-fallback{font-size:11px}.partners-strip-logos{gap:0}}
      @media(prefers-reduced-motion:reduce){.partner-logo img,.partner-logo-link-footer{transition:none!important}.partner-reveal{visibility:visible!important;opacity:1!important;transform:none!important}}
    `}</style>
  );
}
