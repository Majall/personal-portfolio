"use client";

import { useReducedMotion } from "framer-motion";
import { techStrip } from "../../data/content";

/**
 * Edge-to-edge scrolling band of technology names, sitting between the hero
 * and the first chapter.
 *
 * The list is rendered twice inside a track that translates by exactly -50%,
 * which is what makes the loop seamless — the second copy arrives at the
 * position the first one left. Animation is CSS rather than Framer Motion so
 * it runs off the main thread and costs nothing on scroll.
 *
 * The whole band is decorative: every one of these words also appears as real
 * text in the skills list inside Services, so it is hidden from assistive
 * technology rather than read out twice. Under reduced motion the track stops
 * and simply clips.
 */
const TechStrip: React.FC = () => {
  const reduce = useReducedMotion();

  return (
    <div
      data-tone="ink"
      aria-hidden="true"
      className="tone-surface relative w-full overflow-hidden border-y py-4 rule"
    >
      <div
        className={`flex w-max ${reduce ? "" : "marquee-track"}`}
        style={{ animationDuration: "60s" }}
      >
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center">
            {techStrip.map((item) => (
              <li key={`${copy}-${item}`} className="flex items-center">
                <span className="label whitespace-nowrap px-5 text-muted">
                  {item}
                </span>
                <span
                  className="block h-1 w-1 shrink-0 rounded-full bg-current opacity-30"
                  aria-hidden="true"
                />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
};

export default TechStrip;
