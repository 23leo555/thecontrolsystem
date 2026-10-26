import { step1 } from "@/content/landing";
import { VideoPlayer } from "./VideoPlayer";

/**
 * VSL — sekcja L.
 *
 * Player jest największym elementem strony, po krótkim intro i bez
 * sąsiadujących kart ani ikon. Interakcją jest Play playera.
 */
export function Step1Section() {
  return (
    <section id="krok-1" className="py-8 sm:py-10">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
        <div className="mx-auto mb-6 max-w-[42rem] text-center sm:mb-8">
          <h2 className="text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-tcs-text sm:text-[28px] lg:text-[32px]">
            {step1.headline}
          </h2>
          <p className="mx-auto mt-3 max-w-[58ch] text-[14px] leading-relaxed text-tcs-text-muted sm:text-[16px]">
            {step1.supporting}
          </p>
        </div>

        <VideoPlayer />
      </div>
    </section>
  );
}
