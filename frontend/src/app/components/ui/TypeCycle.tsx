"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * A line that types itself out, holds, deletes, and moves to the next phrase.
 *
 * The first phrase is rendered complete on the very first paint — server and
 * client alike — and the animation only starts once an effect runs. That
 * ordering is deliberate: the server cannot know whether a visitor wants
 * motion, so anything that varied the first render by that preference would
 * be a hydration mismatch. Here the markup is always identical and the
 * preference only decides whether the timer ever starts.
 *
 * Under reduced motion the line simply stays on the first phrase and the
 * caret stops blinking (handled in CSS), which is the honest static version
 * of the effect rather than a disabled-looking one.
 *
 * The text is decorative repetition of the page's real heading, so it is
 * hidden from assistive tech — the hero already carries the full title in a
 * visually hidden h1. Without that, a screen reader would announce a stream
 * of half-typed words.
 */
export default function TypeCycle({
  phrases,
  className,
}: {
  phrases: readonly string[];
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [text, setText] = useState(phrases[0] ?? "");

  useEffect(() => {
    if (reduce || phrases.length < 2) return;

    /* Timings are asymmetric on purpose: people read at the hold, so that is
       the long beat; deleting is faster than typing because a line
       disappearing is not information. */
    const TYPE = 70;
    const DELETE = 38;
    const HOLD = 1900;
    const BETWEEN = 260;

    let index = 0;
    let pos = phrases[0].length;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const full = phrases[index];

      if (!deleting) {
        if (pos < full.length) {
          pos += 1;
          setText(full.slice(0, pos));
          timer = setTimeout(tick, TYPE);
        } else {
          deleting = true;
          timer = setTimeout(tick, HOLD);
        }
      } else {
        if (pos > 0) {
          pos -= 1;
          setText(full.slice(0, pos));
          timer = setTimeout(tick, DELETE);
        } else {
          deleting = false;
          index = (index + 1) % phrases.length;
          timer = setTimeout(tick, BETWEEN);
        }
      }
    };

    /* First hold happens before anything moves, so the line the visitor
       lands on is readable rather than already dissolving. */
    timer = setTimeout(tick, HOLD);
    return () => clearTimeout(timer);
  }, [reduce, phrases]);

  return (
    <span className={className} aria-hidden="true">
      {text}
      <span className="type-caret" />
    </span>
  );
}
