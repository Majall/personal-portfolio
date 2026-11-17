// app/page.tsx
import { existsSync } from "node:fs";
import path from "node:path";

import NavBar from "./components/NavBar";
import Toolkit from "./components/Toolkit";
import Header from "./components/Header";
import About from "./components/About";
import Services from "./components/Services";
import Work from "./components/Work";
import Labs from "./components/Labs";
import Game from "./components/Game";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

import { profile } from "../data/content";

/**
 * Resolve a path declared in content.ts against /public.
 *
 * An absolute URL is passed straight through; a local path is only used when
 * the file is really on disk, so a renamed or missing asset degrades to null
 * instead of shipping a 404 to the browser.
 *
 * This runs here rather than in the components because this is a server
 * component: it is resolved once at build time and handed down as a prop.
 */
function resolvePublicAsset(value: string): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//.test(trimmed)) return trimmed;

  const onDisk = path.join(process.cwd(), "public", trimmed.replace(/^\//, ""));
  return existsSync(onDisk) ? trimmed : null;
}

/* All copy comes from src/data/content.ts, so this is a plain static render —
   no data fetching and no runtime dependency on the backend being awake. The
   contact form still posts to /api/contact from the client. */
export default function Page() {
  const resumeHref = resolvePublicAsset(profile.resume);
  const portraitSrc = resolvePublicAsset(profile.portrait);

  return (
    <>
      <NavBar resumeHref={resumeHref} />
      <main id="main">
        <Header portraitSrc={portraitSrc} />
        <About resumeHref={resumeHref} />
        <Services />
        <Toolkit />
        <Labs />
        <Work />
        <Game />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
