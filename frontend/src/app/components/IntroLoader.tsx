"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createIntroSound, type IntroSound, type SoundEvent } from "./introSound";
import type { CSSProperties } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type TargetAndTransition,
  type Transition,
} from "framer-motion";
import { loader } from "../../data/content";

const EASE = [0.22, 1, 0.36, 1] as const;
/** Long, soft deceleration: blocks glide in and settle without a bump. */
const GLIDE = [0.16, 1, 0.3, 1] as const;
const STORAGE_KEY = "intro-played";

/* ---------------------------------------------------------------------------
   Cinematic chrome-and-crimson title card, timed to the reference edit
   (11.8s), graded to the site's dark palette.

     0.0  black, embers drifting
     0.4  ACT 1: first half of the name builds, block by block
     2.2  ACT 2: macro montage of chrome and crimson blades, hard cuts between shots
          2.2 grind · 3.3 blades in dust · 3.75 slice · 4.5 shards
          5.7 blade fan · 6.3 cross · 6.95 star forms and rushes the lens
     7.75 black
     8.0  ACT 3: full name builds again, slower, under a slow camera drift
    11.8  fade to the page

   The title always reads left to right. In portrait (phones) it is sized
   by the screen's width, so the full name fits without turning sideways.

   Earlier versions sit beside this file as *.tsx.bak.
--------------------------------------------------------------------------- */
const TIMELINE = [
  ["act1", 400],
  ["A", 2200],
  ["B", 3300],
  ["C", 3750],
  ["D", 4500],
  ["E", 5700],
  ["F", 6300],
  ["G", 6950],
  ["black", 7750],
  ["act3", 8000],
  ["out", 11800],
] as const;
const DONE_AT = 12400;

/* Letter timing for the two title acts — shared by the animation and the
   soundtrack so every clank lands on its block. */
const ACT1_AT = 0.4;
const ACT1_DELAYS = [0, 0.27, 0.54, 0.82, 1.1];
const ACT1_DUR = 0.5;
const ACT3_AT = 8;
const ACT3_DELAYS = [0, 0.5, 0.95, 1.4, 1.95, 2.55, 3.1];
const ACT3_DUR = 0.55;
/** A glide reads as "landed" about 60% of the way through its duration. */
const LAND = 0.6;

function soundEvents(act1Count: number, act3Count: number): SoundEvent[] {
  const lands = (at: number, delays: number[], dur: number, n: number) =>
    delays.slice(0, n).map((d) => at + d + dur * LAND);
  const act3 = lands(ACT3_AT, ACT3_DELAYS, ACT3_DUR, act3Count);
  return [
    ...lands(ACT1_AT, ACT1_DELAYS, ACT1_DUR, act1Count).map((t) => ({ t, kind: "letter" as const })),
    { t: 2.2, kind: "cut" },
    { t: 2.35, kind: "grind", dur: 0.95 },
    { t: 3.3, kind: "cut" },
    { t: 3.75, kind: "cut" },
    { t: 3.75, kind: "scrape", dur: 0.75 },
    { t: 4.5, kind: "cut" },
    { t: 5.15, kind: "burst" },
    { t: 5.7, kind: "cut" },
    { t: 6.3, kind: "cut" },
    { t: 6.75, kind: "burst" },
    { t: 6.95, kind: "riser", dur: 0.77 },
    { t: 7.72, kind: "boom" },
    ...act3.map((t, i) => ({ t, kind: i === act3.length - 1 ? ("final" as const) : ("letter" as const) })),
  ];
}

type SoundState = "pending" | "blocked" | "on" | "muted";

/** Soundtrack file under /public, aligned to the intro's first frame. Set to
    undefined to use the synthesised hits instead. */
const MUSIC_URL: string | undefined = "/intro-theme.mp3";

/** A rendered intro film under /public. When present it replaces the CSS
    sequence; when absent the CSS sequence plays. It plays muted (browsers
    only autoplay muted video) with MUSIC_URL as its soundtrack. */
const VIDEO_URL = "/intro.mp4";
/** Hard cap on a video intro, in case the file stalls mid-stream. */
const VIDEO_MAX_MS = 20000;

type Phase = "dark" | (typeof TIMELINE)[number][0] | "done";

/* Session flag read as an external store; the server snapshot reports
   "played" so hydration renders no loader markup. */
const neverChanges = () => () => {};
const hasPlayedOnClient = () => {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};
const hasPlayedOnServer = () => true;

/** Deterministic pseudo-random in [0,1) so renders are stable. */
const rnd = (i: number, n: number) =>
  (((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1) + 1) % 1;

/* ------------------------------------------------------------ materials -- */

const PATINA =
  "radial-gradient(ellipse 18% 8% at 70% 28%, rgb(13 7 11 / 0.5), transparent 70%)," +
  "radial-gradient(ellipse 9% 20% at 32% 68%, rgb(13 7 11 / 0.42), transparent 70%)," +
  "radial-gradient(ellipse 26% 5% at 58% 52%, rgb(13 7 11 / 0.32), transparent 70%)," +
  "radial-gradient(ellipse 6% 4% at 82% 74%, rgb(13 7 11 / 0.45), transparent 70%)";
const BRUSH =
  "repeating-linear-gradient(100deg, rgb(255 255 255 / 0.045) 0 1px, transparent 1px 4px)";

const FACE = {
  /* The site's palette: chrome (the --metal gradient) lit over plum-black,
     with the brand crimson (#c62f3e) as the one chromatic colour. */
  crimson: `${PATINA}, ${BRUSH}, linear-gradient(125deg, #2c0d17 0%, #8a2c40 24%, #e86a78 42%, #c62f3e 53%, #4a1524 76%, #a3283a 100%)`,
  bright: `${PATINA}, ${BRUSH}, linear-gradient(115deg, #1b0d14 0%, #6f6f6f 26%, #ffffff 46%, #cfcfcf 56%, #4a3a42 82%, #9a9a9a 100%)`,
  dark: `${PATINA}, ${BRUSH}, linear-gradient(135deg, #0d070b 0%, #3a1a26 35%, #7a6a70 55%, #1b0d14 85%)`,
} as const;
/* The chrome bevel that catches the light along every edge. */
const BEVEL = "linear-gradient(135deg, #ffffff 0%, #a08b93 38%, #f3eef0 58%, #3a1a26 100%)";

const LETTER_FACE =
  "repeating-linear-gradient(95deg, rgb(255 255 255 / 0.06) 0 1px, transparent 1px 3px)," +
  "radial-gradient(ellipse 30% 18% at 30% 30%, rgb(58 26 38 / 0.28), transparent 70%)," +
  "radial-gradient(ellipse 22% 14% at 72% 72%, rgb(58 26 38 / 0.22), transparent 70%)," +
  /* Same stops as the site's --metal, so the intro's name is the hero's chrome. */
  "linear-gradient(180deg, #ffffff 0%, #cfcfcf 30%, #6f6f6f 52%, #9a9a9a 70%, #ededed 100%)";

/* ----------------------------------------------------------- primitives -- */

type SlabProps = {
  poly: string;
  box: CSSProperties;
  tone?: keyof typeof FACE;
  initial?: TargetAndTransition;
  animate?: TargetAndTransition;
  transition?: Transition;
  /** Delay before a highlight glides across the metal. */
  sheen?: number;
};

/** A piece of machined metal: chrome bevel, brushed face, moving glare.
    Colours are literal (not theme tokens) on purpose: the intro is always
    graded to the dark palette, and the tokens invert in light mode. */
function Slab({ poly, box, tone = "crimson", initial, animate, transition, sheen }: SlabProps) {
  const clip = `polygon(${poly})`;
  return (
    <motion.div
      className="absolute"
      style={box}
      initial={initial}
      animate={animate}
      transition={transition}
    >
      <div className="absolute inset-0" style={{ clipPath: clip, background: BEVEL }} />
      <div
        className="absolute inset-0"
        style={{ clipPath: clip, background: FACE[tone], transform: "scale(0.965)" }}
      />
      {sheen !== undefined && (
        <motion.div
          className="absolute inset-0"
          style={{
            clipPath: clip,
            background:
              "linear-gradient(110deg, transparent 38%, rgb(255 255 255 / 0.6) 50%, transparent 62%)",
            backgroundSize: "260% 100%",
          }}
          initial={{ backgroundPosition: "120% 0" }}
          animate={{ backgroundPosition: "-20% 0" }}
          transition={{ duration: 1, delay: sheen, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  );
}

type SparksProps = {
  x: number;
  y: number;
  n: number;
  delay?: number;
  angle?: number;
  spread?: number;
  dist?: number;
  dur?: number;
  repeat?: boolean;
  seed?: number;
};

/** Hot sparks thrown from a contact point, streaking along their path. */
function Sparks({ x, y, n, delay = 0, angle = -90, spread = 70, dist = 28, dur = 0.55, repeat = false, seed = 1 }: SparksProps) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const deg = angle + (rnd(i + seed * 31, 1) - 0.5) * spread;
        const a = (deg * Math.PI) / 180;
        const d = dist * (0.35 + rnd(i + seed * 31, 2) * 0.9);
        const dx = Math.cos(a) * d;
        const dy = Math.sin(a) * d;
        const t = dur * (0.6 + rnd(i + seed * 31, 3) * 0.8);
        return (
          <motion.span
            key={i}
            className="pointer-events-none absolute block rounded-full"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: 5 + rnd(i + seed * 31, 4) * 16,
              height: 1.6,
              background: "#fff4f5",
              boxShadow: "0 0 6px 1px rgb(225 45 60)",
              rotate: deg,
              transformOrigin: "0 50%",
            }}
            initial={{ opacity: 0, x: "0vmin", y: "0vmin" }}
            animate={{
              opacity: [0, 1, 1, 0],
              x: ["0vmin", `${dx * 0.65}vmin`, `${dx}vmin`],
              y: ["0vmin", `${dy * 0.6}vmin`, `${dy + d * 0.3}vmin`],
            }}
            transition={{
              duration: t,
              delay: delay + rnd(i + seed * 31, 5) * (repeat ? t : 0.12),
              ease: "easeOut",
              repeat: repeat ? Infinity : 0,
            }}
          />
        );
      })}
    </>
  );
}

/** Fine glowing dust hanging in the air between the blades. */
function Dust({ n, seed = 1 }: { n: number; seed?: number }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute block rounded-full"
          style={{
            left: `${rnd(i + seed * 17, 1) * 100}%`,
            top: `${rnd(i + seed * 17, 2) * 100}%`,
            width: 1.5 + rnd(i + seed * 17, 3) * 2,
            height: 1.5 + rnd(i + seed * 17, 3) * 2,
            background: rnd(i + seed * 17, 4) > 0.5 ? "#e12d3c" : "#f3eef0",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.9, 0.5], y: "3vh" }}
          transition={{ duration: 0.9, ease: "linear" }}
        />
      ))}
    </>
  );
}

const EMBERS = Array.from({ length: 30 }, (_, i) => ({
  left: rnd(i, 1) * 100,
  top: 30 + rnd(i, 2) * 80,
  size: 1.5 + rnd(i, 3) * 3.5,
  rise: 20 + rnd(i, 4) * 40,
  drift: (rnd(i, 5) - 0.5) * 10,
  dur: 3 + rnd(i, 6) * 3,
  delay: rnd(i, 7) * 3,
  gold: rnd(i, 8) > 0.5,
}));

function Embers() {
  return (
    <>
      {EMBERS.map((e, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="pointer-events-none absolute block rounded-full"
          style={{
            left: `${e.left}%`,
            top: `${e.top}%`,
            width: e.size,
            height: e.size * (e.gold ? 1.7 : 1),
            /* Crimson embers, with the odd white-hot one. */
            background: e.gold ? "#f3eef0" : "#e12d3c",
            boxShadow: `0 0 ${e.size * 3}px ${e.gold ? "rgb(255 170 180)" : "rgb(225 45 60)"}`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.5, 0.9, 0], y: `-${e.rise}vh`, x: `${e.drift}vw` }}
          transition={{ duration: e.dur, delay: e.delay, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </>
  );
}

/* --------------------------------------------------------------- title -- */

/* How each block approaches: from ahead of its slot, larger, turned in 3D. */
const APPROACH = [
  { x: "1.6em", y: "0.2em", scale: 2.4, rotateY: -60, rotateX: 10, rotateZ: 6 },
  { x: "2em", y: "-0.3em", scale: 2.8, rotateY: -70, rotateX: -15, rotateZ: -8 },
  { x: "1.4em", y: "0.5em", scale: 3.2, rotateY: -50, rotateX: 25, rotateZ: 12 },
  { x: "2.4em", y: "0.1em", scale: 4.2, rotateY: -75, rotateX: 5, rotateZ: -5 },
  { x: "1.8em", y: "0.4em", scale: 3, rotateY: -60, rotateX: -20, rotateZ: 10 },
  { x: "1.5em", y: "-0.2em", scale: 2.6, rotateY: -55, rotateX: 15, rotateZ: -6 },
];

/* True 3D extrusion: the letter is rebuilt as a stack of slices pushed back
   in Z, so when a block turns in flight its crimson side really turns with
   it (a text-shadow extrusion is painted flat and cannot). Slices nearer the
   face are lit brighter, falling to plum-black at the back. */
/* Every slice is a full text layer repainted each frame while the block
   moves, so the count is the intro's main rendering cost: 16 slices held the
   final title near 16fps on a mid-range CPU; 6 keep the same ~0.18em depth
   with wider spacing. */
const DEPTH = 6;
const DEPTH_STEP = 0.03; // em per slice → ~0.18em deep
const SLICES = Array.from({ length: DEPTH }, (_, k) => {
  const t = k / (DEPTH - 1);
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
  return {
    z: `${-(k + 1) * DEPTH_STEP}em`,
    color: `rgb(${mix(214, 30)} ${mix(58, 9)} ${mix(74, 16)})`,
  };
});

const CLIP_TEXT: CSSProperties = {
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

function Block({ ch, delay, dur, i }: { ch: string; delay: number; dur: number; i: number }) {
  const land = delay + dur * LAND;
  return (
    <motion.span
      className="relative inline-block"
      style={{ transformStyle: "preserve-3d", marginRight: "0.05em" }}
      initial={{ opacity: 0, ...APPROACH[i % APPROACH.length] }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1, rotateY: 0, rotateX: 0, rotateZ: 0 }}
      transition={{ delay, duration: dur, ease: GLIDE, opacity: { delay, duration: 0.1 } }}
    >
      {/* The extruded body, back to front. The deepest slice carries the
          soft contact shadow. */}
      {SLICES.slice()
        .reverse()
        .map((s, k) => (
          <span
            key={k}
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              color: s.color,
              transform: `translateZ(${s.z})`,
              textShadow: k === 0 ? "0 0.12em 0.25em rgb(0 0 0 / 0.9)" : undefined,
            }}
          >
            {ch}
          </span>
        ))}

      {/* Chrome face: the site's --metal stops. In flow, so it sizes the block. */}
      <span className="relative block" style={{ background: LETTER_FACE, ...CLIP_TEXT }}>
        {ch}
      </span>

      {/* Specular: a hot band of light crosses the face as the block lands,
          the way polished metal flares when it swings through a key light. */}
      <motion.span
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, transparent 38%, rgb(255 255 255 / 0.95) 48%, rgb(255 200 210 / 0.6) 52%, transparent 62%)",
          backgroundSize: "320% 100%",
          /* Lifted a hair off the face so the two never z-fight in 3D. */
          z: 0.5,
          ...CLIP_TEXT,
        }}
        initial={{ backgroundPosition: "110% 0" }}
        animate={{ backgroundPosition: "-10% 0" }}
        transition={{ delay: land - 0.12, duration: 0.7, ease: "easeInOut" }}
      >
        {ch}
      </motion.span>

      {/* Anamorphic lens flare on impact. */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 block"
        style={{
          width: "7em",
          height: "0.035em",
          x: "-50%",
          y: "-50%",
          z: 2,
          background:
            "linear-gradient(90deg, transparent, rgb(225 45 60 / 0.55) 28%, #ffffff 50%, rgb(225 45 60 / 0.55) 72%, transparent)",
          boxShadow: "0 0 0.25em 0.04em rgb(225 45 60 / 0.75)",
          borderRadius: "999px",
        }}
        initial={{ opacity: 0, scaleX: 0.2 }}
        animate={{ opacity: [0, 0.95, 0], scaleX: [0.2, 1, 1.35] }}
        transition={{ delay: land - 0.03, duration: 0.55, ease: "easeOut" }}
      />
    </motion.span>
  );
}

/* Out-of-focus light far behind the title: big soft discs drifting slowly,
   the shallow depth of field a real lens gives. */
const BOKEH = Array.from({ length: 8 }, (_, i) => ({
  left: 5 + rnd(i + 40, 1) * 90,
  top: 5 + rnd(i + 40, 2) * 90,
  size: 8 + rnd(i + 40, 3) * 16,
  white: rnd(i + 40, 4) > 0.7,
  dx: (rnd(i + 40, 5) - 0.5) * 8,
  dy: (rnd(i + 40, 6) - 0.5) * 8,
}));

function Bokeh() {
  return (
    <>
      {BOKEH.map((b, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="pointer-events-none absolute block rounded-full"
          style={{
            left: `${b.left}%`,
            top: `${b.top}%`,
            width: `${b.size}vmin`,
            height: `${b.size}vmin`,
            background: b.white
              ? "radial-gradient(circle, rgb(243 238 240 / 0.14), rgb(243 238 240 / 0.05) 60%, transparent 72%)"
              : "radial-gradient(circle, rgb(225 45 60 / 0.26), rgb(225 45 60 / 0.08) 60%, transparent 72%)",
            filter: "blur(6px)",
          }}
          initial={{ opacity: 0, x: "0vw", y: "0vh" }}
          animate={{ opacity: [0, 1, 0.7, 1], x: `${b.dx}vw`, y: `${b.dy}vh` }}
          transition={{ duration: 12, ease: "linear" }}
        />
      ))}
    </>
  );
}

/* A camera, not a canvas: moving film grain and a lens vignette over the
   whole frame. The grain is SVG turbulence, jittered a few times a second
   so it crawls like stock rather than sitting on the image as a texture. */
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

function FilmLook() {
  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[10%]"
        style={{ backgroundImage: GRAIN, opacity: 0.16, mixBlendMode: "overlay" }}
        animate={{ x: ["0%", "-3%", "2%", "-1%", "3%", "0%"], y: ["0%", "2%", "-3%", "1%", "-2%", "0%"] }}
        transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, rgb(0 0 0 / 0.55) 85%, rgb(0 0 0 / 0.8) 100%)",
        }}
      />
    </>
  );
}

type TitleProps = {
  letters: string[];
  delays: number[];
  dur: number;
  size: string;
  drift: { from: TargetAndTransition; to: TargetAndTransition; dur: number };
};

function Title({ letters, delays, dur, size, drift }: TitleProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="max-w-full px-4">
        <motion.div
          initial={drift.from}
          animate={drift.to}
          transition={{ duration: drift.dur, ease: "linear" }}
        >
          <p
            aria-hidden="true"
            className={`display flex select-none leading-none ${size}`}
            style={{ perspective: 1000, transform: "skewX(-9deg)", fontWeight: 900 }}
          >
            {letters.map((ch, i) => (
              <Block key={i} ch={ch} i={i} delay={delays[i]} dur={dur} />
            ))}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- shots -- */

const OUT = [0.16, 1, 0.3, 1] as const;

/* 2.2s — a slab sweeps in, then two faces grind together throwing sparks. */
function ShotGrind() {
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ scale: 1.15, rotate: 0 }}
      animate={{ scale: 1.32, rotate: -5 }}
      transition={{ duration: 1.1, ease: "linear" }}
    >
      <Slab
        poly="0% 25%, 100% 0%, 100% 100%, 0% 100%"
        box={{ left: "-12%", top: "38%", width: "85vmax", height: "60vmax" }}
        initial={{ x: "70vw", rotate: 25 }}
        animate={{ x: "0vw", rotate: 9 }}
        transition={{ duration: 0.45, ease: OUT }}
        sheen={0.3}
      />
      <Slab
        poly="15% 0%, 100% 5%, 85% 100%, 0% 95%"
        box={{ left: "46%", top: "-20%", width: "48vmax", height: "95vmax" }}
        tone="bright"
        initial={{ x: "45vw", rotate: -22 }}
        animate={{ x: "0vw", rotate: -12 }}
        transition={{ duration: 0.6, delay: 0.1, ease: OUT }}
        sheen={0.5}
      />
      <Sparks x={50} y={60} n={28} delay={0.2} angle={-100} spread={60} dist={30} repeat seed={3} />
    </motion.div>
  );
}

/* 3.3s — darkness full of dust; two blades slide in toward each other. */
function ShotBlades() {
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ scale: 1 }}
      animate={{ scale: 1.08 }}
      transition={{ duration: 0.45, ease: "linear" }}
    >
      <Dust n={70} seed={2} />
      <Slab
        poly="0% 30%, 100% 50%, 0% 70%"
        box={{ left: "-6%", top: "52%", width: "62vmax", height: "14vmax" }}
        initial={{ x: "-45vw", rotate: -10 }}
        animate={{ x: "0vw", rotate: -4 }}
        transition={{ duration: 0.45, ease: OUT }}
        sheen={0.05}
      />
      <Slab
        poly="100% 25%, 0% 50%, 100% 75%"
        box={{ right: "-12%", top: "8%", width: "42vmax", height: "18vmax" }}
        tone="bright"
        initial={{ x: "45vw", rotate: 40 }}
        animate={{ x: "0vw", rotate: 32 }}
        transition={{ duration: 0.45, ease: OUT }}
      />
    </motion.div>
  );
}

/* 3.75s — a block rides along a horizontal blade, spraying sparks off the cut. */
function ShotSlice() {
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ scale: 1.05 }}
      animate={{ scale: 1.14 }}
      transition={{ duration: 0.75, ease: "linear" }}
    >
      <Slab
        poly="0% 0%, 100% 0%, 100% 100%, 0% 100%"
        box={{ left: "-10%", top: "49%", width: "120%", height: "60%" }}
        tone="bright"
        sheen={0}
      />
      <div
        className="absolute inset-x-0"
        style={{
          top: "48%",
          height: "1.2vmin",
          background: "linear-gradient(180deg, #ffffff, #a08b93 60%, #3a1a26)",
        }}
      />
      <Slab
        poly="12% 0%, 100% 0%, 88% 100%, 0% 100%"
        box={{ left: "38%", top: "-12%", width: "34vmax", height: "60%" }}
        tone="dark"
        initial={{ x: "10vw" }}
        animate={{ x: "-14vw" }}
        transition={{ duration: 0.75, ease: "linear" }}
      />
      <Sparks x={52} y={48} n={32} angle={-8} spread={30} dist={38} dur={0.45} repeat seed={5} />
    </motion.div>
  );
}

/* 4.5s — shards tumble in the air above a slab; a burst of sparks. */
function ShotShards() {
  const shard = "50% 0%, 100% 38%, 78% 100%, 22% 100%, 0% 38%";
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ scale: 1, rotate: 0 }}
      animate={{ scale: 1.1, rotate: 3 }}
      transition={{ duration: 1.2, ease: "linear" }}
    >
      <Slab
        poly="0% 30%, 100% 0%, 100% 100%, 10% 100%"
        box={{ left: "32%", top: "34%", width: "72vmax", height: "72vmax" }}
        tone="bright"
        initial={{ y: "4vh" }}
        animate={{ y: "-2vh" }}
        transition={{ duration: 1.2, ease: "linear" }}
        sheen={0.2}
      />
      <Slab
        poly="20% 0%, 100% 4%, 80% 100%, 0% 100%"
        box={{ left: "-2%", top: "42%", width: "14vmax", height: "80vh" }}
        tone="dark"
      />
      {[
        { l: "4%", t: "6%", s: "16vmax", r: 160 },
        { l: "24%", t: "12%", s: "9vmax", r: -200 },
        { l: "10%", t: "28%", s: "6vmax", r: 240 },
        { l: "34%", t: "2%", s: "7vmax", r: -140 },
      ].map((p, i) => (
        <Slab
          key={i}
          poly={shard}
          box={{ left: p.l, top: p.t, width: p.s, height: p.s }}
          tone={i % 2 ? "bright" : "crimson"}
          initial={{ rotate: 0, y: "0vh" }}
          animate={{ rotate: p.r, y: "3vh" }}
          transition={{ duration: 1.2, ease: "linear" }}
        />
      ))}
      <Sparks x={30} y={56} n={30} delay={0.65} angle={-60} spread={140} dist={26} seed={7} />
    </motion.div>
  );
}

/* 5.7s — tall blades fan open around a pivot below the frame. */
function ShotFan() {
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ rotate: -6, scale: 1.1 }}
      animate={{ rotate: 4, scale: 1.18 }}
      transition={{ duration: 0.6, ease: "linear" }}
    >
      <div className="absolute" style={{ left: "50%", top: "105%" }}>
        {Array.from({ length: 6 }, (_, i) => (
          <Slab
            key={i}
            poly="28% 0%, 72% 0%, 100% 100%, 0% 100%"
            box={{
              left: "-12vmax",
              top: "-120vh",
              width: "24vmax",
              height: "120vh",
              transformOrigin: "50% 100%",
            }}
            tone={i % 3 === 0 ? "bright" : i % 3 === 1 ? "crimson" : "dark"}
            initial={{ rotate: (i - 2.5) * 3 }}
            animate={{ rotate: (i - 2.5) * 13 }}
            transition={{ duration: 0.6, ease: OUT }}
            sheen={0.1 + i * 0.04}
          />
        ))}
      </div>
      <Sparks x={44} y={30} n={14} angle={-70} spread={80} dist={16} seed={9} />
    </motion.div>
  );
}

/* 6.3s — blades cross; a spark flash where they meet. */
function ShotCross() {
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ scale: 1.05 }}
      animate={{ scale: 1.15 }}
      transition={{ duration: 0.65, ease: "linear" }}
    >
      <Slab
        poly="0% 0%, 100% 40%, 0% 100%"
        box={{ left: "-4%", top: "-6%", width: "55vmax", height: "50vh" }}
        tone="crimson"
        sheen={0}
      />
      <Slab
        poly="20% 0%, 100% 0%, 80% 100%, 0% 100%"
        box={{ left: "-6%", top: "50%", width: "40vmax", height: "60vh" }}
        tone="bright"
      />
      <div
        className="absolute inset-x-0"
        style={{
          top: "49%",
          height: "1.1vmin",
          background: "linear-gradient(180deg, #ffffff, #a08b93 60%, #3a1a26)",
        }}
      />
      <Slab
        poly="0% 50%, 100% 0%, 100% 100%"
        box={{ right: "-6%", top: "52%", width: "38vmax", height: "34vh" }}
        tone="bright"
        initial={{ x: "35vw", rotate: 12 }}
        animate={{ x: "0vw", rotate: 4 }}
        transition={{ duration: 0.5, ease: OUT }}
      />
      <Sparks x={46} y={49} n={34} delay={0.45} angle={0} spread={360} dist={18} dur={0.4} seed={11} />
    </motion.div>
  );
}

/* 6.95s — blades converge out of a zoom blur into a star, which spins and
   rushes the lens until it fills the frame. */
function ShotStar() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.div
        className="pointer-events-none absolute h-[60vmax] w-[60vmax] rounded-full"
        style={{ background: "radial-gradient(circle, rgb(225 45 60 / 0.55), transparent 60%)" }}
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: [0, 1, 0.6], scale: [0.4, 1, 2] }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      <motion.div
        className="relative h-0 w-0"
        initial={{ scale: 3, rotate: -60, opacity: 0, filter: "blur(12px)" }}
        animate={{
          scale: [3, 0.55, 1.4, 5.5],
          rotate: [-60, 0, 20, 55],
          opacity: [0, 1, 1, 1],
          filter: ["blur(12px)", "blur(0px)", "blur(0px)", "blur(5px)"],
        }}
        transition={{ duration: 0.8, times: [0, 0.3, 0.6, 1], ease: "easeInOut" }}
      >
        {Array.from({ length: 6 }, (_, i) => (
          <Slab
            key={i}
            poly="50% 0%, 100% 82%, 50% 100%, 0% 82%"
            box={{
              left: "-4.5vmax",
              top: "-30vmax",
              width: "9vmax",
              height: "30vmax",
              transformOrigin: "50% 100%",
              rotate: `${i * 60}deg`,
            }}
            tone={i % 2 ? "bright" : "crimson"}
          />
        ))}
      </motion.div>
    </div>
  );
}

/* ---------------------------------------------------------- the loader -- */

export default function IntroLoader() {
  const reduce = useReducedMotion();
  const hasPlayed = useSyncExternalStore(neverChanges, hasPlayedOnClient, hasPlayedOnServer);
  const [phase, setPhase] = useState<Phase>("dark");

  const shouldPlay = !reduce && !hasPlayed;
  const playing = shouldPlay && phase !== "done";

  const finish = useCallback(() => {
    setPhase("done");
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* Storage unavailable: intro just won't be remembered. */
    }
  }, []);

  /* ---- Which intro plays ----
     If a rendered film exists at VIDEO_URL it plays full-screen; otherwise
     the hand-built CSS sequence runs. The check is a HEAD request, so
     dropping the file into /public is all it takes to switch. */
  const [mode, setMode] = useState<"probe" | "video" | "css">("probe");

  useEffect(() => {
    if (!shouldPlay) return;
    let settled = false;
    const decide = (m: "video" | "css") => {
      if (settled) return;
      settled = true;
      setMode(m);
    };
    const giveUp = setTimeout(() => decide("css"), 1200);
    fetch(VIDEO_URL, { method: "HEAD" })
      .then((r) => {
        const type = r.headers.get("content-type") ?? "";
        decide(r.ok && type.startsWith("video") ? "video" : "css");
      })
      .catch(() => decide("css"));
    return () => {
      settled = true;
      clearTimeout(giveUp);
    };
  }, [shouldPlay]);

  useEffect(() => {
    if (!shouldPlay || mode !== "css") return;
    const timers = TIMELINE.map(([p, ms]) => setTimeout(() => setPhase(p), ms));
    timers.push(setTimeout(finish, DONE_AT));
    return () => timers.forEach(clearTimeout);
  }, [shouldPlay, mode, finish]);

  /* Video mode ends on the film's own `ended` event; give the fade its time,
     and never hold the page longer than VIDEO_MAX_MS if the file stalls. */
  useEffect(() => {
    if (mode !== "video") return;
    if (phase === "out") {
      const t = setTimeout(finish, 600);
      return () => clearTimeout(t);
    }
    const guard = setTimeout(finish, VIDEO_MAX_MS);
    return () => clearTimeout(guard);
  }, [mode, phase, finish]);

  /* ---- Soundtrack ----
     Browsers only allow audio after the visitor has interacted with the
     site. If the context comes up running, the track starts in sync; if it
     stays suspended, a "Tap for sound" button appears and joins the track
     at whatever point the picture has reached. */
  const soundRef = useRef<IntroSound | null>(null);
  const startedAt = useRef(0);
  const [sound, setSound] = useState<SoundState>("pending");
  /* Mirrors `sound` for the window key listener, which is bound once. */
  const soundStateRef = useRef<SoundState>("pending");
  useEffect(() => {
    soundStateRef.current = sound;
  }, [sound]);
  const soundBegan = useRef(false);
  /* Stable (reads only refs), so callbacks can use it without deps. */
  const elapsed = useCallback(() => (performance.now() - startedAt.current) / 1000, []);

  /* Create (and start preloading) the track on mount… */
  useEffect(() => {
    if (!shouldPlay) return;
    const n = loader.name.length;
    const s = createIntroSound(soundEvents(Math.ceil(n * 0.6), n), DONE_AT / 1000, MUSIC_URL);
    if (!s) return;
    soundRef.current = s;
    s.ctx.resume().catch(() => {});
    return () => {
      s.stop(0.2);
      soundRef.current = null;
      soundBegan.current = false;
    };
  }, [shouldPlay]);

  /* …but start it at the picture's first frame: immediately for the CSS
     sequence, on the film's `playing` event for the video, so a slow-loading
     file never puts the music ahead of the picture. */
  const beginSound = useCallback(() => {
    if (soundBegan.current) return;
    soundBegan.current = true;
    startedAt.current = performance.now();
    const s = soundRef.current;
    if (!s) return;
    s.ctx.resume().catch(() => {});
    setTimeout(() => {
      if (soundRef.current !== s) return;
      if (s.ctx.state === "running") {
        s.start((performance.now() - startedAt.current) / 1000);
        setSound("on");
      } else {
        setSound("blocked");
      }
    }, 80);
  }, []);

  useEffect(() => {
    if (mode === "css") beginSound();
  }, [mode, beginSound]);

  /* When the intro ends on its own, the music rings on under the page and
     fades over a couple of seconds (the file runs ~2.7s past the picture).
     A skip cuts it short. stop() is idempotent, so the later "done" call
     does not interrupt the long fade. */
  useEffect(() => {
    if (phase === "out") soundRef.current?.stop(MUSIC_URL ? 2.4 : 0.6);
    if (phase === "done") soundRef.current?.stop(0.15);
  }, [phase]);

  /* Browsers only release audio inside a user gesture (a click or a key
     press), so a blocked track is started from the visitor's first one and
     joins the picture wherever it has got to. */
  const unlockSound = useCallback(async () => {
    const s = soundRef.current;
    if (!s || soundStateRef.current !== "blocked") return;
    soundStateRef.current = "on";
    await s.ctx.resume().catch(() => {});
    s.start(elapsed());
    setSound("on");
  }, [elapsed]);

  const onSoundButton = async () => {
    const s = soundRef.current;
    if (!s) return;
    if (sound === "blocked") {
      await unlockSound();
    } else if (sound === "on") {
      s.setMuted(true);
      setSound("muted");
    } else if (sound === "muted") {
      s.setMuted(false);
      setSound("on");
    }
  };

  /* Lift the pre-paint curtain set in layout.tsx. */
  useEffect(() => {
    if (playing || reduce || hasPlayedOnClient()) {
      delete document.documentElement.dataset.intro;
    }
  }, [playing, reduce]);

  /* Lock scrolling while the loader is up. */
  useEffect(() => {
    if (!playing) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [playing]);

  /* While sound is blocked, the first key turns it on; after that any key
     skips. Escape always skips. Pointer handling is on the overlay. */
  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => {
      /* Enter/Space on the sound button toggles sound, not skip. */
      if ((e.target as HTMLElement | null)?.dataset?.introSound) return;
      if (e.key !== "Escape" && soundStateRef.current === "blocked") {
        void unlockSound();
        return;
      }
      finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, finish, unlockSound]);

  if (!playing) return null;

  const letters = loader.name.split("");
  const half = Math.ceil(letters.length * 0.6);

  return (
    <AnimatePresence>
      {phase !== "out" && (
        <motion.div
          key="intro"
          role="status"
          aria-live="polite"
          aria-label={loader.name}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: EASE } }}
          /* While sound is blocked, the first tap turns it on instead of
             skipping. It is handled on click, not pointerdown: on touch
             screens a pointerdown does not count as a gesture that may
             start audio. */
          onPointerDown={() => {
            if (soundStateRef.current !== "blocked") finish();
          }}
          onClick={() => void unlockSound()}
          className="fixed inset-0 z-[90] cursor-pointer overflow-hidden"
          /* A light grade on the whole frame: a touch more contrast and
             saturation, as a colourist would push a film. */
          style={{ background: "#0d070b", filter: "contrast(1.08) saturate(1.1)" }}
        >
          {/* Red haze from the left/top, as in the reference grade. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                /* The site's --glow (225 45 60): crimson light pooling from
                   the left and the top, as on the hero. */
                "radial-gradient(ellipse 60% 80% at 0% 40%, rgb(225 45 60 / 0.28), transparent 65%), radial-gradient(ellipse 70% 40% at 50% 0%, rgb(198 47 62 / 0.2), transparent 70%)",
            }}
          />

          {mode === "video" && (
            <video
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
              src={VIDEO_URL}
              autoPlay
              muted
              playsInline
              preload="auto"
              onPlaying={beginSound}
              onEnded={() => setPhase("out")}
              onError={() => setMode("css")}
            />
          )}

          {mode === "css" && <Bokeh />}
          {mode === "css" && <Embers />}

          {mode === "css" && phase === "act1" && (
            <Title
              letters={letters.slice(0, half)}
              delays={ACT1_DELAYS}
              dur={ACT1_DUR}
              size="text-[min(18vw,30vh)] portrait:text-[min(20vw,15vh)]"
              drift={{ from: { scale: 1.12 }, to: { scale: 1.04 }, dur: 1.8 }}
            />
          )}

          {phase === "A" && <ShotGrind />}
          {phase === "B" && <ShotBlades />}
          {phase === "C" && <ShotSlice />}
          {phase === "D" && <ShotShards />}
          {phase === "E" && <ShotFan />}
          {phase === "F" && <ShotCross />}
          {phase === "G" && <ShotStar />}

          {phase === "act3" && (
            <Title
              letters={letters}
              delays={ACT3_DELAYS}
              dur={ACT3_DUR}
              size="text-[min(14vw,24vh)] portrait:text-[min(15vw,12vh)]"
              drift={{ from: { scale: 1.08, x: "2%" }, to: { scale: 0.97, x: "-2%" }, dur: 4 }}
            />
          )}

          {mode === "css" && <FilmLook />}

          {/* Skip. Clicking anywhere or pressing any key also skips; this
              makes the option visible. */}
          <motion.button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              finish();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") finish();
            }}
            className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6 flex items-center gap-2 rounded-full border border-[#3a1a26] bg-[#0d070b]/70 px-4 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-[#f3eef0] backdrop-blur-sm transition-colors hover:border-[#c62f3e] hover:bg-[#140a10] focus-visible:outline-2 focus-visible:outline-[#c62f3e]"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6, ease: EASE }}
            aria-label="Skip intro"
          >
            Skip intro
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M5 5v14l9-7zM15 5h3v14h-3z" />
            </svg>
          </motion.button>

          {/* Sound control. Stops the pointer event so it never counts as
              "skip the intro". */}
          {sound !== "pending" && (
            <button
              type="button"
              data-intro-sound="1"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onSoundButton}
              className="absolute bottom-4 right-4 z-10 sm:bottom-6 sm:right-6 flex items-center gap-2 rounded-full border border-[#3a1a26] bg-[#0d070b]/70 px-4 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-[#f3eef0] backdrop-blur-sm transition-colors hover:border-[#c62f3e] hover:bg-[#140a10] focus-visible:outline-2 focus-visible:outline-[#c62f3e]"
              aria-label={sound === "on" ? "Mute intro sound" : "Play intro sound"}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" />
                {sound === "on" ? (
                  <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" strokeLinecap="round" />
                ) : (
                  <path d="m16 9 6 6m0-6-6 6" strokeLinecap="round" />
                )}
              </svg>
              {sound === "blocked" ? "Tap anywhere for sound" : sound === "on" ? "Sound on" : "Muted"}
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
