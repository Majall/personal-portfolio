"use client";

import { Container } from "./ui/Section";
import { footer, nav, profile } from "../../data/content";

/**
 * Footer.
 *
 * One hairline row, as in the reference: the notice on the left, section
 * links and outbound links on the right. Deliberately the quietest thing on
 * the page — the contact chapter immediately above it is where the call to
 * action lives, so repeating it here would only dilute it.
 */
const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-ink py-9">
      <Container>
        <div className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
          <p className="label text-muted">
            © {year} {profile.name}. {footer.rights}
          </p>

          <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
            <nav aria-label={footer.indexLabel}>
              <ul className="flex flex-wrap items-center gap-x-6 gap-y-3">
                {nav.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.href}
                      className="label text-muted transition-colors hover:text-bone"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <span
              aria-hidden="true"
              className="hidden h-3 w-px bg-line md:block"
            />

            <nav aria-label={footer.elsewhereLabel}>
              <ul className="flex flex-wrap items-center gap-x-6 gap-y-3">
                {footer.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={
                        link.href.startsWith("mailto:") ? undefined : "_blank"
                      }
                      rel="noopener noreferrer"
                      className="label text-muted transition-colors hover:text-bone"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <a
              href="#home"
              className="label text-muted transition-colors hover:text-bone"
            >
              {footer.backToTop}
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
