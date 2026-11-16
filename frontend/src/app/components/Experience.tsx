"use client";

import { Section, SectionLabel, Container } from "./ui/Section";
import { ChapterHeading, Reveal, RevealGroup, RevealItem, GhostWord } from "./ui/Motion";
import { experience, experienceSection } from "../../data/content";

/**
 * Experience.
 *
 * One role, so this is deliberately a single wide card rather than a
 * timeline: a rail with one stop on it looks like a mistake. The bullets run
 * in two columns at desktop and are numbered, which keeps a seven-item list
 * from reading as an undifferentiated block.
 */
const ExperienceSection: React.FC = () => {
  return (
    <Section id="experience" surface className="py-24 sm:py-32">
      <GhostWord
        text={experienceSection.ghostWord}
        className="left-0 top-[12%] text-[26vw]"
      />

      <Container className="relative z-10">
        <SectionLabel index={experienceSection.index}>
          {experienceSection.eyebrow}
        </SectionLabel>

        <div className="mt-14 grid gap-10 md:grid-cols-2 md:items-start md:gap-16">
          <ChapterHeading
            text={experienceSection.heading}
            accent={experienceSection.headingAccent}
            className="chrome-text text-chapter"
          />

          <Reveal delay={0.1} className="md:pt-3">
            <p className="text-sm leading-relaxed text-muted">
              {experienceSection.note}
            </p>
          </Reveal>
        </div>

        {experience.map((role) => (
          <Reveal key={`${role.company}-${role.dates}`} delay={0.08} y={40}>
            <article className="mt-14 rounded-3xl border border-line bg-card p-7 sm:mt-20 sm:p-10 lg:p-12">
              <header className="flex flex-col gap-5 border-b border-line pb-8 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h3 className="display text-[clamp(1.4rem,3vw,2.25rem)] leading-[0.95] text-bone">
                    {role.role}
                  </h3>
                  <p className="mt-3 text-base text-bone/80">{role.company}</p>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <span className="rounded-full border border-line px-3.5 py-2 text-xs text-muted">
                    {role.type}
                  </span>
                  <span className="rounded-full border border-line px-3.5 py-2 text-xs text-muted">
                    {role.dates}
                  </span>
                </div>
              </header>

              <RevealGroup className="mt-8 grid gap-x-12 gap-y-0 md:grid-cols-2">
                {role.points.map((point, i) => (
                  <RevealItem key={point}>
                    <div className="flex gap-5 border-b border-line py-5">
                      <span className="label shrink-0 pt-1 tabular-nums text-muted">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <p className="text-sm leading-[1.8] text-bone/80">
                        {point}
                      </p>
                    </div>
                  </RevealItem>
                ))}
              </RevealGroup>
            </article>
          </Reveal>
        ))}
      </Container>
    </Section>
  );
};

export default ExperienceSection;
