import Link from "next/link";
import { site } from "@/lib/site";

/**
 * Header landingu — bez nawigacji (sekcja AF5).
 *
 * Poprawki 27.10.2026: logo w wersji poziomej (mózg + puls + napis) na środku
 * i przycisk „APLIKUJ JUŻ TERAZ" na wysokości loga, po prawej. Na telefonie
 * logo przesuwa się w lewo, żeby zmieścić przycisk w jednym rzędzie.
 */
export function Header() {
  return (
    <header className="relative z-20 border-b border-tcs-border/60 bg-tcs-bg/60 backdrop-blur-sm">
      <div className="mx-auto grid h-16 max-w-[1600px] grid-cols-[auto_1fr] items-center gap-3 px-4 sm:h-20 sm:px-6 md:h-24 md:grid-cols-[1fr_auto_1fr]">
        <div className="hidden md:block" />

        <Link
          href={site.routes.home}
          aria-label={site.name}
          className="flex items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tcs-blue focus-visible:ring-offset-2 focus-visible:ring-offset-tcs-bg"
        >
          <img
            src="/brand/tcs-logo-poziome.webp"
            alt=""
            width={720}
            height={264}
            className="h-11 w-auto sm:h-[60px] md:h-[76px]"
          />
        </Link>

        <Link
          href={`${site.routes.apply}?cta_placement=header`}
          data-cta-placement="header"
          className="justify-self-end inline-flex min-h-[40px] items-center justify-center whitespace-nowrap rounded-full bg-gradient-to-b from-tcs-gold-hover to-tcs-gold px-4 text-[11px] font-bold tracking-[0.08em] text-[#07090C] shadow-[0_0_0_1px_rgba(255,255,255,0.12)_inset,0_8px_24px_-8px_rgba(201,169,110,0.55)] transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.18)_inset,0_10px_28px_-6px_rgba(201,169,110,0.75)] active:translate-y-px focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-tcs-blue focus-visible:ring-offset-[3px] focus-visible:ring-offset-tcs-bg sm:min-h-[46px] sm:px-6 sm:text-[13px]"
        >
          APLIKUJ JUŻ TERAZ
        </Link>
      </div>
    </header>
  );
}
