import Link from "next/link";
import { site } from "@/lib/site";

/**
 * Header landingu — celowo BEZ nawigacji (sekcja AF5).
 * Strona ma jedną decyzję, więc nagłówek nie może oferować alternatyw.
 *
 * Poprawki 25.10.2026: logo na środku, w wersji poziomej (mózg + puls + napis).
 * Napis jest częścią grafiki, więc `alt` niesie nazwę marki.
 */
export function Header() {
  return (
    <header className="relative z-20 border-b border-tcs-border/60">
      <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-center px-4 sm:h-28 sm:px-8">
        <Link
          href={site.routes.home}
          className="flex items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tcs-blue focus-visible:ring-offset-2 focus-visible:ring-offset-tcs-bg"
        >
          <img
            src="/brand/tcs-logo-poziome.webp"
            alt={site.name}
            width={720}
            height={257}
            className="h-16 w-auto sm:h-24"
          />
        </Link>
      </div>
    </header>
  );
}
