"use client";

import { useRef } from "react";
import { useScroll } from "framer-motion";
import { CharacterV1 } from "@/components/ui/text-scroll-animation";

const steps = ["plan", "listen", "create", "install", "support"];

/**
 * "We plan. / We listen. / …" — each line's letters converge from the centre as the list scrolls
 * into view, one line after another (scroll effect from text-scroll-animation.tsx).
 */
export function BrandPractice() {
  const listRef = useRef<HTMLOListElement | null>(null);
  // 0 when the list's top reaches the bottom of the screen, 1 when its bottom reaches 55% of the screen.
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start end", "end 0.55"] });

  return (
    <ol ref={listRef} aria-label="How we work" data-scroll-reveal style={{ perspective: "500px" }}>
      {steps.map((word, line) => {
        const text = `We ${word.charAt(0).toUpperCase()}${word.slice(1)}.`;
        const chars = text.split("");
        const centerIndex = Math.floor(chars.length / 2);
        // Stagger: each line starts a little after the previous one and settles over ~40% of the scroll.
        const start = line * 0.12;
        return (
          <li key={word}>
            <span className="sr-only">{text}</span>
            <span aria-hidden className="practice-line">
              {chars.map((char, index) => (
                <CharacterV1 key={index} char={char} index={index} centerIndex={centerIndex} scrollYProgress={scrollYProgress} range={[start, start + 0.4]}
                  className={index >= 3 ? "practice-word" : "practice-we"} />
              ))}
            </span>
            <small>0{line + 1}</small>
          </li>
        );
      })}
    </ol>
  );
}
