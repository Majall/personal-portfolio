// app/page.tsx
import { existsSync } from "node:fs";
import path from "node:path";

import NavBar from "./components/NavBar";
import Header from "./components/Header";
import TechStrip from "./components/TechStrip";
import About from "./components/About";
import Services from "./components/Services";
import Labs from "./components/Labs";
import Work from "./components/Work";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

import { profile } from "../data/content";

/**
 * Résumé link resolution.
 *
 * `profile.resume` in content.ts is a path under /public. An absolute URL is
 * passed straight through; a local path is only linked to when the file is
 * really on disk, so a renamed or missing PDF hides the link instead of
 * shipping a 404 to the browser.
 *
 * This runs here rather than in About because this is a server component, so
 * it is resolved once at build/render time.
 */
function resolveResumeHref(resume: string): string | null {
  const value = resume?.trim();
  if (!value) return null;
  if (/^https?:\/\//.test(value)) return value;

  const onDisk = path.join(process.cwd(), "public", value.replace(/^\//, ""));
  return existsSync(onDisk) ? value : null;
}

/* All copy now comes from src/data/content.ts, so this is a plain static
   render — no data fetching, nothing to fall back to, and no runtime
   dependency on the backend being awake. The contact form still posts to
   /api/contact from the client. */
export default function Page() {
  return (
    <>
      <NavBar />
      <main id="main">
        <Header />
        <TechStrip />
        <About resumeHref={resolveResumeHref(profile.resume)} />
        <Services />
        <Labs />
        <Work />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
