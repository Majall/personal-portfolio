"use client";

import { useEffect } from "react";
import { useReducedMotion } from "framer-motion";
import Lenis from "lenis";

/**
 * Inertial scrolling.
 *
 * Lenis drives `window.scrollTo` on every frame rather than transforming a
 * wrapper element, which is the reason everything else on the page keeps
 * working: `position: sticky` still sticks, the IntersectionObserver
 * scroll-spy in the navbar still fires, and `scrollY` still reads true for
 * the hero parallax. A transform-based smooth-scroll library would break all
 * three.
 *
 * Three things are deliberately handed back to the browser:
 *
 *  - Reduced motion. The whole thing is skipped, so scrolling stays native.
 *    Smooth-scrolling is exactly the kind of imposed motion that setting is
 *    asking us not to do.
 *  - Horizontal rails. The project shelf is its own scroll container; it is
 *    marked `data-lenis-prevent` so a wheel over it scrolls the shelf rather
 *    than being swallowed by the page.
 *  - In-page anchors. Clicking a nav link is routed through Lenis so the jump
 *    is eased instead of fighting the native `scroll-behavior`.
 */
export default function SmoothScroll() {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;

    const lenis = new Lenis({
      /* Long enough to feel weighted, short enough that a flick still lands
         where you expect. Beyond ~1.4s it starts feeling unresponsive. */
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      /* Touch devices already have native momentum. Adding ours on top makes
         phones feel laggy and detached, which is worse than doing nothing. */
      syncTouch: false,
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    /* Route same-page anchors through Lenis. Without this the browser jumps
       natively and the eased scroll never runs. */
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;

      const anchor = (event.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("#") || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();
      /* No offset: Lenis already honours the `scroll-mt-20` on each section,
         so adding a header offset here lands every anchor 80px too low and
         makes the eased path disagree with the native one taken under reduced
         motion. */
      lenis.scrollTo(target as HTMLElement);
      /* Keep the URL honest so the link is still shareable and the back
         button still works. */
      history.pushState(null, "", href);
    };

    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [reduce]);

  return null;
}
