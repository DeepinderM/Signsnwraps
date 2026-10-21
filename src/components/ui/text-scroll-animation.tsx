"use client";

import { useRef, type ComponentType, type SVGProps } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

/*
 * Scroll-driven reveal: characters (or tiles) start spread out from the centre and
 * settle into place as the section scrolls into view.
 * Adapted from the Skiper31 text-scroll-animation:
 *  - no Lenis: it takes over page scrolling, which fights the sticky header, the mobile
 *    menu's scroll lock and in-page anchors; framer-motion's useScroll works with native scroll
 *  - icons are React components (lucide-react) instead of remote images
 *  - honours prefers-reduced-motion in CSS (globals.css: [data-scroll-reveal]), so server and
 *    client render identically, and keeps the text readable to screen readers
 */

type Range = [start: number, end: number];

type CharacterProps = {
  char: string;
  index: number;
  centerIndex: number;
  scrollYProgress: MotionValue<number>;
  /** Portion of the section's scroll progress over which the character settles. */
  range?: Range;
  className?: string;
};

/** A single character that flies in from its distance to the centre, with a 3D tilt. */
export function CharacterV1({ char, index, centerIndex, scrollYProgress, range = [0, 0.5], className }: CharacterProps) {
  const distance = index - centerIndex;
  const x = useTransform(scrollYProgress, range, [distance * 50, 0]);
  const rotateX = useTransform(scrollYProgress, range, [distance * 50, 0]);
  const opacity = useTransform(scrollYProgress, range, [0.15, 1]);
  return (
    <motion.span aria-hidden className={cn("inline-block will-change-transform", className)} style={{ x, rotateX, opacity }}>
      {char === " " ? "\u00a0" : char /* a plain space would collapse inside an inline-block */}
    </motion.span>
  );
}

export type RevealItem = { label: string; href?: string; icon: ComponentType<SVGProps<SVGSVGElement>> };

type TileProps = { item: RevealItem; index: number; centerIndex: number; scrollYProgress: MotionValue<number>; range?: Range };

function Tile({ item }: { item: RevealItem }) {
  const Icon = item.icon;
  const body = <>
    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#03AAFA]/10 text-[#026BA3]"><Icon className="h-6 w-6" strokeWidth={1.8} aria-hidden /></span>
    <span className="text-sm font-semibold tracking-tight text-black">{item.label}</span>
  </>;
  const tileClass = "flex h-full w-full flex-col items-center justify-center gap-3 rounded-3xl border border-black/[0.06] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,.04),0_12px_30px_-14px_rgba(0,0,0,.2)] transition-shadow duration-200 hover:shadow-[0_2px_6px_rgba(0,0,0,.05),0_22px_44px_-18px_rgba(0,0,0,.28)]";
  return item.href ? <Link href={item.href} className={tileClass}>{body}</Link> : <div className={tileClass}>{body}</div>;
}

/** Tile that rises from below and scales up into place. */
export function CharacterV2({ item, index, centerIndex, scrollYProgress, range = [0, 0.5] }: TileProps) {
  const distance = index - centerIndex;
  const x = useTransform(scrollYProgress, range, [distance * 50, 0]);
  const scale = useTransform(scrollYProgress, range, [0.75, 1]);
  const y = useTransform(scrollYProgress, range, [Math.abs(distance) * 50, 0]);
  return <motion.div className="h-[27vw] w-[27vw] max-h-36 max-w-36 shrink-0 will-change-transform sm:h-36 sm:w-36" style={{ x, scale, y, transformOrigin: "center" }}><Tile item={item} /></motion.div>;
}

/** Tile that spins and drops into place. */
export function CharacterV3({ item, index, centerIndex, scrollYProgress, range = [0, 0.5] }: TileProps) {
  const distance = index - centerIndex;
  const x = useTransform(scrollYProgress, range, [distance * 90, 0]);
  const rotate = useTransform(scrollYProgress, range, [distance * 50, 0]);
  const y = useTransform(scrollYProgress, range, [-Math.abs(distance) * 20, 0]);
  const scale = useTransform(scrollYProgress, range, [0.75, 1]);
  return <motion.div className="h-[27vw] w-[27vw] max-h-36 max-w-36 shrink-0 will-change-transform sm:h-36 sm:w-36" style={{ x, rotate, y, scale, transformOrigin: "center" }}><Tile item={item} /></motion.div>;
}

/** Text whose characters converge as it scrolls in. `highlight` is painted in brand blue (#0284C7: #03AAFA deepened for 3:1+ contrast on the Ice Blue canvas); "\n" forces a line break. */
export function ScrollRevealText({ text, highlight, scrollYProgress, range = [0, 0.5], className }: { text: string; highlight?: string; scrollYProgress: MotionValue<number>; range?: Range; className?: string }) {
  const characters = text.split("");
  const centerIndex = Math.floor(characters.length / 2);
  const highlightStart = highlight ? text.indexOf(highlight) : -1;
  // Group characters by word so lines only break between words.
  const words: { chars: { char: string; index: number }[]; breakBefore?: boolean }[] = [];
  characters.forEach((char, index) => {
    if (char === " " || char === "\n" || words.length === 0) words.push({ chars: [], breakBefore: char === "\n" });
    if (char !== " " && char !== "\n") words[words.length - 1].chars.push({ char, index });
  });
  return (
    <h2 aria-label={text.replace(/\n/g, " ")} className={cn("text-center font-extrabold uppercase leading-[0.95] tracking-[-0.05em] text-black", className)} style={{ perspective: "500px" }}>
      {words.map((word, w) => <span key={w} className="contents">{word.breakBefore && <br />}<span aria-hidden className="inline-block whitespace-nowrap px-[0.12em]">
        {word.chars.map(({ char, index }) => <CharacterV1 key={index} char={char} index={index} centerIndex={centerIndex} scrollYProgress={scrollYProgress} range={range}
          className={highlightStart >= 0 && index >= highlightStart && index < highlightStart + (highlight?.length ?? 0) ? "text-[#0284C7]" : undefined} />)}
      </span></span>)}
    </h2>
  );
}

export function Bracket({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 27 78" className={className} aria-hidden>
      <path fill="currentColor" d="M26.52 77.21h-5.75c-6.83 0-12.38-5.56-12.38-12.38V48.38C8.39 43.76 4.63 40 .01 40v-4c4.62 0 8.38-3.76 8.38-8.38V12.4C8.38 5.56 13.94 0 20.77 0h5.75v4h-5.75c-4.62 0-8.38 3.76-8.38 8.38V27.6c0 4.34-2.25 8.17-5.64 10.38 3.39 2.21 5.64 6.04 5.64 10.38v16.45c0 4.62 3.76 8.38 8.38 8.38h5.75v4.02Z" />
    </svg>
  );
}

type ScrollStoryProps = {
  text: string;
  highlight?: string;
  caption: string;
  items: RevealItem[];
  /** "rise" = CharacterV2 (calm), "spin" = CharacterV3 (playful). */
  variant?: "rise" | "spin";
  eyebrow?: string;
  className?: string;
};

/**
 * One pinned stage: the headline assembles first, then the tiles fly in underneath.
 * The section is taller than the screen; its content stays pinned while you scroll through it.
 */
export function ScrollStory({ text, highlight, caption, items, variant = "rise", eyebrow, className }: ScrollStoryProps) {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: targetRef, offset: ["start end", "end end"] });
  const iconCenterIndex = Math.floor(items.length / 2);
  const Character = variant === "spin" ? CharacterV3 : CharacterV2;
  return (
    <section ref={targetRef} data-scroll-reveal className={cn("relative h-[200vh] md:h-[220vh]", className)}>
      {/* Top padding clears the floating sticky header */}
      <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-center gap-7 overflow-hidden px-4 pb-6 pt-40 md:gap-9 md:pt-36">
        {eyebrow && <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#026BA3]">{eyebrow}</span>}
        <ScrollRevealText text={text} highlight={highlight} scrollYProgress={scrollYProgress} range={[0.05, 0.42]} className="max-w-5xl text-[clamp(2.3rem,7.5vw,5.6rem)]" />
        <p className="flex items-center justify-center gap-3 text-center text-base font-medium tracking-tight text-black/80 md:text-2xl">
          <Bracket className="h-9 shrink-0 text-black md:h-12" />
          <span>{caption}</span>
          <Bracket className="h-9 shrink-0 scale-x-[-1] text-black md:h-12" />
        </p>
        <div className="grid grid-cols-3 gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-5" style={variant === "spin" ? { perspective: "500px" } : undefined}>
          {items.map((item, index) => <Character key={item.label} item={item} index={index} centerIndex={iconCenterIndex} scrollYProgress={scrollYProgress} range={[0.32, 0.72]} />)}
        </div>
      </div>
    </section>
  );
}

/** Original export name kept for compatibility with the source component's demo. */
export const Skiper31 = ScrollStory;
