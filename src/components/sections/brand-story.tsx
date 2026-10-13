import Link from "next/link";

export function BrandStorySection() {
  return (
    <section className="sign-brand-story" aria-labelledby="sign-brand-story-heading">
      <div className="container sign-brand-story-grid">
        <div className="sign-brand-story-copy">
          <h2 id="sign-brand-story-heading">Your brand is more<br/>than a logo.</h2>
          <p>It’s how customers see your business. A storefront, vehicle, sign, wall graphic or protective finish shapes perception before anyone speaks to you. Signsnwraps exists to make that first impression count.</p>
        </div>
        <div className="sign-brand-story-practice">
          <ol aria-label="How we work">
            {["plan", "listen", "create", "install", "support"].map((word, index) => (
              <li key={word}><span>We </span><strong>{word}.</strong><small>0{index + 1}</small></li>
            ))}
          </ol>
          <div className="sign-brand-philosophy"><span>PHILOSOPHY</span><p>Don’t guess your next step.<br/>Get expert advice.</p></div>
          <Link className="button button-orange sign-brand-cta" href="/signs/book">Book a free consultation <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
      <style>{`.sign-brand-story{background:#0A0B0D;color:#fff;padding:76px 0}.sign-brand-story-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:8%;align-items:center}.sign-brand-story-copy h2{font-size:clamp(2.7rem,5.1vw,4.8rem);line-height:1.04;letter-spacing:-.055em;font-weight:800;margin:0 0 20px}.sign-brand-story-copy>p{font-size:clamp(15px,1.55vw,19px);line-height:1.6;color:#aeb4bd;max-width:650px;margin:0}.sign-brand-story-practice ol{list-style:none;padding:0;margin:0}.sign-brand-story-practice li{display:flex;align-items:baseline;gap:8px;font-size:clamp(1.8rem,3.2vw,2.8rem);line-height:1.18;letter-spacing:-.035em;font-weight:800;text-transform:capitalize}.sign-brand-story-practice li span{color:#f5f6f7}.sign-brand-story-practice li strong{color:var(--electric-blue)}.sign-brand-story-practice li small{margin-left:auto;color:#69727d;font-size:10px;letter-spacing:.1em}.sign-brand-philosophy{margin-top:27px;padding:22px 26px;border-left:4px solid var(--electric-blue);background:#15181C}.sign-brand-philosophy>span{font-size:11px;font-weight:800;letter-spacing:.15em;color:#89919b}.sign-brand-philosophy p{font-size:clamp(16px,1.6vw,21px);line-height:1.35;font-weight:700;margin:10px 0 0}.sign-brand-cta{margin-top:20px;font-size:11px}@media(max-width:700px){.sign-brand-story{padding:58px 0}.sign-brand-story-grid{grid-template-columns:1fr;gap:35px}.sign-brand-story-copy h2{font-size:clamp(2.5rem,12vw,3.8rem);margin:0 0 14px}.sign-brand-story-practice li{font-size:clamp(1.8rem,9vw,2.4rem)}.sign-brand-philosophy{padding:18px 20px}.sign-brand-cta{width:100%}}`}</style>
    </section>
  );
}
