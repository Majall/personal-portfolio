"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Section, SectionLabel, Container } from "./ui/Section";
import { Reveal, SplitHeading, GhostWord } from "./ui/Motion";
import { labs, labsSection } from "../../data/content";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * CCNA lab work.
 *
 * Each lab can carry a Packet Tracer screenshot. Until one is supplied,
 * `image` is null in content.ts and the slot renders an oversized lab number
 * instead — deliberately, so the layout is identical with or without
 * screenshots and dropping images in later changes nothing else.
 */
const Labs: React.FC = () => {
  const reduce = useReducedMotion();

  return (
    <Section id="labs" tone="ink" className="py-20 sm:py-28 lg:py-36">
      <GhostWord
        text={labsSection.ghostWord}
        className="left-0 bottom-[10%] text-[28vw] leading-none"
        from={-100}
        to={100}
      />

      <Container className="relative z-10">
        <SectionLabel index={labsSection.index}>
          {labsSection.eyebrow}
        </SectionLabel>

        <div className="mt-12 flex flex-col gap-6 lg:mt-16 lg:flex-row lg:items-end lg:justify-between">
          <SplitHeading
            text={labsSection.heading}
            className="display text-chapter"
          />
          <Reveal delay={0.1}>
            <p className="max-w-xs text-sm leading-relaxed text-muted">
              {labsSection.note}
            </p>
          </Reveal>
        </div>

        <ul className="mt-14 grid gap-px sm:grid-cols-2 lg:mt-20">
          {labs.map((lab, index) => (
            <motion.li
              key={lab.number}
              initial={reduce ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{
                duration: 0.65,
                delay: reduce ? 0 : (index % 2) * 0.08,
                ease: EASE,
              }}
              className="group relative -mt-px -ml-px border p-6 rule transition-colors duration-500 hover:bg-(--tone-raise) sm:p-8"
            >
              {/* Topology slot */}
              <div className="relative aspect-[16/10] w-full overflow-hidden border rule">
                {lab.image ? (
                  <Image
                    src={lab.image}
                    alt={`${lab.title} topology in Cisco Packet Tracer`}
                    fill
                    sizes="(max-width: 640px) 90vw, 44vw"
                    className="object-cover grayscale transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:grayscale-0"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="flex h-full w-full items-center justify-center"
                  >
                    <span className="display text-[4rem] leading-none opacity-10 sm:text-[5rem]">
                      {lab.number}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-baseline justify-between gap-4">
                <h3 className="display text-xl leading-tight sm:text-2xl">
                  {lab.title}
                </h3>
                <span className="label shrink-0 text-muted">{lab.number}</span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-muted">
                {lab.description}
              </p>

              <p className="label mt-6 mb-3 text-muted">
                {labsSection.configuredLabel}
              </p>
              <ul className="flex flex-wrap gap-2">
                {lab.configured.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border px-3.5 py-1.5 text-xs rule"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </motion.li>
          ))}
        </ul>

        {/* Certification status */}
        <Reveal delay={0.1}>
          <p className="mt-12 max-w-3xl border-l-2 border-current pl-5 text-sm leading-relaxed text-muted lg:mt-16">
            {labsSection.certificationNote}
          </p>
        </Reveal>
      </Container>
    </Section>
  );
};

export default Labs;
