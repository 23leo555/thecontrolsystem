import Link from "next/link";
import { finalCta, protocolBridge } from "@/content/landing";
import { site } from "@/lib/site";
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

        {/* Zejście do Protokołu — pod microcopy i bez stylu przycisku, żeby nie
            konkurowało z aplikacją (patrz `protocolBridge` w treściach). */}
        <p className="mt-10 border-t border-tcs-border/60 pt-8 text-[14px] leading-relaxed text-tcs-text-muted">
          {protocolBridge.question}{" "}
          <Link
            href={site.routes.reset}
            className="font-semibold text-tcs-gold underline decoration-tcs-gold/40 underline-offset-4 transition-colors hover:text-tcs-gold-hover hover:decoration-tcs-gold-hover focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-tcs-blue focus-visible:ring-offset-[3px] focus-visible:ring-offset-tcs-bg-alt"
          >
            {protocolBridge.linkLabel}
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
