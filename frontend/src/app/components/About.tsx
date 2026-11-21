"use client";

import { Fragment } from "react";
import { Section, Container } from "./ui/Section";
import { ChapterHeading, Reveal, RevealGroup, RevealItem, GhostWord, TextRoll } from "./ui/Motion";
import Journey from "./Journey";
import {
  about,
  profile,
  languages,
  languagesSection,
  strengths,
  strengthsSection,
} from "../../data/content";

/* Small inline marks for the social row. Inline rather than imported images
   so they take the text colour and cost no requests. */
const Icon: React.FC<{ name: "github" | "linkedin" | "email" }> = ({ name }) => {
  const paths = {
    github:
      "M12 2a10 10 0 00-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.3-3.4-1.3-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.7-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 015 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7 1 .7 2v2.9c0 .3.2.6.7.5A10 10 0 0012 2z",
    linkedin:
      "M6.9 8.5H3.6V20h3.3V8.5zM5.2 3.5a1.9 1.9 0 100 3.8 1.9 1.9 0 000-3.8zM20.4 20h-3.3v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9V20H9.8V8.5H13v1.6h.1c.4-.8 1.5-1.7 3.1-1.7 3.3 0 3.9 2.2 3.9 5V20z",
    email:
      "M3 5.5h18a1 1 0 011 1v11a1 1 0 01-1 1H3a1 1 0 01-1-1v-11a1 1 0 011-1zm.9 2L12 13l8.1-5.5",
  } as const;

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d={paths[name]}
        fill={name === "email" ? "none" : "currentColor"}
        stroke={name === "email" ? "currentColor" : "none"}
        strokeWidth={name === "email" ? 1.6 : 0}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * Lift the named terms out of a paragraph without rewriting it.
 *
 * Terms are matched longest-first so an overlapping pair resolves to the more
 * specific one — "Windows Server" rather than "Windows" — and each is escaped
 * before going into the pattern, since entries like "TCP/IP" and "CCNA
 * 200-301" contain regex metacharacters. A term that is not literally present
 * in the prose simply never matches, so the list can't desynchronise the text.
 */
function highlight(text: string, terms: string[]) {
  const usable = terms.filter(Boolean).sort((a, b) => b.length - a.length);
  if (usable.length === 0) return text;

  const escaped = usable.map((t) => t.replace(/[.*+?^${}()|[\]\\/-]/g, "\\$&"));
  const pattern = new RegExp(`(${escaped.join("|")})`, "g");

  return text.split(pattern).map((part, i) =>
    usable.some((t) => t === part) ? (
      /* `whitespace-nowrap` so a highlighted term is never split across a
         line break. Several of them contain characters a browser treats as
         break opportunities — the hyphen in "Wi-Fi" and "CCNA 200-301", the
         slash in "TCP/IP" — and a term broken in half reads as two different
         things. The longest entry is 19 characters, which still fits on one
         line at phone width, so this cannot cause an overflow. */
      <strong
        key={`${part}-${i}`}
        className="whitespace-nowrap font-semibold text-bone"
      >
        {part}
      </strong>
    ) : (
      <Fragment key={`t-${i}`}>{part}</Fragment>
    ),
  );
}

/**
 * About — everything about the person, in one chapter.
 *
 * The badge, the bio, the toolkit, the journey and the social row all live
 * here rather than being spread across the page. Toolkit and Journey are
 * their own components still, rendered embedded: they bring their own
 * sub-label and content but no section chrome, so this chapter keeps a single
 * heading and the page keeps a single About entry in the nav.
 *
 * Languages and strengths sit at the bottom of the left column, filling the
 * space beside the journey card, which is taller than the intro on its own.
 */
const About: React.FC<{ resumeHref?: string | null }> = ({ resumeHref }) => {
  const socials = [
    { name: "github" as const, href: profile.github, label: "GitHub" },
    { name: "linkedin" as const, href: profile.linkedin, label: "LinkedIn" },
    { name: "email" as const, href: `mailto:${profile.email}`, label: "Email" },
  ];

  return (
    <Section id="about" className="py-24 sm:py-32">
      <GhostWord
        text={about.ghostWord}
        className="left-0 top-[8%] text-[26vw]"
      />

      <Container className="relative z-10">
        {/* The intro and the journey sit side by side from lg up. Capping the
            bio at a readable measure left the right half of the page empty,
            and the timeline is the one block that reads just as well in a
            narrow column as a wide one — it is already a vertical list.
            Below lg they stack, intro first. */}
        <div className="grid gap-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-20">
          <div>
        {/* ---- Heading ---- */}
        <div className="flex flex-col items-start">
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2">
              <span
                className="block h-1.5 w-1.5 rounded-full bg-signal"
                aria-hidden="true"
              />
              <span className="label text-muted">{about.badge}</span>
            </p>
          </Reveal>

          <ChapterHeading
            text={about.heading}
            accent={about.headingAccent}
            className="chrome-text mt-7 text-chapter"
          />
        </div>

        {/* ---- Bio ---- */}
        <Reveal delay={0.1}>
          <p className="mt-10 max-w-[62ch] text-[0.975rem] leading-[1.95] text-muted sm:text-base">
            {highlight(about.bio, about.bioHighlights)}
          </p>
        </Reveal>

        {/* ---- Stats ---- */}
        <RevealGroup className="mt-12 grid max-w-3xl grid-cols-1 gap-7 sm:grid-cols-3">
          {about.highlights.map((item) => (
            <RevealItem key={item.label}>
              {/* Sized against the narrowest case: a third of the left
                  column at the lg breakpoint, which is where these are
                  tightest. At 1.8vw the longest value ("CCNA 200-301") broke
                  at its hyphen and read as two stats. */}
              <p className="display text-[clamp(0.9rem,1.35vw,1.4rem)] text-bone">
                {item.value}
              </p>
              <p className="label mt-2 text-muted">{item.label}</p>
            </RevealItem>
          ))}
        </RevealGroup>

        {/* ---- Availability + résumé ---- */}
        <Reveal delay={0.12}>
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

        {/* ---- Languages & strengths ----
            Kept in the left column so they fill the space beside the
            (taller) journey card instead of trailing below it. */}
        <div className="mt-14 grid gap-12 border-t border-line pt-10 sm:grid-cols-2 sm:gap-10">
          <Reveal>
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

          <Reveal delay={0.08}>
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

          </div>

          {/* ---- Journey (right column) ---- */}
          <div className="lg:pt-1">
            <Journey />
          </div>
        </div>

        {/* ---- Social links ---- */}
        <Reveal delay={0.08}>
          <div className="mt-16 border-t border-line pt-10">
            <p className="label text-muted">{about.socialLabel}</p>
            <ul className="mt-5 flex gap-3">
              {socials.map((social) => (
                <li key={social.name}>
                  <a
                    href={social.href}
                    target={
                      social.href.startsWith("mailto:") ? undefined : "_blank"
                    }
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-card text-muted transition-colors duration-300 hover:border-bone hover:text-bone"
                  >
                    <Icon name={social.name} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
};

export default About;
