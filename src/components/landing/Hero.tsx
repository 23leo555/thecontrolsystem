import { hero } from "@/content/landing";

/**
 * Hero — sekcja K briefu.
 *
 * Świadomie BEZ przycisku do aplikacji (A2): użytkownik najpierw rozumie
 * obietnicę, potem ogląda VSL, a dopiero po nim dostaje CTA.
 * Tło jest wspólne dla całej strony (PageBackground).
 */
export function Hero() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-[860px] px-4 pb-6 pt-10 text-center sm:px-8 sm:pb-8 sm:pt-14 lg:pt-16">
        <p className="text-[10px] font-semibold uppercase leading-relaxed tracking-[0.18em] text-tcs-gold sm:text-[11px]">
          {hero.eyebrow}
        </p>

        {/* `break-words` zabezpiecza długie słowa przy 360 px (brief hero, B3). */}
        <h1 className="mt-4 hyphens-auto break-words text-[30px] font-extrabold leading-[1.1] tracking-[-0.02em] text-tcs-text sm:text-[40px] lg:text-[48px]">
          {hero.headline}
        </h1>

        <p className="mt-3 text-[17px] font-bold leading-snug text-tcs-gold sm:text-[20px]">
          {hero.subheadline}
        </p>

        <p className="mx-auto mt-5 max-w-[60ch] text-[15px] font-semibold leading-relaxed text-tcs-text sm:text-[16px]">
          {hero.lead}
        </p>

        <p className="mx-auto mt-3 max-w-[64ch] text-[14px] leading-relaxed text-tcs-text-muted sm:text-[15px]">
          {hero.supporting}
        </p>
      </div>
    </section>
  );
}
