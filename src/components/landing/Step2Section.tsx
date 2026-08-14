import { step2 } from "@/content/landing";
import { CtaButton } from "./CtaButton";

/**
 * Krok 2 — sekcja N. Pierwsze CTA na całej stronie.
 *
 * Wyśrodkowany blok do 720 px, dużo pustej przestrzeni, jeden pełnowymiarowy
 * przycisk. Świadomie BEZ kart benefitowych, checklist i kolejnego pitchu (N).
 * CTA zostaje widoczne niezależnie od tego, czy film został obejrzany (M4).
 */
export function Step2Section() {
  return (
    <section id="krok-2" className="bg-tcs-bg py-16 sm:py-24">
      <div className="mx-auto max-w-[720px] px-4 text-center sm:px-8">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-tcs-gold sm:text-xs">
          {step2.eyebrow}
        </p>
        <h2 className="mt-4 text-[28px] font-extrabold leading-tight tracking-[-0.02em] text-tcs-text sm:text-[38px]">
          {step2.headline}
        </h2>
        <p className="mt-5 text-[16px] leading-relaxed text-tcs-text-muted sm:text-[18px]">
          {step2.supporting}
        </p>

        <div className="mt-10 flex justify-center">
          <CtaButton placement="after_vsl" />
        </div>

        <p className="mx-auto mt-6 max-w-[60ch] text-[13px] leading-relaxed text-tcs-text-muted sm:text-sm">
          {step2.microcopy}
        </p>
      </div>
    </section>
  );
}
