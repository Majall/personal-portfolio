"use client";

import type { ReactNode } from "react";

/**
 * Full-bleed chapter wrapper.
 *
 * There is no `tone` prop and no alternation between light and dark chapters.
 * The whole page is dark, and chapters separate themselves with near-black
 * steps instead: `ink` is the page, `surface` lifts a chapter slightly off it.
 * The one bright surface on the site is the expanded service row.
 */
export function Section({
  id,
  surface = false,
  children,
  className,
}: {
  id?: string;
  surface?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`relative w-full overflow-hidden scroll-mt-20 ${
        surface ? "bg-surface" : "bg-ink"
      } ${className ?? ""}`}
    >
      {children}
    </section>
  );
}

/* The tiny letterspaced eyebrow pinned to the top of each chapter, with the
   hairline rule that runs off to the edge. */
export function SectionLabel({
  children,
  index,
  className,
}: {
  children: ReactNode;
  index?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-4 border-b border-line pb-4 ${
        className ?? ""
      }`}
    >
      <span className="label text-muted">{children}</span>
      <span className="h-px flex-1 bg-line" aria-hidden="true" />
      {index ? <span className="label text-muted">{index}</span> : null}
    </div>
  );
}

/* Consistent horizontal gutter. 16px at phone width, opening up from there. */
export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto w-full max-w-[1500px] px-4 sm:px-8 lg:px-12 ${
        className ?? ""
      }`}
    >
      {children}
    </div>
  );
}
