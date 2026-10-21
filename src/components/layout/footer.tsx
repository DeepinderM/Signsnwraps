import Image from "next/image";
import Link from "next/link";
import brandLogo from "../../../Assets/logo-white-blue.png";
import { SignsFooterPartners } from "@/components/sections/proud-partners";

const columns = [
  { title: "Signs", links: [["Signage", "/signs/signage"], ["Shopfronts", "/signs/shopfronts"], ["Printing", "/signs/printing"], ["Neon", "/signs/neon"], ["Fleet signage", "/signs/fleet"], ["Projects", "/signs/projects"]] },
  { title: "Wraps", links: [["Vehicle wraps", "/wraps/vehicle-wraps"], ["Colour PPF", "/wraps/ppf"], ["Clear PPF kits", "/wraps/kits"], ["Compare fitting", "/wraps/compare"], ["Install guides", "/wraps/how-to-install"], ["Find an installer", "/wraps/installers"], ["Become an installer", "/wraps/installers/join"], ["Fleet wraps", "/wraps/fleet"], ["Trade kits", "/trade"]] },
  { title: "Company", links: [["About", "/about"], ["Contact", "/contact"], ["Laverton North studio", "/locations/laverton-north"], ["Book a consultation", "/book"], ["FAQs", "/wraps/faq"], ["Shipping & returns", "/shipping-returns"]] },
];

export function Footer() {
  return <footer className="footer"><div className="container">
    <div className="footer-main">
      <div className="footer-brand"><Link href="/" aria-label="SIGNSNWRAPS home"><Image src={brandLogo} alt="Signs N' Wraps" className="footer-logo" sizes="220px"/></Link><p>Expert advice.<br/>Bold results.</p><Link className="button button-orange" href="/book">Book an In-Store Consultation</Link></div>
      <div className="footer-links">{columns.map((column)=><div key={column.title}><h2>{column.title}</h2>{column.links.map(([label,href])=><Link key={href} href={href}>{label}</Link>)}</div>)}<div><h2>Visit & contact</h2><Link href="/locations/laverton-north">Laverton North, VIC</Link><a href="tel:+61300000000">+61 3 0000 0000</a><a href="mailto:hello@signsnwraps.com.au">hello@signsnwraps.com.au</a><a className="external-brand" href="https://ausppf.com.au" target="_blank" rel="noreferrer">Buying film by the roll? Visit AusPPF</a></div></div>
    </div>
    <SignsFooterPartners />
    <div className="footer-base"><span>© {new Date().getFullYear()} SIGNSNWRAPS</span><div><Link href="/legal/privacy">Privacy</Link><Link href="/legal/terms">Terms</Link><Link href="/legal/warranty">Warranty</Link><Link href="/legal/disclaimer">Disclaimer</Link></div><span>Make your brand stand out.</span></div>
  </div><style>{`.footer{background:#000;color:#fff;padding:66px 0 22px}.footer-main{display:grid;grid-template-columns:.85fr 1.4fr;gap:60px;padding-bottom:52px}.footer-brand .footer-logo{display:block;width:220px;height:auto}.footer-brand p{font-size:23px;font-weight:800;line-height:1.08;letter-spacing:-.04em;margin:20px 0}.footer-brand .button{font-size:9px}.footer-links{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}.footer-links>div{display:flex;flex-direction:column;align-items:flex-start;gap:13px}.footer-links h2{font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:#aaa;margin:2px 0 7px}.footer-links a{color:#ddd;font-size:11px;line-height:1.45}.footer-links a:hover,.footer-base a:hover,.footer-links .external-brand{color:var(--electric-blue)}.footer-links .external-brand{margin-top:8px}.footer-base{border-top:1px solid #ffffff35;padding-top:17px;display:flex;justify-content:space-between;gap:20px;color:#aaa;font-size:9px}.footer-base>div{display:flex;gap:18px}.footer-base a{color:#ddd}@media(max-width:900px){.footer-main{grid-template-columns:1fr;gap:38px}.footer-links{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.footer{padding-top:48px}.footer-base{flex-direction:column}.footer-base>div{flex-wrap:wrap}.footer-links{gap:30px 20px}.footer-brand .footer-logo{width:180px}}`}</style></footer>;
}
