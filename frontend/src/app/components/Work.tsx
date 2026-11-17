"use client";

import Image from "next/image";
import { Section, SectionLabel, Container } from "./ui/Section";
import { ChapterHeading, Reveal, GhostWord, TextRoll } from "./ui/Motion";
import { projects, projectsSection, profile, ui } from "../../data/content";

/**
 * Projects, as full-width alternating rows.
 *
 * Each row is a screenshot on one side and the write-up on the other, and the
 * sides flip on every second row so the page reads as a zig-zag rather than a
 * column. On mobile the two halves stack, screenshot first.
 */
const Work: React.FC = () => {
  return (
    <Section id="project" className="py-24 sm:py-32">
      <GhostWord
        text={projectsSection.ghostWord}
        className="right-0 top-[10%] text-[26vw]"
        from={120}
        to={-120}
      />

      <Container className="relative z-10">
        <SectionLabel index={projectsSection.index}>
          {projectsSection.eyebrow}
        </SectionLabel>

        <div className="mt-14 grid gap-10 md:grid-cols-2 md:items-start md:gap-16">
          <ChapterHeading
            text={projectsSection.heading}
            accent={projectsSection.headingAccent}
            className="chrome-text text-chapter"
          />

          <Reveal delay={0.1} className="md:pt-3">
            <p className="text-sm leading-relaxed text-muted">
              {projectsSection.note}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full bg-bone px-6 py-3.5 label text-ink transition-opacity hover:opacity-85"
              >
                <TextRoll label={projectsSection.browseLabel} />
                <span aria-hidden="true">↗</span>
              </a>

              <a
                href={profile.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full border border-line px-6 py-3.5 label text-bone transition-colors hover:border-bone"
              >
                <TextRoll label={projectsSection.messageLabel} />
              </a>
            </div>
          </Reveal>
        </div>
      </Container>

      {/* ---- Alternating rows ---- */}
      <div className="mt-20 sm:mt-28">
        {projects.map((project, i) => {
          const flipped = i % 2 === 1;

          return (
            <Reveal key={project.id} y={40}>
              <article className="grid items-center gap-8 border-t border-line py-12 md:grid-cols-2 md:gap-16 md:py-16">
                {/* Screenshot */}
                {/* 16/10 and `object-contain`, not 4/3 and `object-cover`.
                    These are wide browser screenshots — they run from about
                    1.6:1 to 2:1 — so a 4/3 frame with cover scaled them to
                    fill and sliced the sides off. Contain shows the whole
                    shot; 16/10 sits at the narrow end of the real range, so
                    the widest ones letterbox only slightly and the rest fill
                    the frame almost exactly. The surface behind makes that
                    letterboxing read as a mount rather than a gap. */}
                <div
                  className={`relative aspect-[16/10] w-full overflow-hidden bg-surface ${
                    flipped ? "md:order-2" : "md:order-1"
                  }`}
                >
                  {project.image ? (
                    <Image
                      src={project.image}
                      alt={`${project.titleLead} ${project.titleAccent} screenshot`}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-contain transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="label text-muted">{ui.noImage}</span>
                    </div>
                  )}
                </div>

                {/* Text */}
                <div
                  className={`px-4 sm:px-8 ${
                    flipped
                      ? "md:order-1 md:pl-12 md:pr-0"
                      : "md:order-2 md:pl-0 md:pr-12"
                  }`}
                >
                  <p className="label text-muted">{project.number}</p>

                  <h3 className="mt-5 text-[clamp(1.5rem,3.4vw,2.5rem)] leading-[0.95]">
                    <span className="display text-bone">
                      {project.titleLead}
                    </span>{" "}
                    <span className="serif-accent text-bone/85">
                      {project.titleAccent}
                    </span>
                  </h3>

                  <p className="mt-6 max-w-xl text-sm leading-[1.85] text-muted">
                    {project.description}
                  </p>

                  <ul className="mt-8 flex flex-wrap gap-2">
                    {project.tech.map((tech) => (
                      <li
                        key={tech}
                        className="rounded-full border border-line bg-card px-3.5 py-2 text-xs text-muted"
                      >
                        {tech}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 flex flex-wrap gap-2.5">
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-2 rounded-full bg-bone px-5 py-2.5 label text-ink transition-opacity hover:opacity-85"
                      >
                        <TextRoll label={projectsSection.liveLabel} />
                        <span aria-hidden="true">↗</span>
                      </a>
                    )}

                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 label text-bone transition-colors hover:border-bone"
                    >
                      <TextRoll label={projectsSection.codeLabel} />
                    </a>
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
};

export default Work;
