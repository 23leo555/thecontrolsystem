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

      <div className="relative mx-auto max-w-[1200px] px-4 pb-16 pt-14 sm:px-8 sm:pb-20 sm:pt-20 lg:pb-24 lg:pt-28">
        <div className="max-w-[46rem]">
          <p className="text-[11px] font-semibold uppercase leading-relaxed tracking-[0.18em] text-tcs-gold sm:text-xs">
            {hero.eyebrow}
          </p>

          <h1 className="mt-6 text-[34px] font-extrabold leading-[1.06] tracking-[-0.02em] text-tcs-text sm:text-[44px] lg:text-[58px]">
            {hero.headline}
          </h1>

          <p className="mt-6 max-w-[54ch] text-[17px] leading-relaxed text-tcs-text-muted sm:text-[19px]">
            {hero.supporting}
          </p>

          {/* Badge gwarancji: spokojny blok z cienką złotą linią.
              Bez ikony tarczy i bez glow (K). */}
          <div className="mt-9 max-w-[52ch] border-l-2 border-tcs-gold bg-tcs-surface/50 py-4 pl-5 pr-4">
            <p className="text-[12px] font-bold tracking-[0.16em] text-tcs-gold">
              {hero.riskReversal.badge}
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-tcs-text-muted sm:text-[15px]">
              {hero.riskReversal.body}
            </p>
          </div>

          <p className="mt-10 text-[12px] font-semibold tracking-[0.16em] text-tcs-text-muted sm:text-[13px]">
            {hero.nextStep}
          </p>
        </div>
      </div>
    </section>
  );
}
