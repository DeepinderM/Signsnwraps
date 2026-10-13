import type { Metadata } from "next";
import Link from "next/link";
import { BookingWizard } from "@/components/forms/intake-forms";

export const metadata: Metadata = {
  title: "Book a Signage Consultation",
  description: "Book an in-store or on-site signage consultation with Signsnwraps in Laverton North.",
  alternates: { canonical: "/signs/book" },
};

export default function SignsBookingPage() {
  return (
    <div className="signs-book-page">
      <section className="signs-book">
        <div className="container">
          <span className="eyebrow">SIGNS · PRINT · BRAND PRESENTATION</span>
          <h1 className="heading-xl">Book a signage<br/>consultation.</h1>
          <p className="body-lg">Bring a brief, a sketch or simply a question. We’ll help you plan the right signage or print solution.</p>
        </div>
      </section>
      <section className="signs-book-form">
        <div className="container">
          <div className="booking-heading">
            <span className="eyebrow">START WITH A CONVERSATION</span>
            <h2>Let’s plan it together.</h2>
            <p>Tell us a little about your signage or print project. We’ll help you work out what to bring and what comes next.</p>
          </div>
          <div className="book-panel"><BookingWizard/></div>
          <p className="visit-link">Looking for studio details? <Link href="/locations/laverton-north">Visit Laverton North ↗</Link></p>
        </div>
      </section>
      <style>{`
        .signs-book-page{background:#0A0B0D;color:#fff}
        .signs-book{background:#0A0B0D;padding:68px 0 50px}
        .signs-book h1{margin:18px 0;font-size:clamp(2.8rem,5vw,4.6rem)}
        .signs-book>.container>p{color:#ddd;max-width:620px}
        .signs-book-form{background:#fff;color:#000;padding:76px 0 84px}
        .booking-heading{max-width:700px}
        .booking-heading h2{font-size:clamp(2.2rem,4vw,3.5rem);font-weight:800;letter-spacing:-.05em;margin:15px 0 10px}
        .booking-heading>p{font-size:15px;line-height:1.65;color:#555;margin:0}
        .book-panel{max-width:900px;margin:30px 0;background:#fff;color:#000}
        .visit-link{font-size:12px;color:#666!important}
        .visit-link a{color:#007db8;text-decoration:underline}
        @media(max-width:700px){.signs-book{padding:48px 0 35px}.signs-book-form{padding:56px 0 66px}.book-panel{margin:25px -18px 18px}}
      `}</style>
    </div>
  );
}
