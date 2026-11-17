"use client";

import { useState } from "react";
import { Section, Container } from "./ui/Section";
import { RevealGroup, RevealItem } from "./ui/Motion";
import {
  about,
  skillCategories,
  skillCount,
  toolkitSection,
  type SkillIcon,
} from "../../data/content";

/* ---------------------------------------------------------------------------
   Icons.

   Generic shapes rather than brand marks: shipping third-party logos means
   shipping their trademarks, and an off-colour logo reads worse than a clean
   symbol. Each is a 24-unit stroke glyph so they all share a weight, and they
   inherit `currentColor`, which each card sets to its discipline's accent.
--------------------------------------------------------------------------- */
const PATHS: Record<SkillIcon, string> = {
  code: "M8.5 7.5L4 12l4.5 4.5M15.5 7.5L20 12l-4.5 4.5M13.5 5l-3 14",
  component:
    "M12 3.2l3.3 1.9v3.8L12 10.8 8.7 8.9V5.1zM5.4 12.9l3.3 1.9v3.8L5.4 20.5l-3.3-1.9v-3.8zM18.6 12.9l3.3 1.9v3.8l-3.3 1.9-3.3-1.9v-3.8z",
  server: "M3.5 5.5h17v5h-17zM3.5 13.5h17v5h-17zM7 8h.01M7 16h.01",
  database:
    "M12 3.5c4.1 0 7 1.1 7 2.5s-2.9 2.5-7 2.5-7-1.1-7-2.5 2.9-2.5 7-2.5zM5 6v12c0 1.4 2.9 2.5 7 2.5s7-1.1 7-2.5V6M5 12c0 1.4 2.9 2.5 7 2.5s7-1.1 7-2.5",
  api: "M4 9h4M4 15h4M16 9h4M16 15h4M9.5 4.5h5a2 2 0 012 2v11a2 2 0 01-2 2h-5a2 2 0 01-2-2v-11a2 2 0 012-2z",
  terminal:
    "M5 4.5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1v-13a1 1 0 011-1zM7.5 9.5l3 2.5-3 2.5M13 15h4",
  network:
    "M12 3.5a2.2 2.2 0 110 4.4 2.2 2.2 0 010-4.4zM5 16.1a2.2 2.2 0 110 4.4 2.2 2.2 0 010-4.4zM19 16.1a2.2 2.2 0 110 4.4 2.2 2.2 0 010-4.4zM12 7.9v4.3M12 12.2l-5.7 4M12 12.2l5.7 4",
  route:
    "M6.5 4.5a2 2 0 110 4 2 2 0 010-4zM17.5 15.5a2 2 0 110 4 2 2 0 010-4zM6.5 8.5v4a4 4 0 004 4h4",
  globe:
    "M12 3.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17zM3.5 12h17M12 3.5c2.2 2.3 3.4 5.3 3.4 8.5S14.2 18.2 12 20.5c-2.2-2.3-3.4-5.3-3.4-8.5S9.8 5.8 12 3.5z",
  shield: "M12 3.5l7 2.6v5.2c0 4-2.9 7.4-7 9.2-4.1-1.8-7-5.2-7-9.2V6.1z",
  windows:
    "M4 6.4l7-1v6.1H4zM13 5.1l7-1v7.4h-7zM4 12.5h7v6.1l-7-1zM13 12.5h7v7.4l-7-1z",
  users:
    "M9 11.5a3.2 3.2 0 110-6.4 3.2 3.2 0 010 6.4zM3 19.5c0-3 2.7-5 6-5s6 2 6 5M16 5.6a3.2 3.2 0 010 6.1M18 14.8c2 .6 3.5 2.2 3.5 4.7",
  folder:
    "M3.5 6.5a1 1 0 011-1h4l2 2.4h9a1 1 0 011 1v9.6a1 1 0 01-1 1h-15a1 1 0 01-1-1z",
  key: "M15.5 4.5a4.5 4.5 0 11-4.3 5.8L4 17.5V20h3l.8-.8.9.9 1.4-1.4-.9-.9 1.6-1.6a4.5 4.5 0 104.7-11.7zM16.8 8.2h.01",
  wrench:
    "M15.3 4.6a5 5 0 00-5.6 6.6L4 16.9 7.1 20l5.7-5.7a5 5 0 006.6-5.6l-2.9 2.9-2.4-.6-.6-2.4z",
  git: "M12 3.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17zM12 8.4v7.2M8.4 10.2a1.8 1.8 0 103.6 0M15.6 13.8a1.8 1.8 0 10-3.6 0",
  box: "M12 3.6l7.5 4.2v8.4L12 20.4 4.5 16.2V7.8zM4.5 7.8L12 12l7.5-4.2M12 12v8.4",
  wifi: "M3 9.2a13 13 0 0118 0M6.3 12.7a8.4 8.4 0 0111.4 0M9.6 16.2a3.8 3.8 0 014.8 0M12 19.6h.01",
};

const Icon: React.FC<{ name: SkillIcon }> = ({ name }) => (
  <svg
    viewBox="0 0 24 24"
    className="h-6 w-6"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={PATHS[name]} />
  </svg>
);

/**
 * The toolkit: a filter bar over four discipline grids.
 *
 * Every count — on the tabs and beside each heading — is derived from the
 * array it describes rather than written down, so adding a skill can never
 * leave a number lying.
 *
 * Filtering hides whole disciplines rather than re-sorting cards, which keeps
 * the grid stable: a card never moves because a different tab is active, it is
 * either shown under its own heading or not shown at all.
 */
const Toolkit: React.FC = () => {
  const [active, setActive] = useState<string>("all");
  const shown = skillCategories.filter(
    (category) => active === "all" || category.key === active,
  );

  const tabs = [
    { key: "all", label: toolkitSection.allLabel, count: skillCount },
    ...skillCategories.map((category) => ({
      key: category.key,
      label: category.label,
      count: category.items.length,
    })),
  ];

  return (
    /* Page colour, not `surface`. Services sits directly above this now and
       is already lifted; two lifted chapters in a row would erase the
       boundary between them. */
    <Section id="toolkit" className="py-24 sm:py-32">
      <Container>
        <div className="flex items-center gap-4 pb-8">
          <span className="label text-muted">{about.toolkitLabel}</span>
          <span className="h-px flex-1 bg-line" aria-hidden="true" />
          <span className="label hidden text-muted sm:block">
            {toolkitSection.note}
          </span>
        </div>

        {/* ---- Filter bar ----
            Horizontally scrollable so every discipline stays reachable on a
            phone without wrapping to a second row and pushing the grid down
            the page. */}
        <div
          role="group"
          aria-label={toolkitSection.filterAria}
          className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
        >
          {tabs.map((tab) => {
            const on = active === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActive(tab.key)}
                aria-pressed={on}
                className={`flex shrink-0 items-center gap-2.5 rounded-full border px-4 py-2.5 transition-colors duration-300 ${
                  on
                    ? "border-bone bg-bone text-ink"
                    : "border-line bg-card text-muted hover:border-bone hover:text-bone"
                }`}
              >
                <span className="label">{tab.label}</span>
                <span
                  className={`label rounded-full px-1.5 py-0.5 tabular-nums ${
                    on ? "bg-ink/10 text-ink" : "bg-ink text-muted"
                  }`}
                >
                  {String(tab.count).padStart(2, "0")}
                </span>
              </button>
            );
          })}
        </div>

        {/* ---- Grids ---- */}
        <div className="mt-14 space-y-16">
          {shown.map((category) => (
            <section
              key={category.key}
              /* The accent is set once here and inherited by the dot, the
                 icons and each card's rule, so a discipline's colour lives in
                 exactly one place. */
              style={{ ["--cat" as string]: category.accent }}
            >
              <header className="flex items-center gap-4">
                <span
                  aria-hidden="true"
                  className="display text-[clamp(1.05rem,2.2vw,1.8rem)] leading-none text-muted"
                >
                  /
                </span>
                <h3 className="display text-[clamp(1.05rem,2.2vw,1.8rem)] leading-none text-bone">
                  {category.label}
                </h3>
                <span className="h-px flex-1 bg-line" aria-hidden="true" />
                <span className="label tabular-nums text-muted">
                  {String(category.items.length).padStart(2, "0")}
                </span>
                <span
                  aria-hidden="true"
                  className="block h-3 w-3 shrink-0 rounded-full"
                  style={{
                    background: "var(--cat)",
                    boxShadow: "0 0 14px 2px var(--cat)",
                  }}
                />
              </header>

              <RevealGroup
                className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
                stagger={0.04}
              >
                {category.items.map((skill) => (
                  <RevealItem key={`${category.key}-${skill.name}`}>
                    <article className="group flex h-full flex-col items-center justify-between gap-4 rounded-2xl border border-line bg-card p-5 text-center transition-colors duration-300 hover:border-[color:var(--cat)]">
                      <span
                        className="mt-1 block"
                        style={{ color: "var(--cat)" }}
                      >
                        <Icon name={skill.icon} />
                      </span>

                      <h4 className="label leading-[1.5] text-bone">
                        {skill.name}
                      </h4>

                      <span
                        aria-hidden="true"
                        className="block h-[3px] w-7 rounded-full transition-all duration-300 group-hover:w-10"
                        style={{ background: "var(--cat)" }}
                      />
                    </article>
                  </RevealItem>
                ))}
              </RevealGroup>
            </section>
          ))}
        </div>
      </Container>
    </Section>
  );
};

export default Toolkit;
