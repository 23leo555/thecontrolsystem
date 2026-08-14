import { step1 } from "@/content/landing";
import { VideoPlayer } from "./VideoPlayer";

/**
 * Krok 1 / VSL — sekcja L.
 *
 * Player ma być największym wizualnie elementem strony, po krótkim intro
 * i bez sąsiadujących kart ani ikon (L, sposób prezentacji).
 * Nie ma tu osobnego przycisku — interakcją jest Play playera.
 */
export function Step1Section() {
  return (
    <section id="krok-1" className="bg-tcs-bg-alt py-16 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
        <div className="mx-auto mb-10 max-w-[46rem] text-center sm:mb-14">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-tcs-gold sm:text-xs">
            {step1.eyebrow}
          </p>
          <h2 className="mt-4 text-[28px] font-extrabold leading-tight tracking-[-0.02em] text-tcs-text sm:text-[38px] lg:text-[44px]">
            {step1.headline}
          </h2>
          <p className="mx-auto mt-5 max-w-[56ch] text-[16px] leading-relaxed text-tcs-text-muted sm:text-[18px]">
            {step1.supporting}
          </p>
        </div>

        <VideoPlayer />

        <p className="mt-5 text-center text-[13px] tracking-[0.06em] text-tcs-text-muted sm:text-sm">
          {step1.microcopy}
        </p>
      </div>
    </section>
  );
}
