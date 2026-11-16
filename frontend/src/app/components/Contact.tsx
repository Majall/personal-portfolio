"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { sendContact } from "../../services/contact.service";
import { Section, SectionLabel, Container } from "./ui/Section";
import { ChapterHeading, Reveal, TextRoll } from "./ui/Motion";
import { contact, profile } from "../../data/content";

const EASE = [0.22, 1, 0.36, 1] as const;

/* Small inline marks for the card's social row. Inline rather than imported
   images so they take the text colour and cost no requests. */
const Icon: React.FC<{ name: "whatsapp" | "linkedin" | "github" }> = ({
  name,
}) => {
  const paths = {
    whatsapp:
      "M12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2zm5.1 14.1c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .1-1.6-.1a12 12 0 01-5.6-4.9c-.4-.7-.7-1.5-.7-2.2 0-.8.4-1.5.9-1.8.2-.1.4-.2.6-.2h.4c.2 0 .4 0 .5.4l.7 1.7c.1.2 0 .4-.1.5l-.3.4c-.1.2-.3.3-.1.6.3.5.7 1 1.2 1.4.5.4 1 .7 1.4.9.2.1.4.1.5-.1l.6-.7c.2-.2.3-.2.5-.1l1.6.8c.2.1.3.2.3.3.1.2 0 .7-.1 1z",
    linkedin:
      "M6.9 8.5H3.6V20h3.3V8.5zM5.2 3.5a1.9 1.9 0 100 3.8 1.9 1.9 0 000-3.8zM20.4 20h-3.3v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9V20H9.8V8.5H13v1.6h.1c.4-.8 1.5-1.7 3.1-1.7 3.3 0 3.9 2.2 3.9 5V20z",
    github:
      "M12 2a10 10 0 00-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.3-3.4-1.3-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.7-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 015 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7 1 .7 2v2.9c0 .3.2.6.7.5A10 10 0 0012 2z",
  } as const;

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d={paths[name]} fill="currentColor" />
    </svg>
  );
};

/**
 * Contact.
 *
 * Two halves: the invitation on the left, the hard facts in a card on the
 * right. The card repeats the email and phone that are already linked as
 * buttons — on purpose: someone copying a number into a phone wants to read
 * it, not click it.
 *
 * The message form is kept below the fold of the chapter. It is the one part
 * of the site still talking to the NestJS backend, so removing it to match
 * the reference exactly would have deleted working functionality.
 */
const Contact: React.FC = () => {
  const reduce = useReducedMotion();
  const [result, setResult] = useState<"" | "sending" | "success" | "error">("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult("sending");

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      await sendContact({
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        message: formData.get("message") as string,
      });
      setResult("success");
      form.reset();
      setTimeout(() => setResult(""), 5000);
    } catch {
      setResult("error");
      setTimeout(() => setResult(""), 6000);
    }
  };

  const fieldClass =
    "mt-2 w-full border-b border-line bg-transparent py-3.5 text-base text-bone outline-none transition-colors duration-300 placeholder:text-muted focus:border-bone";

  const cardRows = [
    { label: contact.cardLabels.email, value: profile.email },
    { label: contact.cardLabels.phone, value: profile.phone },
    { label: contact.cardLabels.basedIn, value: profile.location },
  ];

  const socials = [
    { name: "whatsapp" as const, href: profile.whatsapp, label: "WhatsApp" },
    { name: "linkedin" as const, href: profile.linkedin, label: "LinkedIn" },
    { name: "github" as const, href: profile.github, label: "GitHub" },
  ];

  return (
    <Section id="contact" className="py-24 sm:py-32">
      {/* Drifting smoke — the only chapter with a lit background. */}
      <div className="smoke" aria-hidden="true" />

      <Container className="relative z-10">
        <SectionLabel index={contact.index}>{contact.eyebrow}</SectionLabel>

        <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-20">
          {/* ---- Invitation ---- */}
          <div>
            <Reveal>
              <p className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2">
                <span
                  className="block h-1.5 w-1.5 rounded-full bg-signal"
                  aria-hidden="true"
                />
                <span className="label text-signal">
                  {contact.availabilityPill}
                </span>
              </p>
            </Reveal>

            <ChapterHeading
              text={contact.heading}
              accent={contact.headingAccent}
              className="chrome-text mt-8 text-display"
            />

            <Reveal delay={0.1}>
              <p className="mt-8 max-w-md text-base leading-[1.8] text-muted">
                {profile.availability}
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <a
                  href={profile.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2.5 rounded-full bg-bone px-7 py-3.5 text-sm text-ink transition-opacity hover:opacity-85"
                >
                  <TextRoll label={contact.whatsappLabel} />
                  <Icon name="whatsapp" />
                </a>

                <a
                  href={`mailto:${profile.email}`}
                  className="group inline-flex items-center gap-2.5 rounded-full border border-line px-7 py-3.5 text-sm text-bone transition-colors hover:border-bone"
                >
                  <TextRoll label={contact.emailLabel} />
                  <span aria-hidden="true">✉</span>
                </a>
              </div>
            </Reveal>
          </div>

          {/* ---- Facts ---- */}
          <Reveal delay={0.16}>
            <div className="rounded-3xl border border-line bg-card/80 p-7 backdrop-blur sm:p-9">
              <dl>
                {cardRows.map((row) => (
                  <div key={row.label} className="border-b border-line py-5 first:pt-0">
                    <dt className="label text-muted">{row.label}</dt>
                    <dd className="mt-2.5 break-words text-base text-bone">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="label mt-7 text-muted">
                {contact.cardLabels.elsewhere}
              </p>
              <ul className="mt-4 flex gap-2.5">
                {socials.map((social) => (
                  <li key={social.name}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-bone hover:text-bone"
                    >
                      <Icon name={social.name} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        {/* ---- Message form ---- */}
        <div className="mt-20 border-t border-line pt-12 sm:mt-28">
          <p className="label mb-8 text-muted">{contact.formLabel}</p>

          <form onSubmit={onSubmit} className="max-w-3xl space-y-8">
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className="label text-muted">
                  {contact.form.nameLabel}
                </label>
                <input
                  id="contact-name"
                  type="text"
                  name="name"
                  required
                  autoComplete="name"
                  placeholder={contact.form.namePlaceholder}
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="label text-muted">
                  {contact.form.emailLabel}
                </label>
                <input
                  id="contact-email"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  placeholder={contact.form.emailPlaceholder}
                  className={fieldClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-message" className="label text-muted">
                {contact.form.messageLabel}
              </label>
              <textarea
                id="contact-message"
                name="message"
                required
                rows={5}
                placeholder={contact.form.messagePlaceholder}
                className={`${fieldClass} resize-none`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <button
                type="submit"
                disabled={result === "sending"}
                className="group rounded-full bg-bone px-7 py-3.5 label text-ink transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <TextRoll
                  label={
                    result === "sending"
                      ? contact.form.sendingLabel
                      : contact.form.submitLabel
                  }
                />
              </button>

              {/* Status is announced, not just coloured. */}
              <div aria-live="polite" role="status" className="label">
                <AnimatePresence mode="wait">
                  {result === "success" && (
                    <motion.span
                      key="ok"
                      initial={reduce ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35, ease: EASE }}
                      className="text-signal"
                    >
                      {contact.form.successLabel}
                    </motion.span>
                  )}
                  {result === "error" && (
                    <motion.span
                      key="err"
                      initial={reduce ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35, ease: EASE }}
                      className="text-muted"
                    >
                      {contact.form.errorLabel}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </form>
        </div>
      </Container>
    </Section>
  );
};

export default Contact;
