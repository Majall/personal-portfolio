"use client";

import Image from "next/image";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useRef } from "react";
import { Container } from "./ui/Section";
import { TextRoll } from "./ui/Motion";
import TypeCycle from "./ui/TypeCycle";
import { hero, profile } from "../../data/content";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The hero.
 *
 * Three stacked layers, back to front: the oversized chrome word, the cut-out
 * portrait, then the role line and actions. The portrait deliberately crosses
 * the middle of the word — that overlap is the whole composition, so the word
 * is centred on the same axis as the portrait rather than being laid out
 * above it.
 *
 * `portraitSrc` is resolved on the server in page.tsx. When the cut-out PNG is
 * not on disk it arrives as null and the hero falls back to type alone, which
 * is a deliberate design, not a broken state — so nothing here renders a
 * placeholder box.
 */
const Header: React.FC<{ portraitSrc?: string | null }> = ({ portraitSrc }) => {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  /* The word leaves faster than the portrait, so the two layers separate as
     the hero scrolls away instead of sliding off as one flat picture. */
  const wordY = useTransform(scrollYProgress, [0, 1], ["0%", "-55%"]);
  const portraitY = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);
  const chromeFade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  /* Pointer-follow on the portrait.
     The pointer position is normalised to -1..1 across the viewport and put
     through a soft spring, then mapped to a few degrees of tilt and a few
     pixels of drift. The tilt pivots on the bottom edge of the figure, so the
     torso stays planted and the head travels furthest — which is what reads
     as "looking toward the cursor". It is the whole flat cut-out leaning, not
     a head turn: the angles are kept small enough that the face is never
     visibly foreshortened.

     These are motion values, so pointer movement never re-renders React. */
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const followX = useSpring(pointerX, { stiffness: 60, damping: 18, mass: 0.6 });
  const followY = useSpring(pointerY, { stiffness: 60, damping: 18, mass: 0.6 });

  const tiltY = useTransform(followX, [-1, 1], [-5, 5]);
  const tiltX = useTransform(followY, [-1, 1], [3, -3]);
  const lean = useTransform(followX, [-1, 1], [-0.8, 0.8]);
  const driftX = useTransform(followX, [-1, 1], [-8, 8]);

  useEffect(() => {
    if (reduce || !portraitSrc) return;

    /* Only for a real hovering pointer. Touch screens have no cursor to
       follow, and a tap would otherwise leave the figure stuck off-centre. */
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!finePointer.matches) return;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      /* Nothing to animate once the hero has scrolled out of view. */
      if (window.scrollY > window.innerHeight) return;
      pointerX.set((e.clientX / window.innerWidth) * 2 - 1);
      pointerY.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    const onLeave = () => {
      pointerX.set(0);
      pointerY.set(0);
    };

    /* Listening on the window, passively, rather than putting a handler on
       an element over the hero: nothing is added to the hit-testing path, so
       links, selection and scrolling behave exactly as before. */
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      onLeave();
    };
  }, [reduce, portraitSrc, pointerX, pointerY]);

  return (
    <header
      ref={ref}
      id="home"
      className="relative flex min-h-[100svh] w-full flex-col justify-end overflow-hidden bg-ink pb-10 pt-28 sm:pb-14"
    >
      {/* Overhead key light. Without it the black behind the portrait reads
          as a void rather than as a studio backdrop. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-10%] h-[85vmin] w-[120vmin] -translate-x-1/2 rounded-[50%]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgb(var(--glow) / 0.085) 0%, rgb(var(--glow) / 0.03) 42%, transparent 72%)",
        }}
      />

      {/* ---- Layer 1: the word ---- */}
      <motion.div
        aria-hidden="true"
        style={{ y: wordY, opacity: chromeFade }}
        className="pointer-events-none absolute inset-x-0 top-1/2 z-0 -translate-y-1/2"
      >
        <Container>
          <span className="block overflow-hidden">
            <motion.span
              className="display chrome-text block text-center"
              style={{
                fontSize: "clamp(3.25rem, 15.5vw, 15rem)",
                lineHeight: 0.82,
              }}
              initial={{ y: "115%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 1.15, delay: 0.1, ease: EASE }}
            >
              {hero.word}
            </motion.span>
          </span>
        </Container>
      </motion.div>

      {/* Rim light behind the subject.
          The portrait is a dark shirt on a near-black page, so without a lit
          backdrop the body dissolves below the chest and leaves a floating
          head. This sits between the word and the portrait: bright enough to
          catch the shoulders and arms, soft enough not to read as a shape. */}
      {portraitSrc && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/2 z-[5] h-[78vh] w-[86vmin] max-w-[760px] -translate-x-1/2"
          style={{
            background:
              "radial-gradient(ellipse 54% 46% at 50% 62%, rgb(var(--glow) / 0.13) 0%, rgb(var(--glow) / 0.05) 45%, transparent 74%)",
          }}
        />
      )}

      {/* ---- Layer 2: the portrait ---- */}
      {portraitSrc && (
        <motion.div
          style={{ y: portraitY }}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.3, delay: 0.3, ease: EASE }}
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 mx-auto h-[62vh] w-full max-w-[560px] sm:h-[68vh] md:h-[74vh]"
        >
          {/* The pointer-follow lives on its own inner layer so it composes
              with the scroll parallax and the entrance scale on the wrapper
              instead of fighting them for the same transform. */}
          <motion.div
            data-portrait-follow
            className="absolute inset-0 origin-bottom will-change-transform"
            /* Applied unconditionally. Branching the style on `reduce` would
               render a transform on the server (which cannot know the
               preference) and none on the client, which is a hydration
               mismatch. It is also unnecessary: the pointer listener above
               bails out when motion is reduced, so these values simply stay
               at rest and the transform resolves to nothing. */
            style={{
              x: driftX,
              rotateX: tiltX,
              rotateY: tiltY,
              rotateZ: lean,
              transformPerspective: 1200,
            }}
          >
            <Image
              src={portraitSrc}
              alt={`Portrait of ${profile.name}`}
              fill
              priority
              sizes="(max-width: 768px) 90vw, 560px"
              className="object-contain object-bottom"
            />
          </motion.div>
        </motion.div>
      )}

      {/* Scrim over the foot of the portrait.
          Two jobs: it sinks the figure into the page instead of ending on a
          hard crop, and it keeps the role line and buttons legible where they
          cross the torso — which they always do at phone widths, since there
          is no room beside the figure there. Taller on small screens for
          exactly that reason. */}
      {portraitSrc && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-[46%] bg-gradient-to-t from-ink via-ink/85 to-transparent sm:h-[32%]"
        />
      )}

      {/* ---- Layer 3: role and actions ---- */}
      <Container className="relative z-20">
        <h1 className="sr-only">{hero.srHeadline}</h1>

        <div className="flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.75, ease: EASE }}
            className="text-[clamp(1.25rem,3.4vw,2.25rem)] leading-none tracking-tight"
          >
            <TypeCycle
              phrases={hero.roleCycle}
              className="font-semibold text-bone"
            />
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.88, ease: EASE }}
            className="flex items-center gap-3"
          >
            {/* Scroll affordance — a link to the next chapter rather than a
                button, so it works with the keyboard and without JS. */}
            <a
              href="#about"
              aria-label={hero.scrollCueLabel}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-bone transition-colors duration-300 hover:border-bone hover:bg-bone hover:text-ink"
            >
              <motion.svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                aria-hidden="true"
                animate={{ y: [0, 3, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <path
                  d="M12 5v14M6 13l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </motion.svg>
            </a>

            <a
              href={hero.contactCta.href}
              className="group rounded-full border border-line px-7 py-3.5 text-sm text-bone transition-colors duration-300 hover:border-bone hover:bg-bone hover:text-ink"
            >
              <TextRoll label={hero.contactCta.label} />
            </a>
          </motion.div>
        </div>
      </Container>
    </header>
  );
};

export default Header;
