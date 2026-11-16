import type { Metadata } from "next";
import {
  Inter,
  Archivo,
  Instrument_Serif,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import IntroLoader from "./components/IntroLoader";
import SmoothScroll from "./components/SmoothScroll";
import ChatBot from "./components/ChatBot";
import { meta, ui } from "../data/content";

/* Applied before first paint, so a visitor who chose light never sees a dark
   frame first. It has to be an inline script in <head>: anything that waits
   for React to hydrate runs after the browser has already painted, which is
   exactly the flash this avoids.

   Order of authority: an explicit stored choice wins, otherwise the OS
   preference, otherwise dark. Kept to one statement and wrapped in a
   try/catch, because localStorage throws outright in some privacy modes and
   an exception here would block the rest of the document. */
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");if(!t){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}if(t==="light"){document.documentElement.dataset.theme="light"}}catch(e){}})();`;

/* Draws a curtain over the page before first paint when the intro is about to
   play (not yet seen this session, motion allowed), so the hero never shows
   in the gap before the loader hydrates. IntroLoader lifts it once it is on
   screen; the timeout is a failsafe so a hydration failure cannot leave the
   page covered. The storage key must match STORAGE_KEY in IntroLoader. */
const INTRO_SCRIPT = `(function(){try{var d=document.documentElement;if(sessionStorage.getItem("intro-played")!=="1"&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches){d.dataset.intro="pending";setTimeout(function(){delete d.dataset.intro},6000)}}catch(e){}})();`;

/* Body face. */
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

/* Display face: heavy, wide grotesk for the oversized uppercase headlines.
   800/900 only — anything lighter loses against the display sizes. */
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["800", "900"],
  variable: "--font-archivo",
  display: "swap",
});

/* The single italic accent word in each chapter heading. */
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic", "normal"],
  variable: "--font-instrument",
  display: "swap",
});

/* Tiny letterspaced metadata labels. */
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
};

/* Dark is the default and is what the markup renders; light is applied by the
   inline script above, before paint, from a stored choice or the OS setting.
   `suppressHydrationWarning` is on <html> because that script mutates the very
   element React is about to hydrate — the attribute it adds is expected to
   differ from the server's output, and this is the one case where that is
   correct rather than a bug. */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${archivo.variable} ${instrument.variable} ${jetbrains.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      </head>
      <body className="overflow-x-hidden bg-ink text-bone">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-bone focus:px-5 focus:py-2.5 focus:text-ink focus:label"
        >
          {ui.skipToContent}
        </a>

        <SmoothScroll />
        <IntroLoader />
        {children}
        <ChatBot />

        {/* Film grain sits above the page and below the loader. */}
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
