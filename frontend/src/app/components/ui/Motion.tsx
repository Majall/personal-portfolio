"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useRef, type ReactNode } from "react";

/* ---------------------------------------------------------------------------
   Shared motion primitives.

   Every one of these consults useReducedMotion and degrades to a plain,
   fully-visible, non-animated render. That matters here because the design
   leans on scroll-driven motion: without the guard, a reduced-motion visitor
   would get content that never reveals.
--------------------------------------------------------------------------- */

const EASE = [0.22, 1, 0.36, 1] as const;

/** Fade-and-rise on scroll into view. The workhorse reveal. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}) {
  const reduce = useReducedMotion();

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-12% 0px -12% 0px" }}
      transition={{ duration: 0.75, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Staggers its Reveal-like children by index. */
export function RevealGroup({
  children,
  className,
  stagger = 0.07,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  const reduce = useReducedMotion();

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10% 0px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
  y = 24,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) {
  const reduce = useReducedMotion();

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Headline that resolves word by word. Each word is clipped by its own
 * overflow-hidden row and slides up. Renders as plain text when motion is
 * reduced.
 */
export function SplitHeading({
  text,
  className,
  wordClassName,
  as: Tag = "h2",
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  as?: "h1" | "h2" | "h3";
}) {
  const reduce = useReducedMotion();
  const words = text.split(" ");

  if (reduce) {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <Tag className={className}>
      {/* The full string stays available to assistive tech as one phrase,
          so the per-word spans never get announced as fragments. */}
      <span className="sr-only">{text}</span>
      <motion.span
        aria-hidden="true"
        className="inline"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-10% 0px" }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.08 } },
        }}
      >
        {words.map((word, index) => (
          <span
            key={`${word}-${index}`}
            className="inline-block overflow-hidden align-bottom"
          >
            <motion.span
              className={`inline-block ${wordClassName ?? ""}`}
              variants={{
                hidden: { y: "110%" },
                visible: {
                  y: "0%",
                  transition: { duration: 0.85, ease: EASE },
                },
              }}
            >
              {word}
              {index < words.length - 1 ? " " : ""}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}

/**
 * A chapter heading: a heavy uppercase Archivo lead followed by one italic
 * serif accent word.
 *
 * The two halves are separate props rather than one string because they are
 * set in different faces — concatenating them would mean parsing the text
 * back apart to know where the accent starts. Each word still clips and
 * rises independently, and the whole phrase is exposed to assistive tech as
 * one line so it is never announced as fragments.
 */
export function ChapterHeading({
  text,
  accent,
  className,
  as: Tag = "h2",
}: {
  text: string;
  accent?: string;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  const full = accent ? `${text} ${accent}` : text;

  const body = (
    <>
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className="inline-block overflow-hidden align-bottom"
        >
          <motion.span
            className="display inline-block"
            variants={{
              hidden: { y: "110%" },
              visible: { y: "0%", transition: { duration: 0.85, ease: EASE } },
            }}
          >
            {word}
            {index < words.length - 1 || accent ? " " : ""}
          </motion.span>
        </span>
      ))}
      {accent && (
        <span className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="serif-accent inline-block"
            variants={{
              hidden: { y: "110%" },
              visible: { y: "0%", transition: { duration: 0.85, ease: EASE } },
            }}
          >
            {accent}
          </motion.span>
        </span>
      )}
    </>
  );

  if (reduce) {
    return (
      <Tag className={className}>
        <span className="display">{text}</span>
        {accent ? <span className="serif-accent"> {accent}</span> : null}
      </Tag>
    );
  }

  return (
    <Tag className={className}>
      <span className="sr-only">{full}</span>
      <motion.span
        aria-hidden="true"
        className="inline"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-10% 0px" }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.08 } },
        }}
      >
        {body}
      </motion.span>
    </Tag>
  );
}

/**
 * Oversized decorative word that drifts horizontally as the section scrolls.
 * Purely ornamental, so it is aria-hidden and frozen under reduced motion.
 */
export function GhostWord({
  text,
  className,
  from = -120,
  to = 120,
}: {
  text: string;
  className?: string;
  from?: number;
  to?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const x = useTransform(scrollYProgress, [0, 1], [from, to]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute select-none ${className ?? ""}`}
    >
      <motion.div className="ghost-word" style={reduce ? undefined : { x }}>
        {text}
      </motion.div>
    </div>
  );
}

/**
 * Pill link whose label rolls up to a duplicate on hover/focus. The duplicate
 * is aria-hidden so the label is not announced twice.
 */
export function TextRoll({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) return <span className={className}>{label}</span>;

  return (
    /* 1.4em rather than 1em: at 1em the clipping rectangle sits exactly on
       the baseline and shears the descenders off every g, p and y. The
       duplicate is positioned at top-full and travels a full height, so the
       roll still lands exactly on the copy whatever the height is. */
    <span
      className={`relative block overflow-hidden ${className ?? ""}`}
      style={{ height: "1.4em", lineHeight: "1.4em" }}
    >
      <span className="block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-full group-focus-visible:-translate-y-full">
        {label}
      </span>
      <span
        aria-hidden="true"
        className="absolute left-0 top-full block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-full group-focus-visible:-translate-y-full"
      >
        {label}
      </span>
    </span>
  );
}

/** Scroll progress of a section, for callers that want custom transforms. */
export function useSectionProgress(): [
  React.RefObject<HTMLDivElement | null>,
  MotionValue<number>,
] {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  return [ref, scrollYProgress];
}
