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

/* ---------------------------------------------------------------------------
   Voice

   Both directions use the browser's own Web Speech API, so there is no extra
   service, key or cost: SpeechRecognition turns the visitor's speech into
   text for the input, and speechSynthesis reads replies aloud.

   Support is uneven — recognition exists in Chrome, Edge and Safari but not
   Firefox — so each control is only rendered where its half of the API
   exists. That is a fact about the browser, not React state, so it is read
   with useSyncExternalStore (never changes, hence the no-op subscribe); the
   server answers "no" and the buttons appear on the first client render.

   SpeechRecognition is not in TypeScript's DOM typings, so the small part of
   it used here is declared by hand.
--------------------------------------------------------------------------- */
interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
}

interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
}

type RecognitionCtor = new () => Recognition;

const getRecognitionCtor = (): RecognitionCtor | undefined => {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

const subscribeNever = () => () => {};
const canListen = () => Boolean(getRecognitionCtor());
const canSpeak = () => "speechSynthesis" in window;
const notOnServer = () => false;

const VOICE_LANG = "en-US";

/* ---------------------------------------------------------------------------
   The robot's voice: deep, slow and gravelly, to match the armour.

   speechSynthesis can only use the voices installed in the visitor's browser
   and OS, so this is a style applied to whatever is there, not a recording:
   pick the deepest-sounding English male voice available, then drop the
   pitch well below normal and slow the delivery. It is a "dark hero" manner
   of speaking, not an imitation of any actor.

   The names are the stock male voices on Windows/Edge, Chrome, macOS/iOS and
   Android, in rough order of how low they naturally sit.
--------------------------------------------------------------------------- */
const DEEP_VOICES = [
  "Microsoft Guy",
  "Microsoft Davis",
  "Microsoft Christopher",
  "Microsoft Eric",
  "Microsoft Ryan",
  "Microsoft George",
  "Microsoft David",
  "Microsoft Mark",
  "Google UK English Male",
  "Daniel",
  "Aaron",
  "Arthur",
  "Fred",
  "Alex",
];
const VOICE_PITCH = 0.2; // 0–2, 1 is the voice's natural pitch
const VOICE_RATE = 0.86; // a little slower than conversational

function pickDeepVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis
    .getVoices()
    .filter((voice) => voice.lang.toLowerCase().startsWith("en"));

  for (const name of DEEP_VOICES) {
    const match = voices.find((voice) => voice.name.includes(name));
    if (match) return match;
  }
  /* Nothing recognised: any voice that calls itself male, else the default
     English one. The low pitch still does most of the work. */
  return voices.find((voice) => /male/i.test(voice.name)) ?? voices[0];
}

/** What is read aloud: the reply without links or markdown punctuation,
    neither of which survives being spoken. */
const toSpeech = (text: string) =>
  text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[*_`#]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/* Inline icons: they take the text colour and cost no requests. */
const ICONS = {
  speakerOn: "M11 5L6 9H3v6h3l5 4V5zM15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13",
  speakerOff: "M11 5L6 9H3v6h3l5 4V5zM22 9l-6 6M16 9l6 6",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  minus: "M5 12h14",
  stop: "M7 7h10v10H7z",
  close: "M6 6l12 12M18 6L6 18",
  mic: "M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3zM5 11a7 7 0 0014 0M12 18v3M8.5 21h7",
  send: "M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z",
} as const;

const Icon = ({ name }: { name: keyof typeof ICONS }) => (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={ICONS[name]} />
  </svg>
);

interface Message {
  role: "user" | "assistant";
  content: string;
}

/**
 * Floating chat assistant.
 *
 * The robot in the bottom-right corner opens a HUD-styled panel. Questions
 * can be typed, tapped from the suggested topics, or spoken; replies can be
 * read aloud.
 *
 * The conversation lives only in this component's state: it is gone on
 * reload, and nothing is stored anywhere.
 *
 * Failures are kept out of the message list on purpose. The list is what gets
 * sent back to the model as history, so an "error" bubble in it would be read
 * as something the assistant said.
 */
export default function ChatBot() {
  const reduce = useReducedMotion();
  const onHero = useSyncExternalStore(subscribeScroll, isOnHero, isOnHeroServer);
  const micAvailable = useSyncExternalStore(subscribeNever, canListen, notOnServer);
  const speechAvailable = useSyncExternalStore(subscribeNever, canSpeak, notOnServer);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hint, setHint] = useState(false);

  /* Voice state: whether replies are read aloud, whether one is being read
     right now, and whether the mic is open. */
  /* On by default: the robot is a character that talks. Nothing can play
     before the visitor clicks it (browsers block speech until then), and the
     speaker button in the header mutes it. */
  const [speakReplies, setSpeakReplies] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const heardRef = useRef("");
  const greetedRef = useRef(false);

  function stopSpeaking() {
    if (speechAvailable) window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  function stopListening() {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    heardRef.current = "";
    setListening(false);
  }

  function speak(text: string) {
    if (!speechAvailable) return;
    const spoken = toSpeech(text);
    if (!spoken) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(spoken);
    const voice = pickDeepVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang ?? VOICE_LANG;
    utterance.pitch = VOICE_PITCH;
    utterance.rate = VOICE_RATE;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  /* Opening is a click, which is what unlocks audio, so the robot introduces
     itself out loud here — once per visit, and only if it is not muted. */
  function openChat() {
    setOpen(true);
    if (speakReplies && !greetedRef.current) {
      greetedRef.current = true;
      speak(chat.spokenGreeting);
    }
  }

  /* Hide the panel but keep the conversation. Whatever was talking stops:
     a voice carrying on from a panel that is no longer there is unsettling. */
  function minimise() {
    stopListening();
    stopSpeaking();
    setOpen(false);
    launcherRef.current?.focus();
  }

  function clearChat() {
    stopListening();
    stopSpeaking();
    setMessages([]);
    setInput("");
    setError("");
  }

  /* Close ends the conversation; minimise only puts it away. */
  function endChat() {
    clearChat();
    setOpen(false);
    launcherRef.current?.focus();
  }

  /* `viaVoice` marks a question that was spoken. Its answer is read back
     even if the speaker toggle is off: someone who asked out loud expects to
     be answered out loud. */
  async function send(text: string, viaVoice = false) {
    const content = text.trim().slice(0, MAX_CHARS);
    if (!content || loading) return;

    stopSpeaking();
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
      if (viaVoice || speakReplies) speak(data.reply);
    } catch {
      setError(chat.errorLabel);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  /* The recognition callbacks outlive the render that created them, so they
     reach `send` through a ref that always points at the latest one —
     otherwise a spoken question would be sent with a stale message list. */
  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  });

  function toggleMic() {
    if (listening) {
      stopListening();
      return;
    }

    const Ctor = getRecognitionCtor();
    if (!Ctor || loading) return;

    stopSpeaking();
    setError("");
    setInput("");
    heardRef.current = "";

    const recognition = new Ctor();
    recognition.lang = VOICE_LANG;
    recognition.interimResults = true;
    recognition.continuous = false;

    /* Words appear in the field as they are heard, so the visitor can see
       what was understood before it is sent. */
    recognition.onresult = (event) => {
      let heard = "";
      for (let i = 0; i < event.results.length; i++) {
        heard += event.results[i][0].transcript;
      }
      heard = heard.slice(0, MAX_CHARS);
      heardRef.current = heard;
      setInput(heard);
    };

    recognition.onerror = (event) => {
      /* "no-speech" and "aborted" are just the mic closing with nothing
         said. Only a refused permission is worth telling the visitor. */
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError(chat.micDeniedLabel);
      }
    };

    /* Fires once the speaker pauses: send whatever was heard. */
    recognition.onend = () => {
      const heard = heardRef.current.trim();
      recognitionRef.current = null;
      heardRef.current = "";
      setListening(false);
      if (heard) sendRef.current(heard, true);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      recognitionRef.current = null;
    }
  }

  function toggleSpeaker() {
    if (speakReplies) stopSpeaking();
    setSpeakReplies((value) => !value);
  }

  /* Opening puts the caret in the field; Escape puts the panel away and
     hands focus back to the launcher so keyboard users are not dropped at
     the top of the page. */
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      recognitionRef.current?.abort();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      setOpen(false);
      launcherRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  /* Browsers load their voice list lazily and return an empty one the first
     time it is asked for. Asking once on mount means the list is ready by
     the time the robot first speaks. Leaving the page must not leave a voice
     talking or a mic open. */
  useEffect(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.getVoices();
    return () => {
      recognitionRef.current?.abort();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

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

  const headerButton =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-bone";
  const bubble =
    "whitespace-pre-wrap break-words rounded-xl px-4 py-3 text-sm leading-relaxed";

  /* The small label over each assistant message: name plus an "AI" badge. */
  const assistantTag = (
    <p className="label mb-2 flex items-center gap-2 text-cream">
      {chat.name}
      <span className="rounded border border-line px-1.5 py-1 text-bone">
        {chat.badge}
      </span>
    </p>
  );

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
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.3, ease: EASE }}
            style={{ transformOrigin: "bottom right" }}
            className="chat-hud relative flex h-[min(38rem,calc(100dvh-9.5rem))] w-[calc(100vw-2rem)] max-w-[25rem] flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-2xl shadow-black/50"
          >
            {/* HUD corner brackets. Decorative, and above the content so the
                scrolling log passes underneath them. */}
            <span className="pointer-events-none absolute left-1.5 top-1.5 z-10 h-3.5 w-3.5 border-l border-t border-cream/70" aria-hidden="true" />
            <span className="pointer-events-none absolute right-1.5 top-1.5 z-10 h-3.5 w-3.5 border-r border-t border-cream/70" aria-hidden="true" />
            <span className="pointer-events-none absolute bottom-1.5 left-1.5 z-10 h-3.5 w-3.5 border-b border-l border-cream/70" aria-hidden="true" />
            <span className="pointer-events-none absolute bottom-1.5 right-1.5 z-10 h-3.5 w-3.5 border-b border-r border-cream/70" aria-hidden="true" />

            {/* ---- Header ---- */}
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-cream/60 bg-surface ${
                    speaking ? "chat-live" : ""
                  }`}
                >
                  <ChatRobot bust className="h-8 w-8" thinking={loading} speaking={speaking} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold uppercase tracking-[0.16em] text-bone">
                    {chat.name}
                  </p>
                  <p className="label mt-1.5 flex items-center gap-1.5 text-muted">
                    <span
                      className="block h-1.5 w-1.5 shrink-0 rounded-full bg-signal"
                      aria-hidden="true"
                    />
                    {speaking
                      ? chat.speakingStatus
                      : listening
                        ? chat.listeningStatus
                        : chat.status}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-0.5">
                {speechAvailable && (
                  <button
                    type="button"
                    onClick={toggleSpeaker}
                    aria-pressed={speakReplies}
                    aria-label={speakReplies ? chat.speakerOffLabel : chat.speakerOnLabel}
                    title={speakReplies ? chat.speakerOffLabel : chat.speakerOnLabel}
                    className={`${headerButton} ${speakReplies ? "text-cream" : ""}`}
                  >
                    <Icon name={speakReplies ? "speakerOn" : "speakerOff"} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={clearChat}
                  aria-label={chat.clearLabel}
                  title={chat.clearLabel}
                  className={headerButton}
                >
                  <Icon name="trash" />
                </button>
                <button
                  type="button"
                  onClick={minimise}
                  aria-label={chat.minimiseLabel}
                  title={chat.minimiseLabel}
                  className={headerButton}
                >
                  <Icon name="minus" />
                </button>
                <button
                  type="button"
                  onClick={endChat}
                  aria-label={chat.endLabel}
                  title={chat.endLabel}
                  className={headerButton}
                >
                  <Icon name="close" />
                </button>
              </div>
            </div>

            {/* ---- Conversation ----
                `data-lenis-prevent` hands the wheel back to this container;
                without it the smooth-scroller scrolls the page behind. */}
            <div
              ref={logRef}
              data-lenis-prevent
              role="log"
              aria-live="polite"
              className="chat-scroll flex flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-4 py-4"
            >
              <div>
                {assistantTag}
                <p className={`${bubble} border border-line bg-surface/70 text-bone`}>
                  {chat.greeting}
                </p>
              </div>

              {messages.map((message, index) =>
                message.role === "user" ? (
                  <div key={index} className="flex flex-col items-end">
                    <p className="label mb-2 text-muted">{chat.youLabel}</p>
                    <p className={`${bubble} max-w-[88%] border border-cream/50 bg-cream/15 text-bone`}>
                      {message.content}
                    </p>
                  </div>
                ) : (
                  <div key={index}>
                    {assistantTag}
                    <p className={`${bubble} border border-line bg-surface/70 text-bone`}>
                      {message.content}
                    </p>
                  </div>
                ),
              )}

              {loading && (
                <div>
                  {assistantTag}
                  <p className={`${bubble} inline-flex items-center gap-1.5 border border-line bg-surface/70 py-4`}>
                    <span className="sr-only">{chat.typingLabel}</span>
                    {[0, 0.15, 0.3].map((delay) => (
                      <span
                        key={delay}
                        aria-hidden="true"
                        className="chat-dot block h-1.5 w-1.5 rounded-full bg-(--color-cream)"
                        style={{ animationDelay: `${delay}s` }}
                      />
                    ))}
                  </p>
                </div>
              )}

              {error && (
                <p role="alert" className="label text-muted">
                  {error}
                </p>
              )}
            </div>

            {/* ---- Stop talking ----
                Only while a reply is being read. It cuts off this one reply
                and leaves the voice on for the next; the speaker button in
                the header is the one that mutes for good. */}
            <AnimatePresence initial={false}>
              {speaking && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className="overflow-hidden"
                >
                  <div className="flex justify-center border-t border-line px-4 py-2.5">
                    <button
                      type="button"
                      onClick={stopSpeaking}
                      className="label flex items-center gap-2 rounded-full border border-cream/60 bg-cream/15 px-4 py-2 text-bone transition-colors hover:border-cream hover:bg-cream/25"
                    >
                      <Icon name="stop" />
                      {chat.stopTalkingLabel}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ---- Suggested topics: always on hand, not only at the start ---- */}
            <div className="border-t border-line px-4 pb-3 pt-3.5">
              <p className="label mb-2.5 text-cream">{chat.suggestedLabel}</p>
              <ul
                data-lenis-prevent
                className="no-scrollbar flex max-h-[6.75rem] flex-wrap gap-2 overflow-y-auto overscroll-contain"
              >
                {chat.suggestions.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onClick={() => send(suggestion)}
                      disabled={loading}
                      className="rounded-full border border-line bg-surface/60 px-3 py-1.5 text-left text-xs text-bone transition-colors hover:border-cream disabled:opacity-50"
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* ---- Composer ---- */}
            <div className="border-t border-line px-4 pb-4 pt-3">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  send(input);
                }}
                className="flex items-center gap-2"
              >
                {micAvailable && (
                  <button
                    type="button"
                    onClick={toggleMic}
                    disabled={loading}
                    aria-pressed={listening}
                    aria-label={listening ? chat.micStopLabel : chat.micStartLabel}
                    title={listening ? chat.micStopLabel : chat.micStartLabel}
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors disabled:opacity-40 ${
                      listening
                        ? "chat-live border-cream bg-cream/20 text-cream"
                        : "border-line text-muted hover:border-cream hover:text-bone"
                    }`}
                  >
                    <Icon name="mic" />
                  </button>
                )}

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
                  placeholder={listening ? chat.listeningPlaceholder : chat.placeholder}
                  className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-ink/60 px-4 text-sm text-bone outline-none transition-colors placeholder:text-muted focus:border-cream"
                />

                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  aria-label={chat.sendLabel}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-(--color-cream) text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Icon name="send" />
                </button>
              </form>

              <p className="mt-2.5 text-[0.6875rem] leading-snug text-muted">
                {chat.disclaimer}
              </p>
            </div>
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
            onClick={openChat}
            tabIndex={-1}
            aria-hidden="true"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
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
        onClick={() => (open ? minimise() : openChat())}
        aria-label={open ? chat.minimiseLabel : chat.openLabel}
        aria-expanded={open}
        aria-controls="chat-panel"
        initial={{ opacity: 0, y: 40, scale: 0.5 }}
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
        <ChatRobot
          className="h-full w-full"
          thinking={loading}
          speaking={speaking}
          dancing={open}
        />
      </motion.button>
    </motion.div>
  );
}
