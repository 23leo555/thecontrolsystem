import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { footer } from "@/content/landing";
import { site } from "@/lib/site";

/** 13. Footer — kontakt, dokumenty prawne, copyright. Sekcja 6. */
export function Footer() {
  return (
    <footer className="border-t border-border bg-surface-2">
      <div className="tcs-container py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm text-text-secondary">{footer.tagline}</p>
            <a
              href={`mailto:${site.ownerEmail}`}
              className="mt-3 inline-block text-sm text-gold hover:underline"
            >
              {site.ownerEmail}
            </a>
          </div>

          <nav aria-label="Dokumenty prawne" className="flex flex-col gap-2 text-sm">
            <Link href={site.routes.privacy} className="text-text-secondary hover:text-text-primary">
              Polityka prywatności
            </Link>
            <Link href={site.routes.cookies} className="text-text-secondary hover:text-text-primary">
              Polityka cookies
            </Link>
            <Link href={site.routes.terms} className="text-text-secondary hover:text-text-primary">
              Regulamin
            </Link>
          </nav>
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="text-xs text-text-secondary/70">{footer.legalNote}</p>
          <p className="mt-2 text-xs text-text-secondary/70">{footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
