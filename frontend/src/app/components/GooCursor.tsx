"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Tar buttons.
 *
 * Mounted once in the layout. Any pill button marked `data-goo` becomes tar:
 * on a hovering pointer, hovering it grabs it; pulling away stretches sticky
 * strands from the button's edge to the cursor. They thin as they stretch and
 * snap one by one, the last at MAX_PULL, then recoil into the button.
 * The cursor itself is never changed.
 *
 * On touch, a tap plays the same stretch-and-snap once, pulled upward.
 * With reduced motion nothing is mounted or listened to.
 *
 * Everything per-frame is written straight to the DOM through refs — no React
 * state changes while the pointer moves.
 */

type Pt = { x: number; y: number };

const SELECTOR = "[data-goo]";
const MAX_PULL = 190; // px past the button's edge before the last strand gives
const STRANDS = 6;
const SAMPLES = 16;
const RECOIL_MS = 320;
const TAP_PULL_MS = 850;

type Strand = {
  offset: number; // -1..1, place across the fan
  breakAt: number; // share of MAX_PULL at which it snaps
  width: number;
  sag: number;
  broken: boolean;
  brokeAt: number;
  from: Pt; // anchor when it snapped
  to: Pt; // hand end when it snapped
};

/* Nearest point on a pill's outline (a stadium), moved `inset` px inside,
   and the signed distance from the outline to p (negative = inside). */
function stadium(r: DOMRect, p: Pt, inset: number) {
  const R = r.height / 2;
  const cy = r.top + R;
  const qx = Math.min(Math.max(p.x, r.left + R), r.right - R);
  const dx = p.x - qx;
  const dy = p.y - cy;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  return {
    pt: { x: qx + ux * (R - inset), y: cy + uy * (R - inset) },
    dist: len - R,
    u: { x: ux, y: uy },
  };
}

/* A tapered, sagging strand as a filled outline along a quadratic curve. */
function strandPath(
  a: Pt,
  b: Pt,
  wa: number,
  wb: number,
  thin: number,
  sag: number,
) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 + sag;
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const s = i / SAMPLES;
    const u = 1 - s;
    const x = u * u * a.x + 2 * u * s * mx + s * s * b.x;
    const y = u * u * a.y + 2 * u * s * my + s * s * b.y;
    const tx = 2 * u * (mx - a.x) + 2 * s * (b.x - mx);
    const ty = 2 * u * (my - a.y) + 2 * s * (b.y - my);
    const tl = Math.hypot(tx, ty) || 1;
    const nx = -ty / tl;
    const ny = tx / tl;
    /* Never thinner than ~3px across, or the goo filter erases it. */
    const w = Math.max(
      ((wa + (wb - wa) * s) * (1 - thin * Math.sin(Math.PI * s))) / 2,
      1.5,
    );
    left.push({ x: x + nx * w, y: y + ny * w });
    right.push({ x: x - nx * w, y: y - ny * w });
  }
  const pts = left.concat(right.reverse());
  let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++)
    d += `L${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
  return d + "Z";
}

const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);

const neverChanges = () => () => {};
const onClient = () => true;
const onServer = () => false;

/* The goo button under an event, if it is one that can be pressed. */
function gooTarget(e: Event): HTMLElement | null {
  const el = (e.target as Element | null)?.closest?.(
    SELECTOR,
  ) as HTMLElement | null;
  if (!el || el.matches(":disabled")) return null;
  return el;
}

const GooCursor: React.FC = () => {
  const reduce = useReducedMotion();
  const gooId = `goo-${useId().replace(/:/g, "")}`;
  const groupRef = useRef<SVGGElement>(null);
  /* "On the client?" read the way the rest of the site reads it. */
  const onClientSide = useSyncExternalStore(neverChanges, onClient, onServer);
  const effect = onClientSide && !reduce;

  useEffect(() => {
    if (!effect) return;
    const group = groupRef.current;
    if (!group) return;

    const root = document.documentElement;
    const fine = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    const paths = Array.from(group.querySelectorAll("path"));
    const blob = group.querySelector("circle")!;

    let pointer: Pt | null = null;
    let target: HTMLElement | null = null; // the button being held
    let strands: Strand[] = [];
    let raf = 0;
    let tap: { start: number; from: Pt; to: Pt } | null = null;
    const settling = new Map<HTMLElement, number>();

    const newStrands = () => {
      strands = Array.from({ length: STRANDS }, (_, i) => ({
        offset: (i / (STRANDS - 1)) * 2 - 1 + (Math.random() - 0.5) * 0.25,
        breakAt: 0.5 + Math.random() * 0.45,
        width: 4 + Math.random() * 4.5,
        sag: 0.4 + Math.random() * 0.8,
        broken: false,
        brokeAt: 0,
        from: { x: 0, y: 0 },
        to: { x: 0, y: 0 },
      }));
      /* The thickest strand holds out to the full pull. */
      strands.reduce((a, b) => (b.width > a.width ? b : a)).breakAt = 1;
    };

    /* Springs a released button back, then hands it back to its own classes
       (its hover transitions) once the spring has settled. */
    const release = (el: HTMLElement) => {
      el.style.transition = "transform 650ms cubic-bezier(.34,1.9,.5,1)";
      el.style.transform = "";
      clearTimeout(settling.get(el));
      settling.set(
        el,
        window.setTimeout(() => {
          el.style.transition = "";
          settling.delete(el);
        }, 700),
      );
    };

    const grab = (el: HTMLElement | null) => {
      if (target && target !== el) release(target);
      target = el;
      if (el) {
        clearTimeout(settling.get(el));
        el.style.transition = "none";
        newStrands();
      }
    };

    const breakAll = (now: number) => {
      for (const s of strands) {
        if (!s.broken) {
          s.broken = true;
          s.brokeAt = now;
        }
      }
      grab(null);
    };

    const frame = (now: number) => {
      raf = 0;
      let live = false;

      if (target && !target.isConnected) breakAll(now);

      let p = pointer;
      if (tap) {
        const k = Math.min((now - tap.start) / TAP_PULL_MS, 1);
        /* Ease in and out, so the stretch is slow enough to see. */
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        p = {
          x: tap.from.x + (tap.to.x - tap.from.x) * e,
          y: tap.from.y + (tap.to.y - tap.from.y) * e,
        };
        if (k >= 1) tap = null;
        else live = true;
      }

      const r = target?.getBoundingClientRect();
      const R = r ? r.height / 2 : 0;
      const hold = r && p ? stadium(r, p, 0) : null;
      const pull = hold ? Math.max(hold.dist, 0) / MAX_PULL : 0;
      const stretching = !!hold && hold.dist > 2;

      if (target && hold) {
        const tug = Math.min(pull * 14, 14);
        target.style.transform = `translate(${(hold.u.x * tug).toFixed(1)}px, ${(hold.u.y * tug).toFixed(1)}px)`;
      }

      strands.forEach((s, i) => {
        const path = paths[i];
        if (s.broken) {
          const k = (now - s.brokeAt) / RECOIL_MS;
          if (k >= 1) {
            path.setAttribute("d", "");
            return;
          }
          live = true;
          const e = easeOut(k);
          const b = {
            x: s.to.x + (s.from.x - s.to.x) * e,
            y: s.to.y + (s.from.y - s.to.y) * e,
          };
          path.setAttribute(
            "d",
            strandPath(
              s.from,
              b,
              s.width * (1 - e * 0.5),
              3 * (1 - e),
              0.6,
              10 * (1 - e),
            ),
          );
          return;
        }
        if (!stretching || !hold || !p || !r) {
          path.setAttribute("d", "");
          return;
        }
        live = true;
        /* Wide apart at the button so the goo filter keeps them as separate
           strings; gathered into the fist at the hand. */
        const v = { x: -hold.u.y, y: hold.u.x };
        const spread = R * (1.1 + pull * 1.4);
        const fan = {
          x: p.x + v.x * s.offset * spread,
          y: p.y + v.y * s.offset * spread,
        };
        const a = stadium(r, fan, 4).pt;
        const b = { x: p.x + v.x * s.offset * 6, y: p.y + v.y * s.offset * 6 };
        if (pull >= s.breakAt) {
          s.broken = true;
          s.brokeAt = now;
          s.from = a;
          s.to = b;
          return;
        }
        const wobble = Math.sin(now / 180 + i * 1.7) * 2 * pull;
        path.setAttribute(
          "d",
          strandPath(
            a,
            b,
            s.width * (1.6 - pull * 0.5),
            s.width * 0.7,
            0.3 + pull * 0.35,
            s.sag * pull * 42 + wobble,
          ),
        );
      });

      if (target && strands.every((s) => s.broken)) grab(null);

      /* A small knot of tar where the strands meet, at the cursor tip. */
      const holding = !!target && stretching && p;
      blob.setAttribute("r", holding ? "5" : "0");
      if (holding && p) {
        blob.setAttribute("cx", p.x.toFixed(1));
        blob.setAttribute("cy", p.y.toFixed(1));
      }

      /* Only while something is drawn or moving; a resting pointer on a
         button draws nothing, and the next pointermove restarts the loop. */
      if (live) raf = requestAnimationFrame(frame);
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    /* ---- hovering pointer ---- */
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pointer = { x: e.clientX, y: e.clientY };
      const hit = gooTarget(e);
      /* Moving onto another button lets go of the one being held. */
      if (hit && hit !== target) {
        if (target) breakAll(performance.now());
        grab(hit);
      }
      if (target || strands.some((s) => !s.broken) || hit) kick();
    };

    const onLeaveWindow = () => {
      pointer = null;
      if (target) breakAll(performance.now());
      kick();
    };

    /* ---- touch ---- */
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      const hit = gooTarget(e);
      if (!hit) return;
      if (target) breakAll(performance.now());
      const r = hit.getBoundingClientRect();
      const from = { x: e.clientX, y: e.clientY };
      const side = Math.sign(from.x - (r.left + r.width / 2)) || 1;
      tap = {
        start: performance.now(),
        from,
        to: { x: from.x + side * 50, y: r.top - MAX_PULL * 1.15 },
      };
      grab(hit);
      kick();
    };

    document.addEventListener("pointerdown", onDown, { passive: true });
    if (fine) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("scroll", kick, { passive: true });
      root.addEventListener("pointerleave", onLeaveWindow);
      /* Leaving the tab mid-pull may never fire pointerleave. */
      window.addEventListener("blur", onLeaveWindow);
    }

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", kick);
      window.removeEventListener("blur", onLeaveWindow);
      root.removeEventListener("pointerleave", onLeaveWindow);
      settling.forEach((t, el) => {
        clearTimeout(t);
        el.style.transition = "";
      });
      if (target) {
        target.style.transform = "";
        target.style.transition = "";
      }
    };
  }, [effect]);

  if (!effect) return null;

  return (
    /* Above the page and the chat, below the intro loader and skip link. */
    <svg
      className="pointer-events-none fixed inset-0 z-80 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <filter
          id={gooId}
          filterUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 16 -5"
          />
        </filter>
      </defs>
      <g
        ref={groupRef}
        filter={`url(#${gooId})`}
        style={{ fill: "var(--color-bone)" }}
      >
        {Array.from({ length: STRANDS }, (_, i) => (
          <path key={i} />
        ))}
        <circle r="0" />
      </g>
    </svg>
  );
};

export default GooCursor;
