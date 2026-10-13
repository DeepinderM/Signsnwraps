"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import darkLogo from "../../../Assets/logo1.png";

const signsNav = [
  { href: "/signs/signage", label: "Signage" },
  { href: "/signs/shopfronts", label: "Shopfronts" },
  { href: "/signs/printing", label: "Printing" },
  { href: "/signs/neon", label: "Neon" },
  { href: "/signs/projects", label: "Projects" },
];
const wrapsNav = [
  { href: "/wraps/vehicle-wraps", label: "Vehicle Wraps" },
  { href: "/wraps/ppf", label: "PPF" },
  { href: "/wraps/kits", label: "DIY Kits" },
  { href: "/wraps/installers", label: "Find an Installer" },
  { href: "/wraps/film", label: "The Film" },
];

export function Header() {
  const [compact, setCompact] = useState(false);
  const pathname = usePathname();
  const isWraps = pathname.startsWith("/wraps") || pathname.startsWith("/trade");
  const isSigns = pathname.startsWith("/signs");
  const nav = isWraps ? wrapsNav : signsNav;
  const consultationHref = isWraps ? "/wraps/book" : isSigns ? "/signs/book" : "/book";

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header${compact ? " is-compact" : ""}`}>
      <div className="container header-inner">
        <div className="header-top">
          <Link className="brand" href="/" aria-label="SIGNSNWRAPS home">
            <Image src={darkLogo} alt="SIGNSNWRAPS" priority className="brand-image" sizes="180px" />
          </Link>
          <div className="side-switch-wrap">
            <span className="side-switch-label">EXPLORE SECTIONS <span aria-hidden="true">›</span></span>
            <nav className="side-switch" aria-label="Choose a Signs or Wraps section">
              <Link href="/signs" className={isSigns ? "active" : ""} aria-current={isSigns ? "page" : undefined}>
                <span className="switch-title">SIGNS & PRINT</span><small>Signage · Shopfronts · Neon</small>
              </Link>
              <Link href="/wraps" className={isWraps ? "active" : ""} aria-current={isWraps ? "page" : undefined}>
                <span className="switch-title">WRAPS & PPF</span><small>Vehicle wraps · PPF · DIY kits</small>
              </Link>
            </nav>
          </div>
          <div className="header-actions">
            {isWraps && <Link className="cart-link" href="/wraps/cart" aria-label="Shopping cart">▢<small>Cart</small></Link>}
            <Link className="button button-orange header-book" href={consultationHref}><span className="header-book-full">Book an In-Store Consultation</span><span className="header-book-short">Book</span> ↗</Link>
            <details className="mobile-menu"><summary aria-label="Open navigation menu"><span/><span/></summary><nav aria-label="Mobile navigation">
              <div className="mobile-switch"><Link href="/signs" className={isSigns ? "active" : ""}>Signs & Print</Link><Link href="/wraps" className={isWraps ? "active" : ""}>Wraps & PPF</Link></div>
              {nav.map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}
              <Link href="/about">About</Link><Link href="/contact">Contact</Link>
              {isWraps && <Link href="/wraps/cart">View cart</Link>}
              <Link className="mobile-book" href={consultationHref}>Book consultation ↗</Link>
            </nav></details>
          </div>
        </div>
        <nav className="desktop-nav" aria-label={`${isWraps ? "Wraps" : "Signs"} navigation`}>
          {nav.map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
      </div>
      <style>{`
        .site-header{height:120px;position:sticky;top:0;z-index:50;background:#000;border-bottom:1px solid #ffffff30;transition:height .2s ease;color:#fff}.site-header.is-compact{height:104px}
        .header-inner{height:100%;display:flex;flex-direction:column;justify-content:space-between}.header-top{height:71px;flex:1 0 71px;display:flex;align-items:center;justify-content:space-between;gap:14px}
        .brand{display:flex;align-items:center;flex:0 0 170px;height:100%;overflow:hidden}.brand-image{width:170px;height:auto;object-fit:contain}
        .side-switch-wrap{display:flex;align-items:center;gap:9px;flex:0 0 auto}.side-switch-label{display:flex;align-items:center;gap:5px;white-space:nowrap;font-size:9px;letter-spacing:.1em;font-weight:800;color:#fff}.side-switch-label span{font-size:18px;color:var(--electric-blue);line-height:1}
        .side-switch{display:flex;align-items:stretch;gap:5px;padding:3px;background:#000}.side-switch>a{display:flex;flex-direction:column;justify-content:center;gap:4px;min-width:142px;padding:7px 11px;border:1px solid #686868;background:#1d1d1d;color:#ddd;text-decoration:none;transition:background .2s,color .2s,border-color .2s}.side-switch .switch-title{font-size:11px;line-height:1;font-weight:900;letter-spacing:.08em}.side-switch small{font-size:8px;line-height:1.15;color:#aaa;white-space:nowrap}.side-switch>a.active{background:#fff;border-color:#fff;color:#000;box-shadow:inset 0 -3px 0 var(--electric-blue)}.side-switch>a.active small{color:#333}.side-switch>a:not(.active):hover{background:#303030;border-color:#888;color:#fff}.side-switch>a:not(.active):hover small{color:#fff}
        .desktop-nav{height:48px;flex:0 0 48px;width:100%;display:flex;justify-content:center;gap:clamp(24px,3vw,44px);align-items:center;border-top:1px solid #ffffff25;background:#0a0b0d}.desktop-nav a{font-size:14px;font-weight:600;letter-spacing:.015em;color:#e3e3e3;white-space:nowrap}.desktop-nav a:hover{color:var(--electric-blue)}
        .header-actions{display:flex;align-items:center;gap:12px}.header-book{min-height:44px;padding:0 12px;font-size:9px;text-transform:uppercase;white-space:nowrap}.header-book-short{display:none}.cart-link{display:grid;justify-items:center;gap:1px;color:#fff}.cart-link small{font-size:8px}.mobile-menu{display:none;position:relative}.mobile-menu summary{list-style:none;width:42px;height:42px;background:#171717;display:grid;align-content:center;justify-content:center;gap:5px;cursor:pointer}.mobile-menu summary::-webkit-details-marker{display:none}.mobile-menu summary span{height:1px;width:17px;background:#fff}.mobile-menu nav{position:absolute;top:50px;right:0;width:min(85vw,340px);padding:15px;background:#000;display:grid;border:1px solid #ffffff30}.mobile-menu nav>a{padding:13px;color:#fff;border-bottom:1px solid #ffffff24;font-size:14px}.mobile-menu nav .mobile-book{color:var(--electric-blue)}.mobile-switch{display:flex;gap:4px;margin:3px 0 12px}.mobile-switch a{width:50%;padding:14px 8px;text-align:center;color:#fff;background:#242424;border:1px solid #555;font-weight:800;text-transform:uppercase;font-size:11px}.mobile-switch a.active{background:#fff;color:#000;border-color:#fff;box-shadow:inset 0 -3px 0 var(--electric-blue)}
        @media(max-width:1250px){.header-top{gap:10px}.brand{flex-basis:145px}.brand-image{width:145px}.side-switch-wrap{gap:6px}.side-switch-label{font-size:8px}.side-switch>a{min-width:126px;padding:7px 9px}.side-switch .switch-title{font-size:10px}.side-switch small{font-size:7px}.desktop-nav{gap:clamp(22px,2.5vw,34px)}.desktop-nav a{font-size:13px}.header-book{font-size:8px;padding-inline:8px}}
        @media(max-width:1080px){.site-header{height:82px}.site-header.is-compact{height:70px}.header-inner{width:calc(100% - 32px);justify-content:center}.header-top{height:100%;flex:1 0 100%;width:100%}.desktop-nav{display:none}.brand{flex-basis:165px}.brand-image{width:165px}.header-book-full{display:none}.header-book-short{display:inline}.mobile-menu{display:block}}
        @media(max-width:560px){.side-switch-label{display:none}.brand{flex-basis:128px}.brand-image{width:128px}.side-switch-wrap{flex:1;justify-content:center}.side-switch{gap:2px;padding:3px}.side-switch>a{min-width:0;padding:7px 8px}.side-switch .switch-title{font-size:9px;letter-spacing:.04em}.side-switch small{font-size:6px;white-space:normal;text-align:center}.header-actions{gap:7px}.cart-link small{display:none}}
        @media(max-width:480px){.header-inner{width:calc(100% - 24px)}.header-top{gap:6px}.brand{flex:0 0 88px}.brand-image{width:88px}.side-switch-wrap{flex:1;min-width:0}.side-switch{width:100%;min-width:0}.side-switch>a{flex:1;min-width:0;padding:7px 4px}.side-switch .switch-title{font-size:8px}.side-switch small{font-size:5.5px}.header-actions{flex:0 0 auto;gap:5px}.header-book{font-size:8px;padding:0 6px;gap:3px}.mobile-menu summary{width:34px;height:40px}}
        @media(max-width:390px){.header-inner{width:calc(100% - 20px)}.brand{flex-basis:72px}.brand-image{width:72px}}
        @media(prefers-reduced-motion:reduce){.site-header{transition:none}}
      `}</style>
    </header>
  );
}
