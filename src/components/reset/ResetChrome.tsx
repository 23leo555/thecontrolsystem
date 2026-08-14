import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { site } from "@/lib/site";
import { resetCopy } from "@/content/reset";

/**
 * Header /reset (brief sekcja 4).
 * Samo logo. Bez menu, bez sticky, bez linków odciągających uwagę —
 * użytkownik ma podjąć jedną decyzję, a nie wybierać, dokąd pójść.
 */
export function ResetHeader() {
  return (
    <header className="relative z-10 border-b border-border/60">
      <div className="tcs-container flex h-16 items-center sm:h-20">
        {/* Bez linku — na /reset użytkownik nie ma dokąd iść poza formularzem. */}
        <Logo size={38} />
      </div>
    </header>
  );
}

/** Footer /reset (brief sekcja 14) — kontakt, linki prawne, copyright. */
export function ResetFooter() {
  const linkClass = "transition-colors duration-step hover:text-text-primary";

  return (
    <footer className="border-t border-border/60 bg-surface/40">
      <div className="tcs-container py-10 sm:py-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-display text-sm font-bold tracking-[0.16em]">THE CONTROL SYSTEM</p>
            <p className="mt-3 text-sm text-text-secondary">
              <a href={`mailto:${site.ownerEmail}`} className={linkClass}>
                {site.ownerEmail}
              </a>
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              <a
                href={resetCopy.footer.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                {resetCopy.footer.instagram}
              </a>
            </p>
          </div>

          <nav aria-label="Informacje prawne">
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-secondary">
              <li>
                <Link href={site.routes.privacy} className={linkClass}>
                  Polityka Prywatności
                </Link>
              </li>
              <li>
                <Link href={site.routes.cookies} className={linkClass}>
                  Cookies
                </Link>
              </li>
              <li>
                <Link href={site.routes.terms} className={linkClass}>
                  Regulamin
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <p className="mt-8 border-t border-border/60 pt-6 text-[0.6875rem] leading-relaxed text-text-secondary/70">
          {resetCopy.footer.copyright}
        </p>
      </div>
    </footer>
  );
}
