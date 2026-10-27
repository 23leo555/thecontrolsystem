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
      <div className="mx-auto max-w-[1600px] px-3 pb-6 pt-10 text-center sm:px-6 sm:pb-8 sm:pt-14 lg:pt-16">
        <p className="text-[10px] font-semibold uppercase leading-relaxed tracking-[0.18em] text-tcs-gold sm:text-[11px]">
          {hero.eyebrow}
        </p>

        {/* `break-words` zabezpiecza długie słowa przy 360 px (brief hero, B3). */}
        <h1 className="mt-4 hyphens-auto break-words text-[26px] font-extrabold leading-[1.1] tracking-[-0.02em] text-tcs-text sm:text-[40px] lg:text-[48px]">
          {hero.headline}
        </h1>

        <p className="mt-3 text-[15px] font-bold leading-snug text-tcs-gold sm:text-[20px]">
          {hero.subheadline[0]} <br className="sm:hidden" />
          {hero.subheadline[1]}
        </p>

        <p className="mx-auto mt-5 text-[14px] font-semibold leading-relaxed text-tcs-text sm:text-[16px]">
          {hero.lead}
        </p>

        <p className="mx-auto mt-3 text-[13px] leading-relaxed text-tcs-text-muted sm:text-[15px]">
          {hero.supporting[0]} <br className="hidden lg:inline" />
          {hero.supporting[1]} <br className="hidden lg:inline" />
          {hero.supporting[2]}
        </p>
      </div>
    </section>
  );
}
