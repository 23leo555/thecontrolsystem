import type { Metadata } from "next";
import Link from "next/link";
import { ApplyFlow } from "@/components/apply/ApplyFlow";
import { site } from "@/lib/site";
import { PageBackground } from "@/components/landing/PageBackground";

/**
 * /apply — sekcja T briefu.
 *
 * Indeksacja wg AL1: noindex, nofollow i brak w sitemapie. To drugi etap
 * doświadczenia premium, nie zewnętrzny formularz — ta sama paleta,
 * typografia i logo co landing (T1).
 */
export const metadata: Metadata = {
  title: "Aplikacja do The Control System 1 na 1",
  robots: { index: false, follow: false },
};

export default function ApplyPage() {
  return (
    <div className="min-h-screen">
      <PageBackground />
      {/* Header bez nawigacji — w trakcie formularza nie oferujemy alternatyw (T3). */}
      <header className="border-b border-tcs-border/60 bg-tcs-bg/60 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[640px] items-center justify-center px-4 sm:px-8">
          <Link
            href={site.routes.home}
            aria-label={site.name}
            className="inline-flex items-center gap-3 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tcs-blue"
          >
            <img src="/brand/tcs-logo-poziome.webp" alt="" width={720} height={264} className="h-11 w-auto" />
          </Link>
        </div>
      </header>
      <main id="main">
        <ApplyFlow />
      </main>
    </div>
  );
}
