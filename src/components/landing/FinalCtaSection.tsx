import { finalCta } from "@/content/landing";
import { CtaButton } from "./CtaButton";

/**
 * Finalne CTA po case studies — sekcja R. Jedyne CTA w treści strony,
 * prowadzi wprost do pierwszego pytania ankiety. Tło wspólne (PageBackground).
 */
export function FinalCtaSection() {
  return (
    <section id="pierwszy-krok" className="pb-12 pt-4 sm:pb-16 sm:pt-6">
      <div className="mx-auto max-w-[1600px] px-3 text-center sm:px-6">
        <div className="mx-auto mb-5 h-px w-12 bg-tcs-gold" />

        <p className="text-[10px] font-semibold tracking-[0.18em] text-tcs-gold sm:text-[11px]">
          {finalCta.eyebrow}
        </p>
        <h2 className="mt-3 text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-tcs-text sm:text-[28px] lg:text-[32px]">
          {finalCta.headline}
        </h2>
        <p className="mx-auto mt-3 text-[14px] leading-relaxed text-tcs-text-muted sm:text-[16px]">
          {finalCta.supporting}
        </p>

        <div className="mt-6 flex justify-center">
          <CtaButton placement="after_case_studies" label={finalCta.ctaLabel} />
        </div>

        <p className="mx-auto mt-3 text-[12px] leading-relaxed text-tcs-text-muted sm:text-[13px]">
          {finalCta.microcopy}
        </p>
      </div>
    </section>
  );
}
