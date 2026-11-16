"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { chat } from "../../data/content";
import ChatRobot from "./ChatRobot";

const EASE = [0.22, 1, 0.36, 1] as const;

/* Mirrors the limits enforced in app/api/chat/route.ts. The server is the
   authority; these only stop the client sending something it will reject. */
const MAX_CHARS = 500;
const HISTORY_SENT = 10;

/* Greeting bubble timing. The delay clears the intro loader. */
const HINT_KEY = "chat-greeted";
const HINT_DELAY_MS = 6000;
const HINT_SHOWN_MS = 9000;

/* Whether the page is still on the hero. Read straight from the scroll
   position with useSyncExternalStore, the same way ThemeToggle reads the
   theme, so there is no effect copying scrollY into state. The server has no
   scroll position; it assumes the top, which is where every visit starts. */
const subscribeScroll = (onChange: () => void) => {
  window.addEventListener("scroll", onChange, { passive: true });
  window.addEventListener("resize", onChange);
  return () => {
    window.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
  };
};
const isOnHero = () => window.scrollY < window.innerHeight * 0.5;
const isOnHeroServer = () => true;

/* How far the robot is raised while the hero is on screen, in px. */
const HERO_LIFT = 84;

interface Message {
  role: "user" | "assistant";
  content: string;
}

/**
 * Floating chat assistant.
 *
 * A launcher pinned to the bottom-right corner that opens a small panel. The
 * conversation lives only in this component's state: it is gone on reload,
 * and nothing is stored anywhere.
 *
 * Failures are kept out of the message list on purpose. The list is what gets
 * sent back to the model as history, so an "error" bubble in it would be read
 * as something the assistant said.
 */
export default function ChatBot() {
  const reduce = useReducedMotion();
  const onHero = useSyncExternalStore(subscribeScroll, isOnHero, isOnHeroServer);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hint, setHint] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  /* Opening puts the caret in the field; Escape closes and hands focus back
     to the launcher so keyboard users are not dropped at the top of the page. */
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        launcherRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  /* The robot says hello once per visit: after the intro loader has cleared,
     for a few seconds, then it gets out of the way. sessionStorage keeps it
     from repeating on every in-site navigation or reload; if storage is
     blocked it simply greets again, which is harmless. */
  useEffect(() => {
    try {
      if (sessionStorage.getItem(HINT_KEY)) return;
    } catch {
      /* fall through and greet */
    }

    const show = setTimeout(() => {
      setHint(true);
      try {
        sessionStorage.setItem(HINT_KEY, "1");
      } catch {
        /* not remembered — fine */
      }
    }, HINT_DELAY_MS);
    const hide = setTimeout(() => setHint(false), HINT_DELAY_MS + HINT_SHOWN_MS);

    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);

  /* Keep the newest message in view. */
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, loading, error, open]);

  async function send(text: string) {
    const content = text.trim().slice(0, MAX_CHARS);
    if (!content || loading) return;

    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-HISTORY_SENT) }),
      });

      if (res.status === 429) {
        setError(chat.rateLimitedLabel);
        return;
      }

      const data = await res.json().catch(() => null);
      if (!res.ok || typeof data?.reply !== "string") {
        setError(chat.errorLabel);
        return;
      }

      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch {
      setError(chat.errorLabel);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  const bubble = "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed";
  const assistantBubble = `${bubble} self-start rounded-bl-md border border-line bg-surface text-bone`;
  const userBubble = `${bubble} self-end rounded-br-md bg-bone text-ink`;

  return (
    /* Above the navbar (50), below the film grain (60), the mobile menu (70)
       and the intro loader (90), so none of those are ever covered. */
    <motion.div
      /* The hero keeps its own buttons in this corner, so while it is on
         screen the robot hovers just above them and settles into the corner
         once the visitor scrolls on. An open panel always sits in the
         corner: it needs the height. */
      initial={false}
      animate={{ y: onHero && !open ? -HERO_LIFT : 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.6, ease: EASE }}
      className="fixed bottom-5 right-4 z-55 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6"
    >
      <AnimatePresence>
        {open && (
          <motion.div
            id="chat-panel"
            role="dialog"
            aria-label={chat.title}
            initial={reduce ? false : { opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.3, ease: EASE }}
            style={{ transformOrigin: "bottom right" }}
            className="flex h-[min(32rem,calc(100dvh-9.5rem))] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-2xl shadow-black/40"
          >
            {/* ---- Header ---- */}
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface">
                  <ChatRobot bust className="h-8 w-8" thinking={loading} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-bone">
                    {chat.title}
                  </p>
                  <p className="label mt-1.5 flex items-center gap-1.5 text-muted">
                    <span
                      className="block h-1.5 w-1.5 shrink-0 rounded-full bg-signal"
                      aria-hidden="true"
                    />
                    {chat.subtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  launcherRef.current?.focus();
                }}
                aria-label={chat.closeLabel}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-bone hover:text-bone"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {/* ---- Conversation ----
                `data-lenis-prevent` hands the wheel back to this container;
                without it the smooth-scroller scrolls the page behind. */}
            <div
              ref={logRef}
              data-lenis-prevent
              role="log"
              aria-live="polite"
              className="flex flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-5 py-4"
            >
              <p className={assistantBubble}>{chat.greeting}</p>

              {messages.map((message, index) => (
                <p
                  key={index}
                  className={
                    message.role === "user" ? userBubble : assistantBubble
                  }
                >
                  {message.content}
                </p>
              ))}

              {loading && (
                <p className={`${assistantBubble} flex items-center gap-1.5 py-3.5`}>
                  <span className="sr-only">{chat.typingLabel}</span>
                  {[0, 0.15, 0.3].map((delay) => (
                    <span
                      key={delay}
                      aria-hidden="true"
                      className="chat-dot block h-1.5 w-1.5 rounded-full bg-muted"
                      style={{ animationDelay: `${delay}s` }}
                    />
                  ))}
                </p>
              )}

              {error && (
                <p role="alert" className="label self-start text-muted">
                  {error}
                </p>
              )}

              {/* Starter questions, shown until the first message is sent. */}
              {messages.length === 0 && !loading && (
                <ul className="mt-1 flex flex-wrap gap-2">
                  {chat.suggestions.map((suggestion) => (
                    <li key={suggestion}>
                      <button
                        type="button"
                        onClick={() => send(suggestion)}
                        className="rounded-full border border-line px-3.5 py-2 text-left text-xs text-muted transition-colors hover:border-bone hover:text-bone"
                      >
                        {suggestion}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ---- Composer ---- */}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-line p-3"
            >
              <label htmlFor="chat-input" className="sr-only">
                {chat.inputLabel}
              </label>
              <input
                id="chat-input"
                ref={inputRef}
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                maxLength={MAX_CHARS}
                autoComplete="off"
                placeholder={chat.placeholder}
                className="min-w-0 flex-1 rounded-full border border-line bg-transparent px-4 py-2.5 text-sm text-bone outline-none transition-colors placeholder:text-muted focus:border-bone"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label={chat.sendLabel}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bone text-ink transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Greeting bubble ----
          The robot introduces itself once, a few seconds after the page has
          settled. It is a button too, so tapping the words works as well as
          tapping the robot. */}
      <AnimatePresence>
        {hint && !open && (
          <motion.button
            type="button"
            onClick={() => setOpen(true)}
            tabIndex={-1}
            aria-hidden="true"
            initial={reduce ? false : { opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.35, ease: EASE }}
            style={{ transformOrigin: "bottom right" }}
            className="mr-3 max-w-[14.5rem] rounded-2xl rounded-br-md border border-line bg-card px-4 py-3 text-left shadow-xl shadow-black/30"
          >
            <span className="block text-sm leading-snug text-bone">
              {chat.bubble}
            </span>
            <span className="label mt-2 flex items-center gap-1.5 text-muted">
              <span className="block h-1.5 w-1.5 rounded-full bg-signal" />
              {chat.bubbleStatus}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ---- Launcher: the robot itself ----
          It waits out the intro loader before dropping in, so it does not
          arrive behind the curtain and miss its own entrance. */}
      <motion.button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? chat.closeLabel : chat.openLabel}
        aria-expanded={open}
        aria-controls="chat-panel"
        initial={reduce ? false : { opacity: 0, y: 40, scale: 0.5 }}
        animate={{ opacity: 1, y: 0, scale: open ? 0.82 : 1 }}
        whileHover={reduce ? undefined : { scale: open ? 0.88 : 1.08 }}
        whileTap={reduce ? undefined : { scale: 0.92 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 18,
          opacity: { duration: 0.3 },
        }}
        style={{ transformOrigin: "bottom right" }}
        className="robot-launcher robot-glow block h-[5.5rem] w-20 rounded-3xl outline-offset-4 focus-visible:outline-2 focus-visible:outline-bone"
      >
        <ChatRobot className="h-full w-full" thinking={loading} dancing={open} />
      </motion.button>
    </motion.div>
  );
}
