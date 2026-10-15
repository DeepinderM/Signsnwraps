"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import brandLogo from "../../../Assets/logo-white-blue.png";
import lionIcon from "../../../Assets/lion-icon-white-blue.png";
import { useCart } from "@/lib/shop/cart-store";

const signsNav = [
  { href: "/signs/signage", label: "Signage" },
  { href: "/signs/shopfronts", label: "Shopfronts" },
  { href: "/signs/printing", label: "Printing" },
  { href: "/signs/neon", label: "Neon" },
  { href: "/signs/fleet", label: "Fleet" },
  { href: "/signs/projects", label: "Projects" },
];
const wrapsNav = [
  { href: "/wraps/vehicle-wraps", label: "Vehicle Wraps" },
  { href: "/wraps/ppf", label: "PPF" },
  { href: "/wraps/kits", label: "DIY Kits" },
  { href: "/wraps/shop", label: "Shop" },
  { href: "/wraps/installers", label: "Find an Installer" },
  { href: "/wraps/fleet", label: "Fleet" },
];

function UserIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>;
}
function BagIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 8h14l-1.2 12.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>;
}

export function Header() {
  const [compact, setCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const cartCount = useCart().reduce((sum, item) => sum + item.qty, 0);
  const pathname = usePathname();
  const isWraps = pathname.startsWith("/wraps") || pathname.startsWith("/trade") || pathname.startsWith("/account");
  const isSigns = pathname.startsWith("/signs");
  const nav = isWraps ? wrapsNav : signsNav;
  const consultationHref = isWraps ? "/wraps/book" : isSigns ? "/signs/book" : "/book";
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Escape closes the mobile menu; lock page scroll while it is open.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; };
  }, [menuOpen]);

  const sectionSwitch = (className: string) => <nav className={`side-switch ${className}`} aria-label="Choose a Signs or Wraps section">
    <Link href="/signs" className={isSigns ? "active" : ""} aria-current={isSigns ? "page" : undefined} onClick={closeMenu}>
      <span className="switch-title">SIGNS & PRINT</span><small>Signage · Shopfronts · Neon</small>
    </Link>
    <Link href="/wraps" className={isWraps ? "active" : ""} aria-current={isWraps ? "page" : undefined} onClick={closeMenu}>
      <span className="switch-title">WRAPS & PPF</span><small>Vehicle wraps · PPF · DIY kits</small>
    </Link>
  </nav>;

  return (
    <header className={`site-header${compact ? " is-compact" : ""}`}>
      <div className="container header-inner">
        <div className="header-top">
          <Link className="brand" href="/" aria-label="Signs N' Wraps home">
            {/* Reverse logo for the black header (master: Assets/Logos/logo final-white-blue.png); below the 150px minimum, use the lion icon instead. */}
            <Image src={brandLogo} alt="Signs N' Wraps" priority className="brand-image" sizes="170px" />
            <Image src={lionIcon} alt="" priority className="brand-icon" sizes="48px" />
          </Link>
          <div className="side-switch-wrap">
            <span className="side-switch-label">EXPLORE SECTIONS <span aria-hidden="true">›</span></span>
            {sectionSwitch("side-switch-desktop")}
          </div>
          <div className="header-actions">
            <Link className="icon-link" href="/account" aria-label="My account"><UserIcon /><small>Account</small></Link>
            <Link className="icon-link" href="/wraps/cart" aria-label={`Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}><BagIcon />{cartCount > 0 && <b className="cart-count">{cartCount}</b>}<small>Cart</small></Link>
            <Link className="button button-orange header-book" href={consultationHref}><span className="header-book-full">Book an In-Store Consultation</span><span className="header-book-short">Book</span></Link>
            <button className={`menu-toggle${menuOpen ? " is-open" : ""}`} type="button" aria-expanded={menuOpen} aria-controls="mobile-menu" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen((open) => !open)}><span/><span/><span/></button>
          </div>
        </div>
        {/* Mobile: section switch gets its own row at the top, hidden while scrolling down */}
        <div className="mobile-sections">
          <span className="mobile-sections-label">EXPLORE SECTIONS</span>
          {sectionSwitch("side-switch-mobile")}
        </div>
        <nav className="desktop-nav" aria-label={`${isWraps ? "Wraps" : "Signs"} navigation`}>
          {nav.map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
      </div>

      {menuOpen && <div className="menu-backdrop" onClick={closeMenu} aria-hidden="true" />}
      <div id="mobile-menu" className={`mobile-menu${menuOpen ? " is-open" : ""}`} role="dialog" aria-modal="true" aria-label="Menu" hidden={!menuOpen}>
        <div className="mobile-menu-head"><b>Menu</b><button type="button" className="menu-close" onClick={closeMenu}><span aria-hidden="true">✕</span> Close</button></div>
        <p className="mobile-menu-label">EXPLORE SECTIONS</p>
        {sectionSwitch("side-switch-menu")}
        <p className="mobile-menu-label">{isWraps ? "WRAPS & PPF" : "SIGNS & PRINT"}</p>
        <nav aria-label="Mobile navigation" className="mobile-menu-links">
          {nav.map(item => <Link key={item.href} href={item.href} onClick={closeMenu} aria-current={pathname === item.href ? "page" : undefined}>{item.label}</Link>)}
          <Link href="/about" onClick={closeMenu}>About</Link><Link href="/contact" onClick={closeMenu}>Contact</Link>
        </nav>
        <div className="mobile-menu-account">
          <Link href="/account" onClick={closeMenu}><UserIcon /> My account</Link>
          <Link href="/wraps/cart" onClick={closeMenu}><BagIcon /> Cart{cartCount > 0 ? ` (${cartCount})` : ""}</Link>
        </div>
        <Link className="button button-orange mobile-book" href={consultationHref} onClick={closeMenu}>Book an In-Store Consultation</Link>
      </div>
      <style>{`
        .site-header{height:120px;position:sticky;top:0;z-index:50;background:#000;border-bottom:1px solid #ffffff30;transition:height .2s ease;color:#fff}.site-header.is-compact{height:104px}
        .header-inner{height:100%;display:flex;flex-direction:column;justify-content:space-between}.header-top{height:71px;flex:1 0 71px;display:flex;align-items:center;justify-content:space-between;gap:14px}
        .brand{display:flex;align-items:center;flex:0 0 auto}.brand-image{display:block;width:170px;height:auto}.brand-icon{display:none;width:44px;height:auto}
        .side-switch-wrap{display:flex;align-items:center;gap:9px;flex:0 0 auto}.side-switch-label{display:flex;align-items:center;gap:5px;white-space:nowrap;font-size:9px;letter-spacing:.1em;font-weight:800;color:#fff}.side-switch-label span{font-size:18px;color:var(--electric-blue);line-height:1}
        .side-switch{display:flex;align-items:stretch;gap:5px;padding:3px;background:#000}.side-switch>a{display:flex;flex-direction:column;justify-content:center;gap:4px;min-width:142px;padding:7px 11px;border:1px solid #686868;background:#1d1d1d;color:#ddd;text-decoration:none;transition:background .2s,color .2s,border-color .2s}.side-switch .switch-title{font-size:11px;line-height:1;font-weight:900;letter-spacing:.08em}.side-switch small{font-size:8px;line-height:1.15;color:#aaa;white-space:nowrap}.side-switch>a.active{background:#fff;border-color:#fff;color:#000;box-shadow:inset 0 -3px 0 var(--electric-blue)}.side-switch>a.active small{color:#333}.side-switch>a:not(.active):hover{background:#303030;border-color:#888;color:#fff}.side-switch>a:not(.active):hover small{color:#fff}
        .desktop-nav{height:48px;flex:0 0 48px;width:100%;display:flex;justify-content:center;gap:clamp(24px,3vw,44px);align-items:center;border-top:1px solid #ffffff25;background:#0a0b0d}.desktop-nav a{font-size:14px;font-weight:600;letter-spacing:.015em;color:#e3e3e3;white-space:nowrap}.desktop-nav a:hover{color:var(--electric-blue)}
        .header-actions{display:flex;align-items:center;gap:14px}.header-book{min-height:44px;padding:0 12px;font-size:9px;text-transform:uppercase;white-space:nowrap}.header-book-short{display:none}
        .icon-link{position:relative;display:grid;justify-items:center;gap:2px;color:#fff;min-width:40px}.icon-link:hover{color:var(--electric-blue)}.icon-link small{font-size:9px;font-weight:600;letter-spacing:.02em}
        .cart-count{position:absolute;top:-6px;right:0;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:var(--electric-blue);color:#000;font-size:10px;line-height:18px;text-align:center}
        .menu-toggle{display:none;width:44px;height:44px;background:#171717;border:1px solid #333;cursor:pointer;flex-direction:column;align-items:center;justify-content:center;gap:5px;padding:0}.menu-toggle span{display:block;width:18px;height:2px;background:#fff;transition:transform .2s,opacity .2s}.menu-toggle.is-open span:nth-child(1){transform:translateY(7px) rotate(45deg)}.menu-toggle.is-open span:nth-child(2){opacity:0}.menu-toggle.is-open span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
        .mobile-sections{display:none}
        .menu-backdrop{position:fixed;inset:0;background:#000000a6;z-index:59}
        .mobile-menu{position:fixed;top:0;right:0;bottom:0;width:min(88vw,380px);z-index:60;background:#000;border-left:1px solid #ffffff2e;padding:calc(env(safe-area-inset-top,0px) + 14px) 18px calc(env(safe-area-inset-bottom,0px) + 24px);overflow-y:auto;display:flex;flex-direction:column;gap:6px}.mobile-menu[hidden]{display:none!important}
        .mobile-menu-head{display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid #ffffff24;margin-bottom:6px}.mobile-menu-head b{font-size:16px;letter-spacing:.02em}
        .menu-close{display:inline-flex;align-items:center;gap:8px;min-height:42px;padding:0 14px;background:#171717;border:1px solid #444;color:#fff;font-weight:700;font-size:13px;cursor:pointer}.menu-close span{font-size:15px}.menu-close:hover{border-color:#fff}
        .mobile-menu-label{margin:14px 0 6px;font-size:10px;font-weight:800;letter-spacing:.14em;color:var(--electric-blue)}
        .side-switch-menu{padding:0;gap:6px}.side-switch-menu>a{flex:1;min-width:0}
        .mobile-menu-links{display:grid}.mobile-menu-links a{padding:14px 4px;color:#fff;border-bottom:1px solid #ffffff1f;font-size:15px}.mobile-menu-links a[aria-current=page]{color:var(--electric-blue)}
        .mobile-menu-account{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:16px 0 12px}.mobile-menu-account a{display:flex;align-items:center;justify-content:center;gap:8px;min-height:48px;border:1px solid #444;color:#fff;font-size:14px;font-weight:600}
        .mobile-book{width:100%;margin-top:auto;font-size:13px}
        @media(min-width:1081px){.mobile-menu,.menu-backdrop{display:none!important}}
        @media(max-width:1250px){.header-top{gap:10px}.brand-image{width:150px}.side-switch-wrap{gap:6px}.side-switch-label{font-size:8px}.side-switch-desktop>a{min-width:126px;padding:7px 9px}.side-switch .switch-title{font-size:10px}.side-switch small{font-size:7px}.desktop-nav{gap:clamp(22px,2.5vw,34px)}.desktop-nav a{font-size:13px}.header-book{font-size:8px;padding-inline:8px}.header-actions{gap:10px}}
        @media(max-width:1080px){.site-header{height:82px}.site-header.is-compact{height:70px}.header-inner{width:calc(100% - 32px);justify-content:center}.header-top{height:100%;flex:1 0 100%;width:100%}.desktop-nav{display:none}.header-book-full{display:none}.header-book-short{display:inline}.menu-toggle{display:flex}}
        /* Phones: logo + icons + Book + menu on top, section switch on its own row below */
        @media(max-width:760px){
          .site-header,.site-header.is-compact{height:auto}.header-inner{width:calc(100% - 24px)}.header-top{height:58px;flex:0 0 58px}
          .side-switch-wrap{display:none}.brand-image{display:none}.brand-icon{display:block}
          .header-actions{gap:6px}.icon-link{min-width:38px;height:44px;align-content:center}.icon-link small{display:none}.cart-count{top:2px;right:-2px}
          .header-book{min-height:40px;padding:0 12px;font-size:11px}
          .mobile-sections{display:block;padding:0 0 10px;max-height:90px;overflow:hidden;transition:max-height .2s ease,padding .2s ease,opacity .2s ease}.site-header.is-compact .mobile-sections{max-height:0;padding-bottom:0;opacity:0}
          .mobile-sections-label{display:block;font-size:9px;font-weight:800;letter-spacing:.16em;color:var(--electric-blue);margin:0 0 6px}
          .side-switch-mobile{padding:0;gap:6px}.side-switch-mobile>a{flex:1;min-width:0;padding:8px 10px}.side-switch-mobile .switch-title{font-size:11px}.side-switch-mobile small{font-size:8px;white-space:normal}
        }
        @media(max-width:360px){.header-book{padding:0 9px;font-size:10px}.icon-link{min-width:34px}.side-switch-mobile small{display:none}}
        @media(prefers-reduced-motion:reduce){.site-header,.mobile-sections,.menu-toggle span{transition:none}}
      `}</style>
    </header>
  );
}
