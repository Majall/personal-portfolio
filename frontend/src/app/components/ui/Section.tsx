"use client";

import type { ReactNode } from "react";

/* Full-bleed chapter wrapper. `tone` picks which end of the mono scale the
   section paints itself with; globals.css resolves it (and inverts the whole
   rhythm in dark mode). */
export function Section({
  id,
  tone = "bone",
  children,
  className,
}: {
  id?: string;
  tone?: "ink" | "bone";
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      data-tone={tone}
      className={`tone-surface relative w-full overflow-hidden scroll-mt-24 ${
        className ?? ""
      }`}
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
      className={`flex items-center gap-4 border-b pb-4 rule ${className ?? ""}`}
    >
      <span className="label text-muted">{children}</span>
      <span className="h-px flex-1 bg-current opacity-15" aria-hidden="true" />
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
