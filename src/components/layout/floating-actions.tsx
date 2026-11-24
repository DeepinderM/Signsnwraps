"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CalendarDays, FileText, Phone, X } from "lucide-react";
import { BookingWizard, QuoteForm } from "@/components/forms/intake-forms";

// Floating "Book a visit / Get a quote" pill at the bottom of public pages. "Book a visit" is the main action; both open their
// form right there in a pop-up (the booking wizard or the quote form). Hidden in staff, vendor and customer areas and checkout, and while the footer is
// in view. On the booking and quote pages it stays up so visitors can switch between the two.
const HIDDEN = [/^\/admin/, /^\/vendor/, /^\/billing\//, /^\/account/, /^\/wraps\/cart/, /^\/wraps\/checkout/];

/** The service to start the booking with, from the page the visitor is on. */
function serviceFor(pathname: string) {
  if (/^\/wraps\/(ppf|kits|shop)/.test(pathname)) return "Colour PPF & protection";
  if (/^\/(wraps\/)?fleet|^\/signs\/fleet/.test(pathname)) return pathname.startsWith("/wraps") ? "Fleet wraps" : "Fleet signage";
  if (pathname.startsWith("/wraps")) return "Vehicle wraps";
  if (pathname.startsWith("/signs/printing")) return "Printing & banners";
  if (pathname.startsWith("/signs")) return "Commercial signage";
  return undefined;
}

export function FloatingActions() {
  const pathname = usePathname() ?? "/";
  const [footerInView, setFooterInView] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Which form is open in the pop-up, if any.
  const [open, setOpen] = useState<"book" | "quote" | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const footer = document.querySelector("footer");
    const observer = footer ? new IntersectionObserver(([entry]) => setFooterInView(entry.isIntersecting), { rootMargin: "0px 0px -40px 0px" }) : null;
    if (footer && observer) observer.observe(footer);
    // Appear once the visitor starts scrolling, so the first view of the page stays clean.
    const onScroll = () => setScrolled(window.scrollY > 240);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { observer?.disconnect(); window.removeEventListener("scroll", onScroll); };
  }, [pathname]);

  // The pop-up is a native <dialog>: focus stays inside, Esc closes it, and the page behind can't be scrolled.
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) { element.showModal(); document.documentElement.classList.add("has-modal"); }
    if (!open && element.open) element.close();
    if (!open) document.documentElement.classList.remove("has-modal");
  }, [open]);

  if (HIDDEN.some((pattern) => pattern.test(pathname))) return null;
  const onBook = pathname.startsWith("/book"), onQuote = pathname.startsWith("/quote");
  const shown = (scrolled || onBook || onQuote) && !footerInView;
  return <>
    <nav className={`float-cta${shown ? " is-shown" : ""}`} aria-label="Book a visit or get a quote" aria-hidden={!shown}>
      {/* On the booking page the form is already there: jump to it instead of opening a second copy. */}
      {/* On the booking / quote page that form is already there: jump to it instead of opening a second copy. */}
      {onBook ? <a href="#booking" className="float-cta-link is-primary" aria-current="page" tabIndex={shown ? 0 : -1}><CalendarDays aria-hidden /> Book a visit</a>
        : <button type="button" className="float-cta-link is-primary" onClick={() => setOpen("book")} tabIndex={shown ? 0 : -1} aria-haspopup="dialog"><CalendarDays aria-hidden /> Book a visit</button>}
      {onQuote ? <a href="#quote-form" className="float-cta-link" aria-current="page" tabIndex={shown ? 0 : -1}><FileText aria-hidden /> Get a quote</a>
        : <button type="button" className="float-cta-link" onClick={() => setOpen("quote")} tabIndex={shown ? 0 : -1} aria-haspopup="dialog"><FileText aria-hidden /> Get a quote</button>}
      <a href="tel:1300151616" className="float-cta-link float-cta-call" tabIndex={shown ? 0 : -1} aria-label="Call us on 1300 15 16 16" title="Call 1300 15 16 16"><Phone aria-hidden /></a>
    </nav>
    <dialog ref={dialog} className={`book-modal${open === "quote" ? " is-quote" : ""}`} aria-label={open === "quote" ? "Get a quote" : "Book a visit"} onClose={() => setOpen(null)} onClick={(event) => { if (event.target === event.currentTarget) setOpen(null); }}>
      <div className="book-modal-inner">
        <button type="button" className="book-modal-close" onClick={() => setOpen(null)} aria-label="Close"><X aria-hidden /></button>
        {open === "book" && <><BookingWizard defaultService={serviceFor(pathname)} />
          {!onQuote && <p className="book-modal-alt">Just need a price? <button type="button" className="link-like" onClick={() => setOpen("quote")}>Get a quote instead →</button></p>}</>}
        {open === "quote" && <><div className="quote-modal-head"><span className="eyebrow">GET A QUOTE</span><h2>Tell us what you have in mind.</h2><p>Share a few details (sizes, quantities, timing, photos or artwork) and we&apos;ll come back with a quote.</p></div>
          <QuoteForm defaultService={serviceFor(pathname)} />
          {!onBook && <p className="book-modal-alt">Not sure yet? <button type="button" className="link-like" onClick={() => setOpen("book")}>Book a visit instead →</button></p>}</>}
      </div>
    </dialog>
  </>;
}
