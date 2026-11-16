"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Section, SectionLabel, Container } from "./ui/Section";
import { ChapterHeading, Reveal } from "./ui/Motion";
import { services, servicesSection } from "../../data/content";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Services, as a single-open accordion.
 *
 * The expanded row inverts to a warm off-white panel with black type — the
 * one bright surface on the page. That inversion is doing the work a border
 * or a chevron would otherwise do: at a glance you can see which row is open
 * from across the page, with no other cue needed.
 *
 * Rows are buttons controlling a region, wired with aria-expanded and
 * aria-controls, so the open state is exposed rather than only drawn. Only
 * one row is open at a time; clicking the open row closes it.
 */
const Services: React.FC = () => {
  const reduce = useReducedMotion();
  /* First row open on arrival, matching the reference. */
  const [open, setOpen] = useState<string | null>(services[0]?.number ?? null);

  return (
    <Section id="service" surface className="py-24 sm:py-32">
      <Container className="relative z-10">
        <SectionLabel index={servicesSection.index}>
          {servicesSection.eyebrow}
        </SectionLabel>

        {/* The chapter heading sits hard right, against the left-aligned rows
            below it — the asymmetry is from the reference. */}
        <div className="mt-14 flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
          <Reveal className="order-2 max-w-md md:order-1">
            <p className="text-sm leading-relaxed text-muted">
              {servicesSection.note}
            </p>
          </Reveal>

          <ChapterHeading
            text={servicesSection.heading}
            accent={servicesSection.headingAccent}
            className="chrome-text order-1 text-chapter md:order-2 md:text-right"
          />
        </div>
      </Container>

      {/* Full-bleed rows. */}
      <div className="mt-16 border-t border-line">
        {services.map((service) => {
          const isOpen = open === service.number;
          const panelId = `service-panel-${service.number}`;
          const buttonId = `service-trigger-${service.number}`;

          return (
            <div
              key={service.number}
              className={`border-b border-line transition-colors duration-500 ${
                isOpen ? "bg-cream text-ink" : "bg-ink text-bone"
              }`}
            >
              <h3>
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : service.number)}
                  className="group flex w-full items-center gap-5 px-4 py-6 text-left transition-colors sm:gap-10 sm:px-8 sm:py-7 lg:px-12"
                >
                  <span
                    className={`label shrink-0 tabular-nums ${
                      isOpen ? "text-ink/60" : "text-muted"
                    }`}
                  >
                    {service.number}
                  </span>

                  <span className="display flex-1 text-base leading-tight sm:text-lg lg:text-xl">
                    {service.title}
                  </span>

                  {/* ↗ when open, ↘ when closed — the arrow rotates rather
                      than swapping, so the change reads as one movement. */}
                  <motion.span
                    aria-hidden="true"
                    className="shrink-0"
                    animate={{ rotate: isOpen ? -90 : 0 }}
                    transition={
                      reduce ? { duration: 0 } : { duration: 0.45, ease: EASE }
                    }
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5">
                      <path
                        d="M7 7l10 10M17 17V7.5M17 17H7.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                  </motion.span>
                </button>
              </h3>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    key="panel"
                    initial={reduce ? { height: "auto" } : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={reduce ? { height: "auto" } : { height: 0, opacity: 0 }}
                    transition={
                      reduce ? { duration: 0 } : { duration: 0.55, ease: EASE }
                    }
                    className="overflow-hidden"
                  >
                    <div className="grid gap-8 px-4 pb-9 sm:grid-cols-2 sm:gap-14 sm:px-8 lg:px-12 lg:pl-[7.5rem]">
                      <ul className="space-y-3">
                        {service.bullets.map((bullet) => (
                          <li
                            key={bullet}
                            className="flex gap-3 text-sm leading-relaxed text-ink/75"
                          >
                            <span
                              aria-hidden="true"
                              className="mt-[0.5em] block h-1 w-1 shrink-0 rounded-full bg-ink/40"
                            />
                            {bullet}
                          </li>
                        ))}
                      </ul>

                      <div>
                        <p className="text-sm leading-relaxed text-ink/75">
                          {service.description}
                        </p>

                        <a
                          href="#project"
                          className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 label text-cream transition-opacity hover:opacity-85"
                        >
                          {servicesSection.viewProjectsLabel}
                          <span aria-hidden="true">↗</span>
                        </a>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </Section>
  );
};

export default Services;
