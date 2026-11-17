"use client";

import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { ui } from "../../data/content";

export type Theme = "dark" | "light";

export const THEME_KEY = "theme";

/* ---------------------------------------------------------------------------
   The theme lives on <html>, not in React.

   It is written there before first paint by the inline script in layout.tsx,
   so the DOM — not component state — is the source of truth. Reading it with
   useSyncExternalStore rather than mirroring it into state avoids a render
   pass that would otherwise have to run inside an effect, and keeps a second
   toggle (the one in the mobile menu) in step with the first for free.

   Nothing but this module writes the attribute, so the store only has to
   notify when `setTheme` is called.
--------------------------------------------------------------------------- */
const listeners = new Set<() => void>();

const subscribe = (onChange: () => void) => {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
};

const getSnapshot = (): Theme =>
  document.documentElement.dataset.theme === "light" ? "light" : "dark";

/* The server cannot know a visitor's stored choice, so it always renders the
   default. If the real theme turns out to be light, the icon corrects itself
   on the first client render. */
const getServerSnapshot = (): Theme => "dark";

function setTheme(next: Theme) {
  if (next === "light") {
    document.documentElement.dataset.theme = "light";
  } else {
    delete document.documentElement.dataset.theme;
  }

  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    /* Storage blocked: the theme still changes for this page view, it just
       will not be remembered. */
  }

  listeners.forEach((notify) => notify());
}

/**
 * Dark/light switch.
 *
 * Writing the choice to localStorage also stops the OS preference overriding
 * it next time: once someone has picked, that is the answer until they pick
 * again.
 */
export default function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(isLight ? "dark" : "light")}
      aria-label={isLight ? ui.themeToDark : ui.themeToLight}
      aria-pressed={isLight}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-bone transition-colors duration-300 hover:border-bone ${
        className ?? ""
      }`}
    >
      <motion.svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={{ rotate: isLight ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {isLight ? (
          /* Showing light: offer the moon. */
          <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
        ) : (
          /* Showing dark: offer the sun. */
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        )}
      </motion.svg>
    </button>
  );
}
