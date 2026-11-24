"use client";

import { useEffect, useRef, useState } from "react";

/**
 * An Instagram reel, embedded with Instagram's own player. Instagram sizes its player once, when it loads, so the
 * player is only created once the slot is near the screen and laid out at its final width (otherwise it can lock
 * itself to a sliver). Until then a light placeholder keeps the space.
 */
export function InstagramReel({ id, title }: { id: string; title: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      // Wait a frame so the layout has settled, then load the player at the slot's real width.
      requestAnimationFrame(() => { const measured = Math.round(element.getBoundingClientRect().width); if (measured > 200) { setWidth(measured); observer.disconnect(); } });
    }, { rootMargin: "300px 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <figure className="ig-reel">
    <div ref={box} className="ig-reel-slot">
      {width > 0 ? <iframe src={`https://www.instagram.com/reel/${id}/embed/`} title={title} width={width} height={640} allowFullScreen scrolling="no" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" />
        : <div className="ig-reel-placeholder" aria-hidden><span>▶</span></div>}
    </div>
    <figcaption><a href={`https://www.instagram.com/reel/${id}/`} target="_blank" rel="noopener noreferrer">Watch on Instagram ↗</a></figcaption>
  </figure>;
}
