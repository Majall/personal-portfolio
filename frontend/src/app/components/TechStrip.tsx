"use client";

import { useReducedMotion } from "framer-motion";
import { Container } from "./ui/Section";
import { skillGroups, stackSection } from "../../data/content";

/**
 * The stack: one marquee row per discipline, alternating direction.
 *
 * Each row duplicates its list so the track can translate by exactly -50%
 * and loop without a visible seam — see `.marquee-track` in globals.css.
 * The duplicate is aria-hidden and the whole strip carries a single
 * description, so a screen reader hears each skill once rather than twice.
 *
 * Under reduced motion the tracks do not animate (the stylesheet clamps the
 * animation), so the rows simply sit still and stay fully readable; the
 * horizontal overflow is scrollable by hand in that case.
 */
const Row: React.FC<{ items: string[]; reverse: boolean; seconds: number }> = ({
  items,
  reverse,
  seconds,
}) => {
  const reduce = useReducedMotion();

  return (
    <div
      className={`relative flex overflow-hidden py-2 ${
        reduce ? "no-scrollbar overflow-x-auto" : ""
      }`}
    >
      <div
        className="marquee-track flex w-max shrink-0 gap-2.5 pr-2.5"
        style={{
          animationDuration: `${seconds}s`,
          animationDirection: reverse ? "reverse" : "normal",
          animationPlayState: reduce ? "paused" : "running",
        }}
      >
        {[0, 1].map((copy) => (
          <div
            key={copy}
            className="flex shrink-0 gap-2.5 pr-2.5"
            aria-hidden={copy === 1 ? "true" : undefined}
          >
            {items.map((item, i) => (
              <span
                key={`${copy}-${item}-${i}`}
                className="whitespace-nowrap rounded-full border border-line bg-card px-4 py-2 text-xs text-muted"
              >
                {item}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const TechStrip: React.FC = () => {
  return (
    <div className="relative mt-20 sm:mt-28">
      <Container>
        <div className="flex items-center gap-4 pb-5">
          <span className="label text-muted">{stackSection.label}</span>
          <span className="h-px flex-1 bg-line" aria-hidden="true" />
          <span className="label hidden text-muted sm:block">
            {stackSection.note}
          </span>
        </div>
      </Container>

      {/* Full-bleed: the rows run off both edges of the page, which is what
          makes them read as a continuous belt rather than a list in a box. */}
      <div className="relative">
        {skillGroups.map((group, i) => (
          <Row
            key={group.key}
            items={group.items}
            reverse={i % 2 === 1}
            seconds={48 + i * 11}
          />
        ))}

        {/* Fade the rows into the page at both edges. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-ink to-transparent sm:w-32"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-ink to-transparent sm:w-32"
        />
      </div>
    </div>
  );
};

export default TechStrip;
