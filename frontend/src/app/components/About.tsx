"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Section, SectionLabel, Container } from "./ui/Section";
import { Reveal, SplitHeading, GhostWord } from "./ui/Motion";
import {
  about,
  education,
  educationSection,
  experience,
  experienceSection,
  languages,
  languagesSection,
  profile,
  strengths,
  strengthsSection,
  ui,
} from "../../data/content";

const About: React.FC<{ resumeHref?: string | null }> = ({ resumeHref }) => {
  const reduce = useReducedMotion();

  const facts = [
    { label: "Based in", value: profile.location },
    { label: "Discipline", value: profile.title },
    { label: "Email", value: profile.email },
    { label: "Phone", value: profile.phone },
  ];

  return (
    <Section id="about" tone="ink" className="py-20 sm:py-28 lg:py-36">
      <GhostWord
        text={about.ghostWord}
        className="left-0 top-[12%] text-[28vw] leading-none"
        from={-80}
        to={80}
      />

      <Container className="relative z-10">
        <SectionLabel index={about.index}>{about.eyebrow}</SectionLabel>

        <div className="mt-12 grid gap-12 lg:mt-20 lg:grid-cols-12 lg:gap-16">
          {/* Portrait + availability */}
          <Reveal className="lg:col-span-5" y={32}>
            <div className="relative">
              {profile.profilePic ? (
                <motion.div
                  whileHover={reduce ? undefined : { scale: 1.015 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="relative aspect-[4/5] w-full overflow-hidden"
                >
                  <Image
                    src={profile.profilePic}
                    alt={`Portrait of ${profile.name}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover grayscale contrast-[1.05]"
                  />
                </motion.div>
              ) : (
                <div className="flex aspect-[4/5] w-full items-center justify-center border rule">
                  <span className="label text-muted">{ui.portraitMissing}</span>
                </div>
              )}
            </div>

            {profile.availability && (
              <div className="mt-6 border-t pt-5 rule">
                <p className="label mb-2.5 text-muted">
                  {about.availabilityLabel}
                </p>
                <p className="text-sm leading-relaxed">{profile.availability}</p>
              </div>
            )}
          </Reveal>

          {/* Narrative */}
          <div className="lg:col-span-7">
            <SplitHeading text={about.heading} className="display text-chapter" />

            <Reveal delay={0.1}>
              <p className="mt-8 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
                {about.bio}
              </p>
            </Reveal>

            {/* Three headline figures */}
            <Reveal delay={0.14}>
              <ul className="mt-10 grid gap-px border-y sm:grid-cols-3 rule">
                {about.highlights.map((item) => (
                  <li key={item.label} className="py-5 sm:py-6 sm:pr-6">
                    <p className="display text-2xl sm:text-[1.75rem]">
                      {item.value}
                    </p>
                    <p className="label mt-2 text-muted">{item.label}</p>
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* Fact table */}
            <Reveal delay={0.18}>
              <dl className="mt-10 border-t rule">
                {facts.map((fact) => (
                  <div
                    key={fact.label}
                    className="flex flex-wrap items-baseline justify-between gap-2 border-b py-3.5 rule"
                  >
                    <dt className="label text-muted">{fact.label}</dt>
                    <dd className="text-sm">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            {/* Experience */}
            <Reveal delay={0.2}>
              <div className="mt-14">
                <p className="label mb-5 text-muted">
                  {experienceSection.label}
                </p>
                <ul>
                  {experience.map((role) => (
                    <li
                      key={`${role.role}-${role.company}`}
                      className="border-t py-6 rule last:border-b"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                        <h3 className="display text-xl sm:text-2xl">
                          {role.role}
                        </h3>
                        <span className="label text-muted">{role.dates}</span>
                      </div>
                      <p className="mt-2 text-sm text-muted">
                        {role.company} · {role.type}
                      </p>
                      <ul className="mt-5 space-y-2.5">
                        {role.points.map((point, i) => (
                          <li
                            key={i}
                            className="flex gap-3 text-sm leading-relaxed text-muted"
                          >
                            <span
                              aria-hidden="true"
                              className="mt-[0.55em] block h-px w-3 shrink-0 bg-current opacity-50"
                            />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* Education */}
            <Reveal delay={0.22}>
              <div className="mt-14">
                <p className="label mb-5 text-muted">{educationSection.label}</p>
                <ul>
                  {education.map((item) => (
                    <li
                      key={item.qualification}
                      className="border-t py-6 rule last:border-b"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                        <h3 className="display text-xl sm:text-2xl">
                          {item.qualification}
                        </h3>
                        <span className="label shrink-0 text-muted">
                          {item.dates}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted">
                        {item.institution}
                      </p>
                      {item.modules.length > 0 && (
                        <>
                          <p className="label mt-5 mb-2.5 text-muted">
                            {educationSection.modulesLabel}
                          </p>
                          <ul className="flex flex-wrap gap-2">
                            {item.modules.map((module) => (
                              <li
                                key={module}
                                className="rounded-full border px-3.5 py-1.5 text-xs rule"
                              >
                                {module}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* Languages + strengths, side by side */}
            <Reveal delay={0.24}>
              <div className="mt-14 grid gap-10 sm:grid-cols-2">
                <div>
                  <p className="label mb-4 text-muted">
                    {languagesSection.label}
                  </p>
                  <dl className="border-t rule">
                    {languages.map((language) => (
                      <div
                        key={language.name}
                        className="flex flex-wrap items-baseline justify-between gap-2 border-b py-3 rule"
                      >
                        <dt className="text-sm">{language.name}</dt>
                        <dd className="label text-muted">{language.level}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div>
                  <p className="label mb-4 text-muted">
                    {strengthsSection.label}
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {strengths.map((strength) => (
                      <li
                        key={strength}
                        className="rounded-full border px-3.5 py-1.5 text-xs rule"
                      >
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>

            {/* Résumé. resumeHref is resolved server-side in page.tsx, so a
                missing PDF hides the link rather than 404ing. */}
            {resumeHref && (
              <Reveal delay={0.26}>
                <div className="mt-12">
                  <a
                    href={resumeHref}
                    {...(resumeHref.startsWith("http")
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : { download: "" })}
                    className="group inline-flex items-center gap-3 border-b-2 border-current pb-1 text-sm transition-opacity hover:opacity-70"
                  >
                    {about.resumeLabel}
                    <span
                      aria-hidden="true"
                      className="transition-transform duration-500 group-hover:translate-y-0.5"
                    >
                      ↓
                    </span>
                  </a>
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
};

export default About;
