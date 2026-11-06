"use client";

import { useEffect, useRef, useState } from "react";
import type { MediaVideo } from "@/lib/data/media";

type Connection = { saveData?: boolean; effectiveType?: string };

/**
 * A silent looping video that fills its (positioned) container, like an Image with `fill`.
 * Loading stays light: the poster image shows straight away, and the video file is only fetched once
 * the video is on screen (the phone-sized copy on small screens). Visitors who prefer reduced motion,
 * have data saving on or are on a very slow connection just see the poster.
 */
export function HeroVideo({ video, className = "", priority = false }: { video: MediaVideo; className?: string; priority?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const connection = (navigator as Navigator & { connection?: Connection }).connection;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? "")) return;
    const small = window.matchMedia("(max-width: 760px)").matches;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setSrc((current) => current ?? (small ? video.smallSrc : video.src));
        element.play().catch(() => undefined);
      } else element.pause();
    }, { rootMargin: priority ? "0px" : "200px", threshold: 0.1 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [video, priority]);

  // Start playing as soon as the chosen file is attached (the observer may have fired before it loaded).
  useEffect(() => { if (src) ref.current?.play().catch(() => undefined); }, [src]);

  return <video ref={ref} className={`hero-video ${className}`} poster={video.poster} src={src ?? undefined} muted loop playsInline autoPlay={Boolean(src)} preload={src ? "auto" : "none"} aria-label={video.label} />;
}
