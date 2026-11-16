"use client";

import { Section, SectionLabel, Container } from "./ui/Section";
import { ChapterHeading, Reveal, RevealGroup, RevealItem, GhostWord, TextRoll } from "./ui/Motion";
import TechStrip from "./TechStrip";
import {
  about,
  profile,
  education,
  educationSection,
  languages,
  languagesSection,
  strengths,
  strengthsSection,
} from "../../data/content";

/**
 * About.
 *
 * Two columns at desktop: the chapter heading and the stat row on the left,
 * the bio in a lifted card on the right. The card is the only panel in this
 * chapter that sits above the page surface, which is what gives the bio its
 * weight without needing a rule or a heading of its own.
 *
 * Below that: the stack belt, then the record — education, languages and
 * strengths — in three plain columns. Those three are set quietly on purpose;
 * they are supporting evidence for the bio, not chapters in their own right.
 */
const About: React.FC<{ resumeHref?: string | null }> = ({ resumeHref }) => {
  return (
    <Section id="about" className="py-24 sm:py-32">
      <GhostWord
        text={about.ghostWord}
        className="left-0 top-[18%] text-[26vw]"
      />

      <Container className="relative z-10">
        <SectionLabel index={about.index}>{about.eyebrow}</SectionLabel>

        <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-20">
          {/* ---- Left: heading + stats ---- */}
          <div>
            <ChapterHeading
              text={about.heading}
              accent={about.headingAccent}
              className="chrome-text text-chapter"
            />

            <RevealGroup className="mt-12 grid grid-cols-1 gap-7 sm:grid-cols-3">
              {about.highlights.map((item) => (
                <RevealItem key={item.label}>
                  {/* Sized to fit the longest value ("CCNA 200-301") on one
                      line in a third of the column — at a fixed 1.75rem it
                      breaks at the hyphen and reads as two stats. */}
                  <p className="display text-[clamp(1.05rem,1.55vw,1.6rem)] text-bone">
                    {item.value}
                  </p>
                  <p className="label mt-2 text-muted">{item.label}</p>
                </RevealItem>
              ))}
            </RevealGroup>

            <Reveal delay={0.1}>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <p className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2">
                  <span
                    className="block h-1.5 w-1.5 rounded-full bg-signal"
                    aria-hidden="true"
                  />
                  <span className="label text-signal">
                    {about.availabilityLabel}
                  </span>
                </p>

                {resumeHref && (
                  <a
                    href={resumeHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group rounded-full bg-bone px-6 py-3 label text-ink transition-opacity hover:opacity-85"
                  >
                    <TextRoll label={about.resumeLabel} />
                  </a>
                )}
              </div>
            </Reveal>
          </div>

          {/* ---- Right: the bio, lifted off the page ---- */}
          <Reveal delay={0.12}>
            <div className="rounded-3xl border border-line bg-card p-7 sm:p-10">
              <p className="text-[0.975rem] leading-[1.85] text-bone/85 sm:text-base">
                {about.bio}
              </p>

              <p className="mt-8 border-t border-line pt-6 text-sm leading-relaxed text-muted">
                {profile.availability}
              </p>
            </div>
          </Reveal>
        </div>
      </Container>

      {/* ---- The stack belt ---- */}
      <TechStrip />

      {/* ---- The record ---- */}
      <Container className="relative z-10">
        <div className="mt-20 grid gap-12 border-t border-line pt-12 sm:mt-28 md:grid-cols-3 md:gap-10">
          {/* Education */}
          <Reveal>
            <h3 className="label text-muted">{educationSection.label}</h3>
            {education.map((item) => (
              <div key={item.qualification} className="mt-5">
                <p className="text-base font-medium leading-snug text-bone">
                  {item.qualification}
                </p>
                <p className="mt-1.5 text-sm text-muted">{item.institution}</p>
                <p className="label mt-2 text-muted">{item.dates}</p>

                <p className="label mt-6 text-muted">
                  {educationSection.modulesLabel}
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {item.modules.map((module) => (
                    <li
                      key={module}
                      className="rounded-full border border-line px-3 py-1.5 text-xs text-muted"
                    >
                      {module}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Reveal>

          {/* Languages */}
          <Reveal delay={0.08}>
            <h3 className="label text-muted">{languagesSection.label}</h3>
            <ul className="mt-5 space-y-4">
              {languages.map((language) => (
                <li
                  key={language.name}
                  className="border-b border-line pb-4 last:border-0"
                >
                  <p className="text-base text-bone">{language.name}</p>
                  <p className="mt-1 text-sm text-muted">{language.level}</p>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Strengths */}
          <Reveal delay={0.16}>
            <h3 className="label text-muted">{strengthsSection.label}</h3>
            <ul className="mt-5 flex flex-wrap gap-2">
              {strengths.map((strength) => (
                <li
                  key={strength}
                  className="rounded-full border border-line bg-card px-3.5 py-2 text-xs text-muted"
                >
                  {strength}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
};

export default About;
