"use client";

import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { hero, loader } from "../../data/content";

const EASE = [0.22, 1, 0.36, 1] as const;
const SWING = [0.37, 0, 0.32, 1] as const;
const STORAGE_KEY = "intro-played";

/* ---------------------------------------------------------------------------
   The beats, as elapsed milliseconds from mount.

   The sequence is a pendulum: a pivot dot drops in, an arm grows out of it and
   begins to swing, and each swing flings one letter of the name into its slot.
   Once the name is assembled it holds, then morphs letter by letter into the
   word, the role line arrives underneath, and the word walks back down the
   same ladder to the name — so the loader closes on who this is rather than
   on a generic label, and the hero it hands over to then says PORTFOLIO.

   The two morph passes share one ticker and one string function; only the
   direction differs. That is deliberate: a separate reverse implementation
   would be free to disagree with the forward one, and the whole point is that
   the return trip retraces the outward steps exactly.

   Keeping the beats in one table rather than scattered through the JSX is what
   makes the sequence adjustable without re-deriving every delay by hand.
--------------------------------------------------------------------------- */
const BEAT = {
  arm: 900, // dot has landed; the arm grows and starts swinging
  fling: 1300, // letters begin arriving, one per swing
  settled: 2950, // all letters home; chrome sweeps across the name
  /* The opening hold is short because the name is no longer a one-off — it
     comes back as the closing frame, which is where it earns a real pause. */
  morph: 3950, // name starts turning into the word
  role: 5600, // word complete; the role line fades up
  unmorph: 6350, // the word turns back into the name, step by step
  /* The ticker drifts ~280ms over eighteen steps (setInterval plus render
     latency), so the closing hold is measured from where the last step
     actually lands rather than from the arithmetic. */
  out: 8750, // the name holds, then the overlay fades out
  done: 9350,
} as const;

/** Milliseconds between one letter being flung and the next. */
const FLING_STEP = 260;
/** Milliseconds between each character locking to the target word. */
const MORPH_STEP = 165;

type Phase =
  | "dot"
  | "arm"
  | "fling"
  | "settled"
  | "morph"
  | "role"
  | "unmorph"
  | "out"
  | "done";

/* Phases at or after which the name has finished assembling. */
const ORDER: Phase[] = [
  "dot",
  "arm",
  "fling",
  "settled",
  "morph",
  "role",
  "unmorph",
  "out",
  "done",
];
const atLeast = (phase: Phase, mark: Phase) =>
  ORDER.indexOf(phase) >= ORDER.indexOf(mark);

/* Whether this session has already seen the intro, read straight from
   sessionStorage as an external store.

   The store never notifies, so `subscribe` is a no-op: the flag cannot change
   underneath us in a way the loader needs to react to. The server snapshot
   reports "already played", which makes the first paint — and therefore the
   hydrating client's first paint — render no loader at all. Anything else
   would be markup the server could not have produced. */
const neverChanges = () => () => {};

const hasPlayedOnClient = () => {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    /* Private browsing can make sessionStorage throw on read. Treat that as
       "not seen" — replaying the intro is a far smaller problem than
       crashing the page. */
    return false;
  }
};

const hasPlayedOnServer = () => true;

/**
 * Build the word at a given point in the morph.
 *
 * Characters lock to the target from the left while the tail of the original
 * name is still showing, so MAJALL becomes PAJALL, POJALL, PORALL … and then
 * keeps growing once the name runs out: PORTFO, PORTFOL, PORTFOLI, PORTFOLIO.
 * The same rule reproduces the reference exactly (ADITHYA → PDITHYA → PORTHYA
 * → PORTFYA → PORTFOA → PORTFOLI → PORTFOLIO).
 */
function morphAt(name: string, word: string, locked: number): string {
  return word.slice(0, locked) + name.slice(locked);
}

/* Running `locked` back down to zero replays the same ladder in reverse —
   PORTFOLIO, PORTFOLI, PORTFOL, PORTFO, PORTFL, PORTLL, PORALL, POJALL,
   PAJALL, MAJALL — so the return trip needs no second string function, only a
   direction. Each rung is the one state the forward pass already produced, so
   the two halves cannot drift out of step. */

export default function IntroLoader() {
  const reduce = useReducedMotion();
  const hasPlayed = useSyncExternalStore(
    neverChanges,
    hasPlayedOnClient,
    hasPlayedOnServer,
  );
  const [phase, setPhase] = useState<Phase>("dot");
  const [locked, setLocked] = useState(0);

  const shouldPlay = !reduce && !hasPlayed;
  const playing = shouldPlay && phase !== "done";

  const finish = useCallback(() => {
    setPhase("done");
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* Storage unavailable: the intro still played, it just will not be
         remembered for the next page in this session. */
    }
  }, []);

  useEffect(() => {
    if (!shouldPlay) return;

    const timers = [
      setTimeout(() => setPhase("arm"), BEAT.arm),
      setTimeout(() => setPhase("fling"), BEAT.fling),
      setTimeout(() => setPhase("settled"), BEAT.settled),
      setTimeout(() => setPhase("morph"), BEAT.morph),
      setTimeout(() => setPhase("role"), BEAT.role),
      setTimeout(() => setPhase("unmorph"), BEAT.unmorph),
      setTimeout(() => setPhase("out"), BEAT.out),
      setTimeout(finish, BEAT.done),
    ];

    return () => timers.forEach(clearTimeout);
  }, [shouldPlay, finish]);

  /* One ticker drives both passes, so the step count follows the word length
     instead of being hard-coded and the return trip is guaranteed to use the
     same cadence as the outward one. */
  useEffect(() => {
    const forward = phase === "morph";
    const backward = phase === "unmorph";
    if (!forward && !backward) return;

    const target = forward ? loader.word.length : 0;

    const id = setInterval(() => {
      setLocked((n) => {
        const next = forward ? n + 1 : n - 1;
        const clamped = forward
          ? Math.min(next, target)
          : Math.max(next, target);
        if (clamped === target) clearInterval(id);
        return clamped;
      });
    }, MORPH_STEP);

    return () => clearInterval(id);
  }, [phase]);

  /* Lift the pre-paint curtain (set by the inline script in layout.tsx) once
     the loader itself is covering the page, or once it is certain no intro
     will play. The hydration render reports "already played" regardless of
     the truth, so the real storage value is checked here rather than
     `hasPlayed` — otherwise the curtain would drop one frame too early. */
  useEffect(() => {
    if (playing || reduce || hasPlayedOnClient()) {
      delete document.documentElement.dataset.intro;
    }
  }, [playing, reduce]);

  /* Hold the page still while the loader is up, and always hand scrolling
     back on unmount — otherwise a navigation mid-intro would leave the body
     locked. */
  useEffect(() => {
    if (!playing) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [playing]);

  /* Any key ends it. The sequence runs about eight seconds, which is a long
     time to hold someone who has seen it before or simply wants the page, so
     it must always be escapable — pointer dismissal is wired on the overlay. */
  useEffect(() => {
    if (!playing) return;
    const onKey = () => finish();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, finish]);

  if (!playing) return null;

  const name = loader.name;
  const letters = name.split("");
  const text = atLeast(phase, "morph")
    ? morphAt(name, loader.word, locked)
    : name;
  const assembled = atLeast(phase, "settled");

  return (
    <AnimatePresence>
      {phase !== "out" && (
        <motion.div
          key="intro"
          role="status"
          aria-live="polite"
          aria-label={`${loader.name} ${loader.word}`}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: EASE } }}
          onPointerDown={finish}
          className="fixed inset-0 z-[90] flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-ink"
        >
          {/* Backlight. It blooms as the word assembles, then settles. */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[70vmin] w-[105vmin] -translate-x-1/2 -translate-y-1/2 rounded-[50%]"
            style={{
              background:
                "radial-gradient(ellipse at center, rgb(var(--glow) / 0.17) 0%, rgb(var(--glow) / 0.05) 42%, transparent 72%)",
            }}
            initial={{ opacity: 0.2, scale: 0.6 }}
            animate={{
              opacity: assembled ? 0.8 : 0.45,
              scale: assembled ? 1 : 0.8,
            }}
            transition={{ duration: 1.4, ease: EASE }}
          />

          <div className="relative flex w-full flex-col items-center px-4">
            {/* ---- The word ---- */}
            <div className="relative">
              {/* Before the letters settle each one carries its own chrome, so
                  a letter still rotating in mid-air is metal in its own right.
                  Once they are home the fill moves up to the parent, which lets
                  a single highlight sweep the whole word rather than lighting
                  six letters at once. A vertical gradient on equal-height caps
                  looks identical either way, so the handover is invisible. */}
              <p
                className={`display text-display ${
                  assembled ? "chrome-text chrome-sweep" : ""
                }`}
                aria-hidden="true"
              >
                {atLeast(phase, "morph")
                  ? text.split("").map((char, i) => (
                      /* Plain spans, with no transform and no fade.

                         Both would break this: the parent paints the chrome
                         through background-clip:text, and a transformed or
                         faded child becomes its own stacking context whose
                         glyph is then excluded from the parent's clip — so the
                         letter paints transparent and leaves a hole exactly
                         where the word just changed. A fade is wrong anyway at
                         165ms a step: the letter would still be arriving when
                         the next one goes. The reference swaps hard, and so
                         does this. */
                      <span key={`${i}-${char}`}>{char}</span>
                    ))
                  : letters.map((letter, i) => (
                      <span
                        key={`${letter}-${i}`}
                        className="relative inline-block"
                      >
                        <motion.span
                          className={`inline-block ${
                            assembled ? "" : "chrome-text"
                          }`}
                          initial={{
                            opacity: 0,
                            x: 110,
                            y: -78,
                            rotate: -52,
                            scale: 1.3,
                          }}
                          animate={
                            atLeast(phase, "fling")
                              ? { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }
                              : {}
                          }
                          transition={{
                            duration: 0.62,
                            delay: (i * FLING_STEP) / 1000,
                            ease: SWING,
                          }}
                        >
                          {letter}
                        </motion.span>
                      </span>
                    ))}
              </p>

              {/* ---- The pendulum ---- */}
              <AnimatePresence>
                {!assembled && (
                  <motion.div
                    key="pendulum"
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 top-full h-0 w-0"
                    exit={{ opacity: 0, transition: { duration: 0.3 } }}
                  >
                    {/* The arm, hinged on the dot. It grows out of the dot at
                        the `arm` beat and then swings, one sweep per letter. */}
                    <motion.div
                      className="absolute left-0 top-0 origin-left rounded-full bg-bone"
                      style={{ height: "clamp(4px,0.7vw,7px)" }}
                      initial={{ width: 0, rotate: -48, opacity: 0 }}
                      animate={
                        atLeast(phase, "fling")
                          ? {
                              width: "clamp(70px,11vw,170px)",
                              opacity: [1, 1, 0],
                              rotate: [-48, 34, -42, 30, -36, 26],
                            }
                          : atLeast(phase, "arm")
                            ? {
                                width: "clamp(70px,11vw,170px)",
                                opacity: 1,
                                rotate: -48,
                              }
                            : { width: 0, opacity: 0, rotate: -48 }
                      }
                      transition={
                        atLeast(phase, "fling")
                          ? {
                              duration: (letters.length * FLING_STEP) / 1000,
                              ease: "easeInOut",
                              times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                              opacity: { times: [0, 0.75, 1], duration: 1.6 },
                            }
                          : { duration: 0.45, ease: EASE }
                      }
                    />

                    {/* The pivot dot. Drops in, bounces, and holds while the
                        arm works — it is the anchor the whole sequence hangs
                        from, so it is the one element that never moves. */}
                    <motion.span
                      className="absolute block rounded-full bg-bone"
                      style={{
                        width: "clamp(10px,1.5vw,16px)",
                        height: "clamp(10px,1.5vw,16px)",
                        left: "calc(clamp(10px,1.5vw,16px) / -2)",
                        top: "calc(clamp(10px,1.5vw,16px) / -2)",
                      }}
                      initial={{ y: -260, opacity: 0, scale: 0.6 }}
                      animate={{
                        y: [-260, 0, -42, 0, -14, 0],
                        opacity: 1,
                        scale: 1,
                      }}
                      transition={{
                        duration: 0.95,
                        times: [0, 0.45, 0.62, 0.8, 0.91, 1],
                        ease: ["easeIn", "easeOut", "easeIn", "easeOut", "easeIn"],
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ---- The role line ---- */}
            <motion.p
              aria-hidden="true"
              className="mt-5 text-[clamp(0.95rem,2.2vw,1.6rem)] leading-none tracking-tight"
              initial={{ opacity: 0, y: 14 }}
              animate={
                atLeast(phase, "role")
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: 14 }
              }
              transition={{ duration: 0.7, ease: EASE }}
            >
              <span className="font-semibold text-bone">{hero.roleLead} </span>
              <span className="serif-accent text-bone/85">
                {hero.roleAccent}
              </span>
            </motion.p>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
