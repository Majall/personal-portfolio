"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { Section, SectionLabel, Container } from "./ui/Section";
import { Reveal } from "./ui/Motion";
import { labs, labsSection } from "../../data/content";

/**
 * Hands-on labs, as a shelf.
 *
 * A sticky panel on the left, a horizontal rail on the right. The rail is a
 * real scroll container with CSS scroll-snap rather than a JS carousel: the
 * browser owns the position, so trackpads, shift-wheel, touch drag, keyboard
 * and the scrollbar all work without any of it being reimplemented here.
 * JavaScript only *observes* that position to drive the counter, the dots and
 * the progress bar, and writes to it when a dot is clicked.
 *
 * The labs are Packet Tracer topologies and have no screenshots, so rather
 * than leaving an empty frame each card draws a topology *motif* — nodes and
 * links on a lit panel. It is decorative and aria-hidden: it illustrates the
 * shape of the work without pretending to be a photograph of it. If a real
 * screenshot is ever added to `labs[].image`, it takes over the frame and the
 * motif disappears.
 */

/* Node layouts per lab, drawn in a 0–100 viewBox. Fixed rather than random so
   the figure is identical on the server and the client, and identical between
   renders. */
const TOPOLOGIES: { nodes: [number, number][]; links: [number, number][] }[] = [
  {
    /* 01 — one router over four VLAN segments */
    nodes: [
      [50, 18],
      [22, 48],
      [50, 48],
      [78, 48],
      [14, 80],
      [36, 80],
      [64, 80],
      [86, 80],
    ],
    links: [
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 4],
      [1, 5],
      [3, 6],
      [3, 7],
    ],
  },
  {
    /* 02 — a routed mesh between sites */
    nodes: [
      [20, 25],
      [50, 15],
      [80, 25],
      [20, 70],
      [50, 82],
      [80, 70],
    ],
    links: [
      [0, 1],
      [1, 2],
      [0, 3],
      [2, 5],
      [3, 4],
      [4, 5],
      [1, 4],
      [0, 2],
    ],
  },
  {
    /* 03 — services hanging off a core pair */
    nodes: [
      [30, 22],
      [70, 22],
      [50, 50],
      [16, 76],
      [38, 76],
      [62, 76],
      [84, 76],
    ],
    links: [
      [0, 1],
      [0, 2],
      [1, 2],
      [2, 3],
      [2, 4],
      [2, 5],
      [2, 6],
    ],
  },
  {
    /* 04 — an addressing plan branching down */
    nodes: [
      [50, 16],
      [26, 44],
      [74, 44],
      [14, 76],
      [38, 76],
      [62, 76],
      [86, 76],
    ],
    links: [
      [0, 1],
      [0, 2],
      [1, 3],
      [1, 4],
      [2, 5],
      [2, 6],
    ],
  },
];

const LabFigure: React.FC<{ index: number }> = ({ index }) => {
  const reduce = useReducedMotion();
  const topology = TOPOLOGIES[index % TOPOLOGIES.length];

  return (
    <div
      aria-hidden="true"
      className="relative h-full w-full overflow-hidden bg-surface"
    >
      {/* Key light, so the panel has a floor and a falloff like the project
          photographs it sits between. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 38%, rgb(var(--glow) / 0.10) 0%, transparent 72%)",
        }}
      />

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full p-[12%]"
      >
        {topology.links.map(([a, b], i) => {
          const [x1, y1] = topology.nodes[a];
          const [x2, y2] = topology.nodes[b];
          return (
            <line
              key={`l-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth="0.4"
              className="text-bone/25"
            />
          );
        })}

        {topology.nodes.map(([x, y], i) => (
          <g key={`n-${i}`}>
            {/* A slow pulse travels the node set, one at a time. */}
            <motion.circle
              cx={x}
              cy={y}
              r="3.6"
              className="text-bone/10"
              fill="currentColor"
              animate={reduce ? undefined : { opacity: [0.15, 0.55, 0.15] }}
              transition={{
                duration: 3.4,
                repeat: Infinity,
                delay: i * 0.32,
                ease: "easeInOut",
              }}
            />
            <rect
              x={x - 2.4}
              y={y - 1.7}
              width="4.8"
              height="3.4"
              rx="0.9"
              fill="currentColor"
              className="text-bone/80"
            />
          </g>
        ))}
      </svg>
    </div>
  );
};

const Labs: React.FC = () => {
  const railRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const measure = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;

    const max = rail.scrollWidth - rail.clientWidth;
    setProgress(max > 0 ? rail.scrollLeft / max : 0);

    /* Which card is nearest the centre of the viewport of the rail. Measuring
       against the centre rather than the left edge is what keeps the counter
       in step with what the eye reads as "the current card". */
    const centre = rail.scrollLeft + rail.clientWidth / 2;
    const cards = Array.from(rail.children) as HTMLElement[];

    let nearest = 0;
    let shortest = Number.POSITIVE_INFINITY;
    cards.forEach((card, i) => {
      const cardCentre = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(cardCentre - centre);
      if (distance < shortest) {
        shortest = distance;
        nearest = i;
      }
    });
    setIndex(nearest);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    /* Deferred a frame: the first measurement must happen after layout, and
       setting state synchronously inside an effect body would cascade an
       extra render before the browser has even painted the rail. */
    const first = requestAnimationFrame(measure);

    rail.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(first);
      rail.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const goTo = (i: number) => {
    const rail = railRef.current;
    const card = rail?.children[i] as HTMLElement | undefined;
    if (!rail || !card) return;
    rail.scrollTo({
      left: card.offsetLeft - (rail.clientWidth - card.offsetWidth) / 2,
      behavior: "smooth",
    });
  };

  return (
    <Section id="labs" className="py-24 sm:py-32">
      <Container className="relative z-10">
        <SectionLabel index={labsSection.index}>
          {labsSection.eyebrow}
        </SectionLabel>
      </Container>

      <div className="mt-14 lg:grid lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-10">
        {/* ---- Sticky panel ---- */}
        <div className="px-4 sm:px-8 lg:sticky lg:top-28 lg:self-start lg:pl-12 lg:pr-0">
          <Reveal>
            <div className="rounded-3xl border border-line bg-card p-7 sm:p-8">
              <h2 className="text-[clamp(1.6rem,3.2vw,2.1rem)] font-semibold leading-[1.08] tracking-tight text-bone">
                {labsSection.heading}{" "}
                <span className="serif-accent text-bone/85">
                  {labsSection.headingAccent}
                </span>
              </h2>

              <p className="mt-5 text-sm leading-relaxed text-muted">
                {labsSection.note}
              </p>
            </div>

            <p className="mt-5 rounded-3xl border border-line bg-card p-6 text-sm leading-relaxed text-muted">
              {labsSection.certificationNote}
            </p>
          </Reveal>
        </div>

        {/* ---- The rail ---- */}
        <div className="mt-12 min-w-0 lg:mt-0">
          <ul
            ref={railRef}
            tabIndex={0}
            data-lenis-prevent
            aria-label={labsSection.railHint}
            className="shelf no-scrollbar flex gap-4 overflow-x-auto px-4 pb-2 sm:gap-5 sm:px-8 lg:pl-0 lg:pr-12"
          >
            {labs.map((lab, i) => (
              <li
                key={lab.number}
                className="flex w-[80vw] shrink-0 flex-col overflow-hidden rounded-3xl border border-line bg-card sm:w-[26rem]"
              >
                {/* Figure */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface">
                  {lab.image ? (
                    <Image
                      src={lab.image}
                      alt={`${lab.title} topology`}
                      fill
                      sizes="(max-width: 640px) 80vw, 26rem"
                      className="object-cover"
                    />
                  ) : (
                    <LabFigure index={i} />
                  )}

                  <span className="label absolute left-4 top-4 rounded-full bg-ink/80 px-3 py-1.5 text-bone backdrop-blur">
                    {lab.number}
                  </span>
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="display text-xl leading-tight text-bone">
                    {lab.title}
                  </h3>

                  <p className="mt-4 text-sm leading-relaxed text-muted">
                    {lab.description}
                  </p>

                  <p className="label mt-auto pt-7 text-muted">
                    {labsSection.configuredLabel}
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {lab.configured.map((item) => (
                      <li
                        key={item}
                        className="rounded-full border border-line px-2.5 py-1 text-[0.7rem] text-muted"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>

          {/* ---- Dots, hint, counter ---- */}
          <div className="mt-6 flex items-center gap-4 px-4 sm:px-8 lg:pl-0 lg:pr-12">
            <ul className="flex items-center gap-1.5">
              {labs.map((lab, i) => (
                <li key={lab.number}>
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={lab.title}
                    aria-current={i === index ? "true" : undefined}
                    className={`block h-[3px] rounded-full transition-all duration-500 ${
                      i === index
                        ? "w-7 bg-bone"
                        : "w-3.5 bg-line hover:bg-muted"
                    }`}
                  />
                </li>
              ))}
            </ul>

            <span className="label hidden text-muted sm:block">
              {labsSection.shelfHint}
            </span>

            <span className="label ml-auto tabular-nums text-muted">
              {String(index + 1).padStart(2, "0")} /{" "}
              {String(labs.length).padStart(2, "0")}
            </span>
          </div>

          {/* ---- Progress rail ---- */}
          <div className="mt-5 px-4 sm:px-8 lg:pl-0 lg:pr-12">
            <div className="h-px w-full bg-line" aria-hidden="true">
              <div
                className="h-px bg-bone"
                style={{ width: `${Math.max(progress, 0.02) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Labs;
