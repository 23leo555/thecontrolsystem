import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { site } from "@/lib/site";

/**
 * Szkielet stron prawnych (sekcja 21).
 * UWAGA: treści są szkicem roboczym. Finalne brzmienie musi zatwierdzić prawnik
 * przed uruchomieniem produkcyjnym — dotyczy to zwłaszcza reguł wpływających
 * na dostęp do usługi.
 */
export function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <main id="main" className="min-h-screen">
      <div className="tcs-container max-w-prose py-12 sm:py-16">
        <Link href={site.routes.system} aria-label={site.brand} className="inline-flex">
          <Logo />
        </Link>

        <h1 className="mt-10 text-display-sm">{title}</h1>
        <p className="mt-2 text-sm text-text-secondary">Ostatnia aktualizacja: {updatedAt}</p>

        <div className="mt-6 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          <strong>Dokument roboczy.</strong> Treść wymaga zatwierdzenia przez prawnika przed
          uruchomieniem produkcyjnym.
        </div>

        <div className="legal mt-10 space-y-6 text-text-secondary">{children}</div>

        <p className="mt-12 border-t border-border pt-6 text-sm">
          Pytania dotyczące danych:{" "}
          <a href={`mailto:${site.ownerEmail}`} className="text-gold underline">
            {site.ownerEmail}
          </a>
        </p>

        <nav className="mt-6 flex flex-wrap gap-4 text-sm text-text-secondary">
          <Link href={site.routes.privacy} className="hover:text-text-primary">Polityka prywatności</Link>
          <Link href={site.routes.cookies} className="hover:text-text-primary">Cookies</Link>
          <Link href={site.routes.terms} className="hover:text-text-primary">Regulamin</Link>
          <Link href={site.routes.system} className="hover:text-text-primary">Strona główna</Link>
        </nav>
      </div>
    </main>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-8 text-lg font-bold text-text-primary">{children}</h2>;
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="leading-relaxed">{children}</p>;
}

export function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5">{children}</ul>;
}
