import { hero } from "@/content/landing";

/**
 * Hero — sekcja K briefu.
 *
 * Świadomie BEZ przycisku do aplikacji (A2): użytkownik najpierw rozumie
 * obietnicę, potem ogląda VSL, a dopiero po nim dostaje pierwsze CTA.
 * Dolne microcopy jest jedynym sygnałem następnego kroku.
 *
 * Headline nie zawiera zakresów „6-12 kg / 6-20 cm" — VSL ich nie potwierdza,
 * a case studies obejmują 6 i 12 miesięcy, nie 90 dni (K, decyzja claimowa).
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-tcs-bg">
      {/* Grafika mózgu jako dekoracja o niskim kontraście — nie może konkurować
          z headline, szczególnie na mobile (K, sposób prezentacji). */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <picture>
          <source media="(min-width: 768px)" srcSet="/brand/tlo-desktop.webp" />
          <img
            src="/brand/tlo-mobile.webp"
            alt=""
            className="h-full w-full object-cover opacity-[0.22] md:opacity-30"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-r from-tcs-bg via-tcs-bg/85 to-tcs-bg/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-tcs-bg via-transparent to-transparent" />
      </div>

      {/* Zewnętrzny kontener 1200 px jest wspólny z KROKIEM 1, dowodami i finalnym CTA —
          poszerzamy wyłącznie lokalny wrapper poniżej (brief hero, E2 + K3). */}
      <div className="relative mx-auto max-w-[1200px] px-4 pb-12 pt-14 sm:px-8 sm:pb-16 sm:pt-20 lg:pb-20 lg:pt-28">
        <div className="max-w-[46rem] lg:max-w-[70rem]">
          <p className="text-[11px] font-semibold uppercase leading-relaxed tracking-[0.18em] text-tcs-gold sm:text-xs">
            {hero.eyebrow}
          </p>

          {/* `break-words` (overflow-wrap: break-word) zabezpiecza „podporządkowywania"
              — przy 360/390 px słowo jest szersze niż kolumna i było obcinane przez
              overflow-hidden sekcji (brief hero, B3). Hyphens korzystają z lang="pl". */}
          <h1 className="mt-6 hyphens-auto break-words text-[28px] font-extrabold leading-[1.1] tracking-[-0.02em] text-tcs-text sm:text-[44px] lg:text-[58px]">
            {hero.headline}
          </h1>

          <p className="mt-6 max-w-[54ch] text-[17px] leading-relaxed text-tcs-text-muted sm:text-[19px] lg:max-w-[88ch]">
            {hero.supporting}
          </p>
        </div>
      </div>
    </section>
  );
}
