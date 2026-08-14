import Link from "next/link";
import { site } from "@/lib/site";

/**
 * Header landingu — celowo BEZ nawigacji (sekcja AF5).
 * Strona ma jedną decyzję, więc nagłówek nie może oferować alternatyw.
 * Nie ma tu również CTA: pierwsze pojawia się dopiero po VSL (sekcja A2).
 */
export function Header() {
  return (
    <header className="relative z-20 border-b border-tcs-border/60">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center px-4 sm:h-20 sm:px-8">
        <Link
          href={site.routes.home}
          className="flex items-center gap-3 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tcs-blue focus-visible:ring-offset-2 focus-visible:ring-offset-tcs-bg"
        >
          <img
            src="/brand/tcs-logo.webp"
            alt=""
            width={36}
            height={36}
            className="h-8 w-8 sm:h-9 sm:w-9"
          />
          <span className="text-[13px] font-bold tracking-[0.16em] text-tcs-text sm:text-sm">
            THE CONTROL SYSTEM
          </span>
        </Link>
      </div>
    </header>
  );
}
