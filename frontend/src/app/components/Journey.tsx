"use client";

import { Reveal } from "./ui/Motion";
import { about, journey } from "../../data/content";

/* Two marks, one per kind of entry. Inline SVG so they take the text colour
   and cost no request. */
const Icon: React.FC<{ kind: "education" | "experience" }> = ({ kind }) => (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {kind === "education" ? (
      /* Mortarboard */
      <>
        <path d="M22 9L12 4 2 9l10 5 10-5z" />
        <path d="M6 11.5V16c0 1.3 2.7 2.5 6 2.5s6-1.2 6-2.5v-4.5" />
      </>
    ) : (
      /* Briefcase */
      <>
        <rect x="2.5" y="7.5" width="19" height="12" rx="2" />
        <path d="M9 7.5V6a2 2 0 012-2h2a2 2 0 012 2v1.5M2.5 12.5h19" />
      </>
    )}
  </svg>
);

/**
 * The journey: study and work on one timeline, oldest first.
 *
 * Both kinds of entry come from the same `journey` array, which is derived
 * from `education` and `experience` rather than retyped — so the timeline can
 * never drift out of step with the rest of the site.
 *
 * The rail is drawn as a border on the list rather than as an absolutely
 * positioned element, so it grows with the content and cannot end short of
 * the last node. Each node sits on that line via a negative offset, and the
 * final entry masks the rail below it so the line stops at the last marker
 * instead of trailing into empty space.
 */
const Journey: React.FC = () => {
  return (
    <div id="journey" className="scroll-mt-24">
      <div className="flex items-center gap-4 pb-6">
        <span className="label text-muted">{about.journeyLabel}</span>
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
      </div>

      <ol>
        {journey.map((entry, i) => {
            const isLast = i === journey.length - 1;

            return (
              <li
                key={entry.id}
                className="relative pb-10 pl-10 last:pb-0 sm:pl-16"
              >
                {/* The rail. Drawn per-item and stopped on the last one, so
                    it never runs past the final marker. */}
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[15px] top-10 h-[calc(100%-2.5rem)] w-px bg-line sm:left-[19px]"
                  />
                )}

                {/* Node */}
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-card text-bone sm:h-10 sm:w-10"
                >
                  <Icon kind={entry.kind} />
                </span>

                <Reveal y={32}>
                  <article className="rounded-3xl border border-line bg-card p-6 sm:p-8">
                    <header className="flex flex-wrap items-center gap-3">
                      <span className="label rounded-full border border-line px-3 py-1.5 text-muted">
                        {entry.tag}
                      </span>
                      <span className="label text-muted">{entry.dates}</span>
                    </header>

                    <h3 className="mt-5 text-lg font-semibold leading-snug tracking-tight text-bone sm:text-xl">
                      {entry.title}
                    </h3>
                    <p className="mt-2 text-sm text-bone/70">{entry.org}</p>

                    {entry.summary && (
                      <p className="mt-3 text-sm text-muted">{entry.summary}</p>
                    )}

                    {entry.points && entry.points.length > 0 && (
                      <ul className="mt-6 space-y-3 border-t border-line pt-5">
                        {entry.points.map((point, index) => (
                          <li key={point} className="flex gap-4">
                            <span className="label shrink-0 pt-[0.2em] tabular-nums text-muted">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <p className="text-sm leading-[1.8] text-bone/80">
                              {point}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}

                    {entry.chips && entry.chips.length > 0 && (
                      <div className="mt-6 border-t border-line pt-5">
                        {entry.chipsLabel && (
                          <p className="label text-muted">{entry.chipsLabel}</p>
                        )}
                        <ul className="mt-3 flex flex-wrap gap-2">
                          {entry.chips.map((chip) => (
                            <li
                              key={chip}
                              className="rounded-full border border-line bg-ink px-3 py-1.5 text-xs text-muted"
                            >
                              {chip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </article>
                </Reveal>
              </li>
            );
          })}
      </ol>
    </div>
  );
};

export default Journey;
