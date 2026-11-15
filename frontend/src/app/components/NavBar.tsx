"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemaeContext";
import { TextRoll } from "./ui/Motion";
import { nav, profile, ui } from "../../data/content";

/* Short two-letter marks for the desktop social cluster. */
const MARKS: Record<string, string> = {
  Email: "EM",
  WhatsApp: "WA",
  LinkedIn: "LI",
  GitHub: "GH",
};

const socials = [
  { label: "GitHub", url: profile.github },
  { label: "LinkedIn", url: profile.linkedin },
  { label: "WhatsApp", url: profile.whatsapp },
  { label: "Email", url: `mailto:${profile.email}` },
].filter((social) => Boolean(social.url));

const NavBar: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const reduce = useReducedMotion();
  const [isScroll, setIsScroll] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("top");

  useEffect(() => {
    const handleScroll = () => {
      setIsScroll(window.scrollY > 40);

      if (window.scrollY < 120) {
        setActiveSection("top");
        return;
      }
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 12
      ) {
        setActiveSection("contact");
        return;
      }

      const probe = window.scrollY + window.innerHeight * 0.35;
      for (const link of nav) {
        const el = document.getElementById(link.id);
        if (!el) continue;
        if (probe >= el.offsetTop && probe < el.offsetTop + el.offsetHeight) {
          setActiveSection(link.id);
          break;
        }
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* Lock the page behind the mobile drawer so the body does not scroll
     underneath it. */
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const goTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    setActiveSection("top");
  };

  return (
    <>
      <motion.nav
        initial={reduce ? false : { y: -72 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
          isScroll
            ? "border-b border-ink-900/10 bg-bone-100/80 backdrop-blur-xl dark:border-bone-100/10 dark:bg-ink-950/80"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between px-4 py-4 sm:px-8 lg:px-12">
          {/* Logotype */}
          <a
            href="#top"
            onClick={goTop}
            className="group flex items-center gap-2 text-ink-900 dark:text-bone-100"
          >
            <span className="display text-base tracking-[-0.02em] sm:text-lg">
              {profile.name}
            </span>
            <span
              className="mb-2 block h-1 w-1 rounded-full bg-current"
              aria-hidden="true"
            />
          </a>

          {/* Desktop links, in a hairline capsule */}
          <ul className="hidden items-center gap-1 rounded-full border border-ink-900/12 bg-bone-50/60 px-2 py-1.5 backdrop-blur-md md:flex dark:border-bone-100/12 dark:bg-ink-900/60">
            {nav.map((link) => {
              const active = activeSection === link.id;
              return (
                <li key={link.id}>
                  <a
                    href={link.href}
                    onClick={link.id === "top" ? goTop : undefined}
                    aria-current={active ? "true" : undefined}
                    className={`relative block rounded-full px-4 py-2 label transition-colors duration-300 ${
                      active
                        ? "text-bone-100 dark:text-ink-900"
                        : "text-ink-500 hover:text-ink-900 dark:text-bone-400 dark:hover:text-bone-100"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 -z-10 rounded-full bg-ink-900 dark:bg-bone-100"
                        transition={
                          reduce
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 380, damping: 32 }
                        }
                      />
                    )}
                    <span className="relative">{link.name}</span>
                  </a>
                </li>
              );
            })}
          </ul>

          {/* Right cluster */}
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1 lg:flex">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.url}
                  target={social.url.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-900/12 label text-ink-500 transition-colors duration-300 hover:border-ink-900 hover:text-ink-900 dark:border-bone-100/12 dark:text-bone-400 dark:hover:border-bone-100 dark:hover:text-bone-100"
                >
                  {MARKS[social.label] ?? social.label.slice(0, 2).toUpperCase()}
                </a>
              ))}
            </div>

            <button
              onClick={toggleDarkMode}
              aria-label={isDarkMode ? ui.lightThemeLabel : ui.darkThemeLabel}
              aria-pressed={isDarkMode}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-900/12 text-ink-900 transition-colors duration-300 hover:border-ink-900 dark:border-bone-100/12 dark:text-bone-100 dark:hover:border-bone-100"
            >
              {/* Half-filled disc: one mark that reads in both themes. */}
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <circle
                  cx="12"
                  cy="12"
                  r="8.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" />
              </svg>
            </button>

            <a
              href="#contact"
              className="group hidden rounded-full bg-ink-900 px-5 py-2.5 label text-bone-100 transition-opacity duration-300 hover:opacity-85 sm:block dark:bg-bone-100 dark:text-ink-900"
            >
              <TextRoll label={ui.talkCta} />
            </a>

            <button
              onClick={() => setIsMenuOpen(true)}
              aria-label={ui.openMenu}
              aria-expanded={isMenuOpen}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-900/12 text-ink-900 md:hidden dark:border-bone-100/12 dark:text-bone-100"
            >
              <span className="sr-only">{ui.menuLabel}</span>
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M4 8h16M4 16h16"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-40 bg-ink-950/60 backdrop-blur-sm md:hidden"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={ui.navAriaLabel}
              initial={reduce ? { opacity: 0 } : { x: "100%" }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: "100%" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 right-0 z-50 flex w-[86%] max-w-sm flex-col justify-between bg-bone-100 p-6 md:hidden dark:bg-ink-900"
            >
              <div className="flex items-center justify-between">
                <span className="label text-muted">{ui.menuLabel}</span>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  aria-label={ui.closeMenu}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-900/12 text-ink-900 dark:border-bone-100/12 dark:text-bone-100"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <ul className="space-y-1">
                {nav.map((link, i) => (
                  <motion.li
                    key={link.id}
                    initial={reduce ? false : { opacity: 0, x: 28 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 * i, duration: 0.5 }}
                    className="border-b border-ink-900/10 dark:border-bone-100/10"
                  >
                    <a
                      href={link.href}
                      onClick={(e) => {
                        setIsMenuOpen(false);
                        if (link.id === "top") goTop(e);
                      }}
                      className="display block py-3 text-[2rem] leading-none text-ink-900 dark:text-bone-100"
                    >
                      {link.name}
                    </a>
                  </motion.li>
                ))}
              </ul>

              <div>
                <p className="label mb-3 text-muted">{ui.elsewhereLabel}</p>
                <div className="flex flex-wrap gap-2">
                  {socials.map((social) => (
                    <a
                      key={social.label}
                      href={social.url}
                      target={
                        social.url.startsWith("mailto:") ? undefined : "_blank"
                      }
                      rel="noopener noreferrer"
                      className="rounded-full border border-ink-900/15 px-4 py-2 label text-ink-900 dark:border-bone-100/15 dark:text-bone-100"
                    >
                      {social.label}
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default NavBar;
