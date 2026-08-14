import Link from "next/link";
import { CTA_LABEL } from "@/content/landing";
import { site } from "@/lib/site";

/** Miejsce osadzenia CTA — trafia do eventu i parametru URL (sekcja O1). */
export type CtaPlacement = "after_vsl" | "after_case_studies" | "vsl_complete";

interface CtaButtonProps {
  placement: CtaPlacement;
  className?: string;
}

/**
 * Jedyny wariant CTA na stronie (sekcja O).
 *
 * Specyfikacja z O2 jest wiążąca co do piksela: 56 px wysokości, font 15/700,
 * tracking 0,04 em, max 520 px na desktopie i pełna szerokość na mobile.
 * Focus ring 3 px w kolorze #8EDBFF z offsetem 3 px — nie zastępować `outline-none`.
 *
 * Cały element jest JEDNYM semantycznym linkiem — bez zagnieżdżonych
 * elementów interaktywnych (wymóg O2, istotne dla czytników ekranu).
 */
export function CtaButton({ placement, className = "" }: CtaButtonProps) {
  // Parametr scoringowy NIE może trafić do URL (O1) — przekazujemy wyłącznie miejsce osadzenia.
  const href = `${site.routes.apply}?cta_placement=${placement}`;

  return (
    <Link
      href={href}
      data-cta-placement={placement}
      className={[
        "inline-flex items-center justify-center text-center",
        "w-full sm:w-auto sm:min-w-[320px] sm:max-w-[520px]",
        "min-h-[56px] px-[18px] sm:px-7",
        "text-[14px] sm:text-[15px] font-bold tracking-[0.04em] leading-tight",
        "rounded-[14px] bg-tcs-gold text-[#07090C]",
        "transition-colors duration-200 hover:bg-tcs-gold-hover",
        "active:translate-y-px",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-tcs-blue focus-visible:ring-offset-[3px] focus-visible:ring-offset-tcs-bg",
        className,
      ].join(" ")}
    >
      {CTA_LABEL}
    </Link>
  );
}
