"use client";

import { useReducedMotion } from "framer-motion";
import { Container } from "./ui/Section";
import { footer, nav, profile } from "../../data/content";

/* The "Index" column repeats the nav, minus the link back to the top — the
   back-to-top control below already covers that. */
const footerNav = nav.filter((link) => link.id !== "top");

const Footer: React.FC = () => {
  const reduce = useReducedMotion();
  const year = new Date().getFullYear();

  return (
    <footer
      data-tone="bone"
      className="tone-surface relative w-full overflow-hidden"
    >
      <Container className="py-14 sm:py-20">
        <div className="flex flex-col gap-10 border-b pb-10 rule lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="display text-3xl sm:text-4xl">{profile.name}</p>
            <p className="label mt-3 text-muted">{profile.title}</p>
            <p className="label mt-2 text-muted">{profile.location}</p>
            <a
              href={`mailto:${profile.email}`}
              className="mt-5 inline-block border-b border-current pb-0.5 text-sm transition-opacity hover:opacity-70"
            >
              {profile.email}
            </a>
          </div>

          <div className="flex gap-12 sm:gap-20">
            <nav aria-label="Footer">
              <p className="label mb-4 text-muted">{footer.indexLabel}</p>
              <ul className="space-y-2.5">
                {footerNav.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.href}
                      className="text-sm transition-opacity hover:opacity-60"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <p className="label mb-4 text-muted">{footer.elsewhereLabel}</p>
              <ul className="space-y-2.5">
                {footer.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={
                        link.href.startsWith("mailto:") ? undefined : "_blank"
                      }
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-60"
                    >
                      {link.label}
                      <span
                        aria-hidden="true"
                        className="transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      >
                        ↗
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="label text-muted">
            © {year} {profile.name}. {footer.rights}
          </p>
          <button
            onClick={() =>
              window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })
            }
            className="label self-start text-muted transition-opacity hover:opacity-60 sm:self-auto"
          >
            {footer.backToTop}
          </button>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
