import type { Metadata } from "next";
import { Outfit, Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./context/ThemaeContext";
import { meta, ui } from "../data/content";

/* Body face. Each face exposes a CSS variable rather than being applied via
   className on <body>, so globals.css decides where each one is used. */
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-outfit",
  display: "swap",
});

/* Display face: a heavy, wide grotesk for the oversized uppercase headlines. */
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-archivo",
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

/* Runs before first paint so the stored theme is applied without a flash of
   the wrong palette. Kept deliberately tiny and failure-tolerant: private
   browsing can make localStorage throw. */
const themeScript = `
(function(){
  try {
    var stored = localStorage.getItem("theme");
    var dark = stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${archivo.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="overflow-x-hidden">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink-900 focus:px-5 focus:py-2.5 focus:text-bone-100 focus:label"
        >
          {ui.skipToContent}
        </a>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
