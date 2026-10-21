"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Car, Signpost } from "lucide-react";

// Large Signs | Wraps switch shown directly below the header on every page except
// the home page (which has its own chooser), admin and checkout flows.
const HIDDEN = [/^\/$/, /^\/admin/, /^\/wraps\/checkout/, /^\/billing\//];

const sections = [
  { href: "/signs", title: "Signs & Print", detail: "Signage · Shopfronts · Printing · Neon · Fleet", icon: Signpost, match: (path: string) => path.startsWith("/signs") },
  { href: "/wraps", title: "Wraps & PPF", detail: "Vehicle wraps · Colour PPF · DIY kits · Shop · Fleet", icon: Car, match: (path: string) => path.startsWith("/wraps") || path.startsWith("/trade") || path.startsWith("/account") },
];

export function SectionSwitch() {
  const pathname = usePathname();
  if (HIDDEN.some((pattern) => pattern.test(pathname))) return null;
  return (
    <nav className="explore" aria-label="Explore sections">
      <div className="container explore-inner">
        <p className="explore-label">Explore sections</p>
        <div className="explore-cards">
          {sections.map(({ href, title, detail, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <Link key={href} href={href} className={`explore-card${active ? " is-active" : ""}`} aria-current={active ? "true" : undefined}>
                <span className="explore-icon"><Icon aria-hidden strokeWidth={1.8} /></span>
                <span className="explore-text"><strong>{title}</strong><small>{detail}</small></span>
                <span className="explore-cta">{active ? "You're here" : <>Explore <ArrowRight aria-hidden /></>}</span>
              </Link>
            );
          })}
        </div>
      </div>
      <style>{`
        .explore{padding:18px 0 4px}
        .explore-inner{display:grid;gap:12px}
        .explore-label{margin:0;font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:var(--electric-blue-ink)}
        .explore-cards{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .explore-card{display:flex;align-items:center;gap:18px;min-height:104px;padding:18px 24px 18px 18px;border-radius:24px;background:#fff;border:1px solid rgba(0,0,0,.07);color:#0b0b0d;box-shadow:0 1px 2px rgba(0,0,0,.04),0 14px 34px -18px rgba(0,0,0,.25);transition:transform .2s ease,box-shadow .2s ease,border-color .2s}
        .explore-card:hover{transform:translateY(-2px);border-color:rgba(3,170,250,.55);box-shadow:0 2px 6px rgba(0,0,0,.05),0 24px 44px -20px rgba(0,0,0,.32)}
        .explore-icon{flex:0 0 auto;display:grid;place-items:center;width:60px;height:60px;border-radius:18px;background:rgba(3,170,250,.12);color:var(--electric-blue-ink)}
        .explore-icon svg{width:30px;height:30px}
        .explore-text{display:grid;gap:5px;min-width:0;flex:1}
        .explore-text strong{font-size:clamp(1.15rem,2vw,1.6rem);line-height:1.05;letter-spacing:-.03em;font-weight:850;text-transform:uppercase}
        .explore-text small{font-size:13px;line-height:1.35;color:#5f5f66}
        .explore-cta{flex:0 0 auto;display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:800;color:var(--electric-blue-ink)}
        .explore-cta svg{width:18px;height:18px;transition:transform .2s}.explore-card:hover .explore-cta svg{transform:translateX(3px)}
        .explore-card.is-active{background:#0b0b0d;border-color:#0b0b0d;color:#fff;box-shadow:inset 0 -4px 0 var(--electric-blue),0 18px 40px -22px rgba(0,0,0,.6)}
        .explore-card.is-active .explore-icon{background:rgba(3,170,250,.16);color:var(--electric-blue)}
        .explore-card.is-active small{color:#b9bec5}
        .explore-card.is-active .explore-cta{color:var(--electric-blue);font-size:11px;letter-spacing:.08em;text-transform:uppercase}
        @media(max-width:900px){.explore-card{gap:14px;min-height:92px;padding:14px 16px 14px 14px}.explore-icon{width:50px;height:50px;border-radius:15px}.explore-icon svg{width:26px;height:26px}.explore-cta{display:none}}
        @media(max-width:600px){.explore{padding:14px 0 0}.explore-cards{gap:10px}.explore-card{flex-direction:column;align-items:flex-start;gap:10px;min-height:0;padding:14px;border-radius:20px}.explore-icon{width:44px;height:44px;border-radius:13px}.explore-icon svg{width:23px;height:23px}.explore-text strong{font-size:1.05rem}.explore-text small{font-size:11.5px}}
        @media(prefers-reduced-motion:reduce){.explore-card,.explore-cta svg{transition:none}}
      `}</style>
    </nav>
  );
}
