import { finalCta } from "@/content/landing";
import { CtaButton } from "./CtaButton";

/**
 * Finalne CTA po case studies — sekcja R.
 *
 * To nie jest „drugie CTA", tylko drugie umiejscowienie tej samej decyzji (A2):
 * ten sam komponent i ten sam tekst przycisku co po VSL.
 *
 * Tło: wyłącznie delikatna siatka z brand background przy kryciu <=12%,
 * żeby CTA pozostało dominujące (R, wymagany asset).
 */
export function FinalCtaSection() {
  return (
    <section id="pierwszy-krok" className="relative overflow-hidden bg-tcs-bg-alt py-16 sm:py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <img
          src="/brand/tlo-desktop.webp"
          alt=""
          className="h-full w-full object-cover opacity-[0.12]"
        />
      </div>

      <div className="relative mx-auto max-w-[760px] px-4 text-center sm:px-8">
        <div className="mx-auto mb-8 h-px w-16 bg-tcs-gold" />

        <p className="text-[11px] font-semibold tracking-[0.18em] text-tcs-gold sm:text-xs">
          {finalCta.eyebrow}
        </p>
        <h2 className="mt-4 text-[28px] font-extrabold leading-tight tracking-[-0.02em] text-tcs-text sm:text-[38px]">
          {finalCta.headline}
        </h2>
        <p className="mt-5 text-[16px] leading-relaxed text-tcs-text-muted sm:text-[18px]">
          {finalCta.supporting}
        </p>

        <div className="mt-10 flex justify-center">
          <CtaButton placement="after_case_studies" />
        </div>

        <p className="mx-auto mt-6 max-w-[62ch] text-[13px] leading-relaxed text-tcs-text-muted sm:text-sm">
          {finalCta.microcopy}
        </p>
      </div>
    </section>
  );
}
