"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Container } from "./ui/Section";
import { TextRoll } from "./ui/Motion";
import { hero, profile, ui } from "../../data/content";

const EASE = [0.22, 1, 0.36, 1] as const;

const Header: React.FC = () => {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  /* Parallax: the headline drifts up faster than the portrait, so the two
     layers separate as you scroll out of the hero. */
  const titleY = useTransform(scrollYProgress, [0, 1], ["0%", "-38%"]);
  const portraitY = useTransform(scrollYProgress, [0, 1], ["0%", "-14%"]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <header
      ref={ref}
      id="top"
      data-tone="bone"
      className="tone-surface relative flex min-h-[100svh] w-full flex-col justify-between overflow-hidden pt-24 pb-8"
    >
      <Container className="relative z-10 flex flex-1 flex-col justify-center">
        {/* Name, set small above the headline — the headline itself states the
            discipline, which is what a hiring manager is scanning for. */}
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          style={reduce ? undefined : { opacity: fade }}
          className="label relative z-10 mb-5 text-muted"
        >
          {profile.name} — {profile.tagline}
        </motion.p>

        {/* Oversized headline. The portrait below overlaps it. */}
        <motion.div
          style={reduce ? undefined : { y: titleY, opacity: fade }}
          className="relative z-10 pointer-events-none"
        >
          <h1 className="display chrome text-display">
            <span className="sr-only">
              {profile.name} — {profile.title}
            </span>
            <span aria-hidden="true" className="block">
              {hero.headline.map((word, i) => (
                <span
                  key={`${word}-${i}`}
                  className="inline-block overflow-hidden align-bottom"
                >
                  <motion.span
                    className="inline-block"
                    initial={reduce ? false : { y: "110%" }}
                    animate={{ y: "0%" }}
                    transition={{ duration: 1, delay: 0.1 + i * 0.09, ease: EASE }}
                  >
                    {word}
                    {i < hero.headline.length - 1 ? " " : ""}
                  </motion.span>
                </span>
              ))}
            </span>
          </h1>
        </motion.div>

        {/* Portrait, pulled up over the headline's baseline */}
        <motion.div
          style={reduce ? undefined : { y: portraitY }}
          initial={reduce ? false : { opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.25, ease: EASE }}
          className="relative z-20 mx-auto -mt-[7vw] w-[58%] max-w-[380px] sm:w-[42%] md:-mt-[6vw] md:w-[34%]"
        >
          {profile.profilePic ? (
            <Image
              src={profile.profilePic}
              alt={`Portrait of ${profile.name}`}
              width={760}
              height={950}
              priority
              sizes="(max-width: 640px) 58vw, (max-width: 768px) 42vw, 34vw"
              className="h-auto w-full object-contain grayscale contrast-[1.08]"
            />
          ) : (
            <div className="flex aspect-[4/5] w-full items-center justify-center border rule">
              <span className="label text-muted">{ui.portraitMissing}</span>
            </div>
          )}
        </motion.div>

        {/* Corner metadata, set small and wide against the display type */}
        <motion.div
          style={reduce ? undefined : { opacity: fade }}
          className="relative z-30 -mt-10 flex flex-col gap-8 sm:-mt-16 md:flex-row md:items-end md:justify-between"
        >
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease: EASE }}
            className="max-w-[20rem]"
          >
            <p className="label text-muted">{profile.title}</p>
            <p className="label mt-2 text-muted">{profile.location}</p>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.82, ease: EASE }}
            className="max-w-sm md:text-right"
          >
            <p className="text-sm leading-relaxed text-muted">{hero.intro}</p>
            <div className="mt-5 flex flex-wrap gap-2 md:justify-end">
              <a
                href={hero.primaryCta.href}
                className="group rounded-full bg-ink-900 px-6 py-3 label text-bone-100 transition-opacity hover:opacity-85 dark:bg-bone-100 dark:text-ink-900"
              >
                <TextRoll label={hero.primaryCta.label} />
              </a>
              <a
                href={hero.secondaryCta.href}
                className="group rounded-full border px-6 py-3 label rule transition-colors hover:border-current"
              >
                <TextRoll label={hero.secondaryCta.label} />
              </a>
            </div>
          </motion.div>
        </motion.div>
      </Container>

      {/* Scroll cue */}
      <Container className="relative z-10">
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="flex items-center justify-between border-t pt-4 rule"
        >
          <span className="label text-muted">{hero.scrollCue}</span>
          <motion.span
            aria-hidden="true"
            animate={reduce ? undefined : { y: [0, 5, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="label text-muted"
          >
            ↓
          </motion.span>
        </motion.div>
      </Container>
    </header>
  );
};

export default Header;
