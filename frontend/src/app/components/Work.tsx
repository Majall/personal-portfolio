"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Section, SectionLabel, Container } from "./ui/Section";
import { Reveal, SplitHeading, GhostWord } from "./ui/Motion";
import { projects, projectsSection, ui } from "../../data/content";

const EASE = [0.22, 1, 0.36, 1] as const;

const Work: React.FC = () => {
  const reduce = useReducedMotion();
  const railRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const scrollByCard = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth + 24 : rail.clientWidth * 0.8;
    rail.scrollBy({
      left: step * direction,
      behavior: reduce ? "auto" : "smooth",
    });
  };

  /* Track which card is centred, to drive the counter and the curvature. */
  const onRailScroll = () => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth + 24 : 1;
    setActive(Math.round(rail.scrollLeft / step));
  };

  return (
    <Section id="work" tone="bone" className="py-20 sm:py-28 lg:py-36">
      <GhostWord
        text={projectsSection.ghostWord}
        className="right-0 top-[8%] text-[24vw] leading-none"
        from={120}
        to={-120}
      />

      <Container className="relative z-10">
        <SectionLabel index={projectsSection.index}>
          {projectsSection.eyebrow}
        </SectionLabel>

        <div className="mt-12 flex flex-col gap-6 lg:mt-16 lg:flex-row lg:items-end lg:justify-between">
          <SplitHeading
            text={projectsSection.heading}
            className="display text-chapter"
          />
          <Reveal delay={0.1}>
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              {projectsSection.note}
            </p>
          </Reveal>
        </div>
      </Container>

      {/* Perspective rail. The cards sit on a 3D plane so the ones at the
          edges bend away. Native scroll-snap keeps it fully usable by touch
          and keyboard. */}
      <div className="relative mt-12 lg:mt-20" style={{ perspective: "1800px" }}>
        <div
          ref={railRef}
          onScroll={onRailScroll}
          tabIndex={0}
          role="region"
          aria-label="Project carousel"
          className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-6 sm:px-8 lg:px-12"
          style={{ transformStyle: "preserve-3d" }}
        >
          {projects.map((project, index) => {
            const offset = index - active;
            /* Clamp so far-off cards do not fold flat. */
            const rotateY = reduce ? 0 : Math.max(-14, Math.min(14, offset * -7));
            const z = reduce ? 0 : -Math.abs(offset) * 60;

            return (
              <motion.article
                key={project.id}
                data-card
                initial={reduce ? false : { opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.7, ease: EASE }}
                className="group relative w-[82vw] shrink-0 snap-center sm:w-[60vw] lg:w-[38vw] xl:w-[32vw]"
                style={{
                  transform: `rotateY(${rotateY}deg) translateZ(${z}px)`,
                  transformStyle: "preserve-3d",
                  transition: reduce
                    ? undefined
                    : "transform 600ms cubic-bezier(0.22,1,0.36,1)",
                }}
              >
                <div className="relative aspect-[16/11] w-full overflow-hidden bg-ink-800">
                  {project.image ? (
                    <Image
                      src={project.image}
                      alt={`${project.titleLead} ${project.titleAccent} screenshot`}
                      fill
                      sizes="(max-width: 640px) 82vw, (max-width: 1024px) 60vw, 34vw"
                      className="object-cover grayscale transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:grayscale-0 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="label text-bone-400">{ui.noImage}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-start justify-between gap-4 border-t pt-4 rule">
                  <div className="min-w-0">
                    {/* Two-part title: heavy display lead, lighter accent. */}
                    <h3 className="text-xl sm:text-2xl">
                      <span className="display">{project.titleLead}</span>{" "}
                      <span className="font-light italic lowercase tracking-tight text-muted">
                        {project.titleAccent}
                      </span>
                    </h3>

                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {project.description}
                    </p>

                    {project.tech.length > 0 && (
                      <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5">
                        {project.tech.map((tech) => (
                          <li key={tech} className="label text-muted">
                            {tech}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <span className="label shrink-0 text-muted">
                    {project.number}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-ink-900 px-5 py-2.5 label text-bone-100 transition-opacity hover:opacity-85 dark:bg-bone-100 dark:text-ink-900"
                    >
                      <span className="sr-only">
                        View {project.titleLead} {project.titleAccent} live site
                      </span>
                      <span aria-hidden="true">
                        {projectsSection.liveLabel} ↗
                      </span>
                    </a>
                  )}
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border px-5 py-2.5 label rule transition-colors hover:border-current"
                    >
                      <span className="sr-only">
                        View {project.titleLead} {project.titleAccent} source on
                        GitHub
                      </span>
                      <span aria-hidden="true">{projectsSection.codeLabel}</span>
                    </a>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>

      {/* Rail controls */}
      <Container className="relative z-10">
        <div className="mt-6 flex items-center justify-between border-t pt-5 rule">
          <span className="label text-muted">
            {String(Math.min(active + 1, projects.length)).padStart(2, "0")} /{" "}
            {String(projects.length).padStart(2, "0")}
          </span>
          <div className="flex items-center gap-4">
            <span className="hidden label text-muted sm:block">
              {projectsSection.railHint}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => scrollByCard(-1)}
                aria-label={projectsSection.prevLabel}
                className="flex h-10 w-10 items-center justify-center rounded-full border rule transition-colors hover:border-current"
              >
                <span aria-hidden="true">←</span>
              </button>
              <button
                onClick={() => scrollByCard(1)}
                aria-label={projectsSection.nextLabel}
                className="flex h-10 w-10 items-center justify-center rounded-full border rule transition-colors hover:border-current"
              >
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
};

export default Work;
