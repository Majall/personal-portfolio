"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * One place where reduced motion is decided.
 *
 * `reducedMotion="user"` makes Framer refuse transform and layout animations
 * for visitors who ask for reduced motion, while still allowing opacity — a
 * fade is not a vestibular trigger, a slide is. Crucially it does this
 * *inside* the motion components, so the markup is identical whether or not
 * the preference is set.
 *
 * That is what makes it correct for server rendering. The server has no way
 * to know a visitor's preference, so any component that picked a different
 * tree based on it would render one thing on the server and another on the
 * client, and hydration would fail. Handling it here means the primitives in
 * Motion.tsx never have to branch their markup at all.
 *
 * CSS-driven motion — the marquee, the smoke, button transitions — is not
 * Framer's to govern and is clamped by the prefers-reduced-motion block in
 * globals.css instead. The intro loader is a separate case again: it is
 * skipped outright, and renders null on both sides, so it cannot mismatch.
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
