import Link from "next/link";
import { footer } from "@/content/landing";
import { site } from "@/lib/site";

/**
 * Footer — sekcja S.
 *
 * Świadomie BEZ Instagrama, Facebooka, Messengera i mapy strony produktowej.
 * Tekst 13-14 px, kontrast minimum AA.
 *
 * UWAGA: oba disclaimery są oznaczone w briefie jako DO FINALNEJ WERYFIKACJI
 * PRAWNEJ (bloker P0 z AN1) — nie publikować bez akceptacji prawnika.
 */
const legalLinks = [
  { href: site.routes.privacy, label: "Polityka prywatności" },
  { href: site.routes.cookies, label: "Cookies" },
  { href: site.routes.legal, label: "Dane firmy i zastrzeżenia" },
  { href: site.routes.controlReset90, label: "Warunki Control Reset 90" },
];

export function Footer() {
  return (
    <footer className="border-t border-tcs-border bg-tcs-bg">
      <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-8 sm:py-16">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <img src="/brand/tcs-logo.webp" alt="" width={32} height={32} className="h-8 w-8" />
              <span className="text-[13px] font-bold tracking-[0.16em] text-tcs-text">
                THE CONTROL SYSTEM
              </span>
            </div>
            <p className="mt-3 text-[13px] text-tcs-text-muted sm:text-sm">{footer.role}</p>
            <a
              href={`mailto:${site.ownerEmail}`}
              className="mt-1 inline-block text-[13px] text-tcs-text-muted underline underline-offset-4 transition-colors hover:text-tcs-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tcs-blue sm:text-sm"
            >
              {site.ownerEmail}
            </a>
          </div>

          <nav aria-label="Informacje prawne">
            <ul className="space-y-2">
              {legalLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[13px] text-tcs-text-muted underline underline-offset-4 transition-colors hover:text-tcs-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tcs-blue sm:text-sm"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 space-y-3 border-t border-tcs-border pt-8">
          <p className="max-w-[85ch] text-[13px] leading-relaxed text-tcs-text-muted">
            {footer.resultsDisclaimer}
          </p>
          <p className="max-w-[85ch] text-[13px] leading-relaxed text-tcs-text-muted">
            {footer.healthDisclaimer}
          </p>
          <p className="pt-2 text-[13px] text-tcs-text-muted">
            © {new Date().getFullYear()} {site.company.legalName}. Wszelkie prawa zastrzeżone.
          </p>
        </div>
      </div>
    </footer>
  );
}
