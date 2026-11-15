"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Section, SectionLabel, Container } from "./ui/Section";
import { Reveal, SplitHeading, GhostWord } from "./ui/Motion";
import {
  services,
  servicesSection,
  skillGroups,
  skillsSection,
} from "../../data/content";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * "What I can do" — six capability areas, followed by the technical skills
 * they rest on.
 *
 * The two belong in one chapter: the cards say what I can be handed, the
 * skill lists say what I'd use to do it. Splitting them into separate
 * sections made the nav longer without telling the reader anything more.
 */
const Services: React.FC = () => {
  const reduce = useReducedMotion();

  return (
    <Section id="services" tone="bone" className="py-20 sm:py-28 lg:py-36">
      <GhostWord
        text={servicesSection.ghostWord}
        className="right-0 top-[8%] text-[26vw] leading-none"
        from={120}
        to={-120}
      />

      <Container className="relative z-10">
        <SectionLabel index={servicesSection.index}>
          {servicesSection.eyebrow}
        </SectionLabel>

        <div className="mt-12 flex flex-col gap-6 lg:mt-16 lg:flex-row lg:items-end lg:justify-between">
          <SplitHeading
            text={servicesSection.heading}
            className="display text-chapter"
          />
          <Reveal delay={0.1}>
            <p className="max-w-xs text-sm leading-relaxed text-muted">
              {servicesSection.note}
            </p>
          </Reveal>
        </div>

        {/* Capability cards. Negative margins collapse the shared borders into
            single hairlines, so the grid reads as one ruled table. */}
        <motion.ul
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-8% 0px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: reduce ? 0 : 0.06 } },
          }}
          className="mt-14 grid sm:grid-cols-2 lg:mt-20 lg:grid-cols-3"
        >
          {services.map((service) => (
            <motion.li
              key={service.number}
              variants={{
                hidden: reduce ? {} : { opacity: 0, y: 24 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.6, ease: EASE },
                },
              }}
              className="group relative -mt-px -ml-px border p-7 rule transition-colors duration-500 hover:bg-(--tone-raise) sm:p-8"
            >
              <span className="label text-muted">{service.number}</span>

              <h3 className="display mt-5 text-xl leading-tight sm:text-2xl">
                {service.title}
              </h3>

              <p className="mt-3.5 text-sm leading-relaxed text-muted">
                {service.description}
              </p>

              <ul className="mt-6 space-y-2">
                {service.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex gap-3 text-sm leading-relaxed"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-[0.55em] block h-px w-2.5 shrink-0 bg-current opacity-40"
                    />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </motion.li>
          ))}
        </motion.ul>

        {/* Technical skills, grouped */}
        <div className="mt-20 lg:mt-28">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b pb-4 rule">
            <h3 className="display text-2xl sm:text-3xl">
              {skillsSection.label}
            </h3>
            <span className="label text-muted">{skillsSection.note}</span>
          </div>

          <div className="mt-10 space-y-12">
            {skillGroups.map((group) => (
              <Reveal key={group.key}>
                <div className="grid gap-5 lg:grid-cols-12 lg:gap-8">
                  <div className="lg:col-span-3">
                    <h4 className="display text-lg sm:text-xl">{group.label}</h4>
                    <p className="label mt-2 text-muted">{group.note}</p>
                    <p className="label mt-2 text-muted opacity-70">
                      {String(group.items.length).padStart(2, "0")}
                    </p>
                  </div>

                  <ul className="flex flex-wrap gap-2 lg:col-span-9">
                    {group.items.map((item) => (
                      <li
                        key={item}
                        className="rounded-full border px-4 py-2 text-sm rule transition-colors duration-300 hover:border-current"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
};

export default Services;
