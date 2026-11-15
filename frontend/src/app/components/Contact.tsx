"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { sendContact } from "../../services/contact.service";
import { Section, SectionLabel, Container } from "./ui/Section";
import { Reveal, GhostWord, TextRoll } from "./ui/Motion";
import { contact } from "../../data/content";

const EASE = [0.22, 1, 0.36, 1] as const;

const Contact: React.FC = () => {
  const reduce = useReducedMotion();
  const [result, setResult] = useState<"" | "sending" | "success" | "error">("");

  /* The one place the frontend still talks to the NestJS backend: this posts
     to /api/contact, which saves the message and emails a notification. */
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
    "w-full border-b bg-transparent py-3.5 text-base outline-none rule transition-colors duration-300 placeholder:text-(--tone-muted) focus:border-current";

  return (
    <Section id="contact" tone="ink" className="py-20 sm:py-28 lg:py-36">
      <GhostWord
        text={contact.ghostWord}
        className="right-0 top-[6%] text-[24vw] leading-none"
        from={100}
        to={-100}
      />

      <Container className="relative z-10">
        <SectionLabel index={contact.index}>{contact.eyebrow}</SectionLabel>

        <Reveal>
          <h2 className="display chrome mt-12 text-display lg:mt-16">
            {contact.heading}
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-16 lg:grid-cols-12 lg:gap-12">
          {/* Networking area */}
          <div className="lg:col-span-5">
            <p className="label mb-6 text-muted">{contact.networkLabel}</p>

            <ul>
              {contact.network.map((item, i) => (
                <motion.li
                  key={item.label}
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.07, ease: EASE }}
                >
                  <a
                    href={item.href}
                    target={
                      item.href.startsWith("mailto:") ? undefined : "_blank"
                    }
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-4 border-t py-5 rule transition-opacity last:border-b hover:opacity-70"
                  >
                    <div className="min-w-0">
                      <span className="display block text-xl sm:text-2xl">
                        <TextRoll label={item.label} />
                      </span>
                      <span className="mt-1 block truncate text-sm text-muted">
                        {item.handle}
                      </span>
                    </div>
                    <span
                      aria-hidden="true"
                      className="shrink-0 text-lg transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1 group-hover:-translate-y-1"
                    >
                      ↗
                    </span>
                  </a>
                </motion.li>
              ))}
            </ul>

            <dl className="mt-10 space-y-3">
              {contact.details.map((detail) => (
                <div
                  key={detail.label}
                  className="flex items-baseline justify-between gap-4"
                >
                  <dt className="label text-muted">{detail.label}</dt>
                  <dd className="text-sm">{detail.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Form */}
          <div className="lg:col-span-7">
            <p className="label mb-6 text-muted">{contact.formLabel}</p>

            <form onSubmit={onSubmit} className="space-y-7">
              <div className="grid gap-7 sm:grid-cols-2">
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

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  disabled={result === "sending"}
                  className="group rounded-full bg-bone-100 px-7 py-3.5 label text-ink-900 transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <TextRoll
                    label={
                      result === "sending"
                        ? contact.form.sendingLabel
                        : contact.form.submitLabel
                    }
                  />
                </button>

                {/* Status is announced, not just coloured — there is no accent
                    hue in this palette to carry the meaning on its own. */}
                <div aria-live="polite" role="status" className="label">
                  <AnimatePresence mode="wait">
                    {result === "success" && (
                      <motion.span
                        key="ok"
                        initial={reduce ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-muted"
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
        </div>
      </Container>
    </Section>
  );
};

export default Contact;
