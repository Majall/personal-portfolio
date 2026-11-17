"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { nav, profile, ui } from "../../data/content";

/**
 * Fixed top navigation with an IntersectionObserver scroll-spy.
 *
 * The observer replaces the old scroll handler that measured every section's
 * offsetTop on each scroll event. It fires only when a section crosses the
 * band, so there is no per-frame layout reading.
 *
 * `rootMargin` pulls the viewport down to a narrow horizontal band about a
 * third of the way down the screen. Without that, a tall section and a short
 * one are both "intersecting" for most of their scroll and the highlight
 * flickers between them.
 */
const NavBar: React.FC<{ resumeHref?: string | null }> = ({ resumeHref }) => {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(nav[0]?.id ?? "home");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const sections = nav
      .map((link) => document.getElementById(link.id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        /* Several sections can straddle the band at once mid-scroll. Pick the
           one nearest the top of the band so the highlight advances in
           document order rather than jumping to whichever fired last. */
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              Math.abs(a.boundingClientRect.top) -
              Math.abs(b.boundingClientRect.top),
          );

        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-32% 0px -60% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Hold the page still behind the mobile overlay. */
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-500 ${
          scrolled
            ? "border-line bg-ink/80 backdrop-blur-xl"
            : "border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between px-4 py-4 sm:px-8 lg:px-12">
          {/* Wordmark */}
          <a
            href="#home"
            className="text-xs font-bold uppercase tracking-[0.3em] text-bone transition-opacity hover:opacity-70"
          >
            {profile.name}
          </a>

          {/* Desktop links */}
          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {nav.map((link) => {
                const isActive = active === link.id;
                return (
                  <li key={link.id}>
                    <a
                      href={link.href}
                      aria-current={isActive ? "true" : undefined}
                      className={`relative block px-3 py-2 text-nav uppercase transition-colors duration-300 lg:px-4 ${
                        isActive
                          ? "text-bone"
                          : "text-muted hover:text-bone"
                      }`}
                    >
                      {link.name}
                      {isActive && (
                        <motion.span
                          layoutId="nav-underline"
                          className="absolute inset-x-3 -bottom-px block h-px bg-bone lg:inset-x-4"
                          transition={
                            reduce
                              ? { duration: 0 }
                              : { type: "spring", stiffness: 420, damping: 36 }
                          }
                        />
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            {/* Résumé. Hidden entirely when the PDF is not on disk, rather
                than rendering a link that would 404. */}
            {resumeHref && (
              <a
                href={resumeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-line px-4 py-2 text-nav uppercase text-bone transition-colors duration-300 hover:border-bone"
              >
                {ui.resumeLabel}
              </a>
            )}

            <button
              onClick={() => setMenuOpen(true)}
              aria-label={ui.openMenu}
              aria-expanded={menuOpen}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-bone lg:hidden"
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
      </header>

      {/* Mobile overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={ui.navAriaLabel}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[70] flex flex-col bg-ink lg:hidden"
          >
            <div className="flex items-center justify-between px-4 py-4 sm:px-8">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-bone">
                {profile.name}
              </span>
              <ThemeToggle className="ml-auto mr-2" />
              <button
                onClick={() => setMenuOpen(false)}
                aria-label={ui.closeMenu}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-bone"
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

            <nav
              aria-label="Mobile"
              className="flex flex-1 flex-col justify-center px-4 sm:px-8"
            >
              <ul>
                {nav.map((link, i) => (
                  <motion.li
                    key={link.id}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.45 }}
                    className="border-b border-line"
                  >
                    <a
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      /* Active is full-strength text, inactive is muted.
                         `cream` is the inverted-surface colour, not a text
                         colour — against `bone` it is nearly the same value in
                         both themes, so using it here left the current section
                         indistinguishable from the rest of the menu. */
                      className={`display block py-4 text-[2.25rem] leading-none transition-colors ${
                        active === link.id ? "text-bone" : "text-muted"
                      }`}
                    >
                      {link.name}
                    </a>
                  </motion.li>
                ))}
              </ul>

              {resumeHref && (
                <a
                  href={resumeHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="mt-10 self-start rounded-full border border-line px-6 py-3 text-nav uppercase text-bone"
                >
                  {ui.resumeLabel}
                </a>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NavBar;
