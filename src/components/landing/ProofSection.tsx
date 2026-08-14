import { proof, boleslaw, oskar, type CaseStudy } from "@/content/landing";

/**
 * Moduł pojedynczego case study — sekcje P1 i Q1.
 *
 * Desktop: grafika 44% / treść 56%. Mobile: grafika pełnej szerokości, potem
 * metryki 2x2, potem bloki narracyjne.
 *
 * Kolejność w DOM jest zawsze logiczna (nagłówek → obraz → metryki → historia),
 * także przy odwróconym kierunku wizualnym na desktopie (Q1) — odwracamy
 * wyłącznie kolumny flexem, nie kolejność treści.
 */
function CaseStudyModule({ data, flip }: { data: CaseStudy; flip?: boolean }) {
  const srcSet = (ext: string) =>
    data.image.widths.map((w) => `${data.image.base}-${w}.${ext} ${w}w`).join(", ");

  return (
    <article className="border-t border-tcs-border pt-12 sm:pt-16">
      <header className="mb-8 max-w-[52ch]">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-tcs-gold sm:text-xs">
          {data.eyebrow}
        </p>
        <h3 className="mt-3 text-[22px] font-bold leading-snug tracking-[-0.015em] text-tcs-text sm:text-[28px]">
          {data.headline}
        </h3>
      </header>

      <div
        className={[
          "flex flex-col gap-8 lg:gap-12",
          flip ? "lg:flex-row-reverse" : "lg:flex-row",
        ].join(" ")}
      >
        {/* --- Grafika: 44% na desktopie --- */}
        <figure className="lg:w-[44%] lg:shrink-0">
          <div className="relative overflow-hidden rounded-[14px] border border-tcs-border bg-tcs-surface">
            <picture>
              <source type="image/avif" srcSet={srcSet("avif")} sizes="(min-width: 1024px) 44vw, 100vw" />
              <source type="image/webp" srcSet={srcSet("webp")} sizes="(min-width: 1024px) 44vw, 100vw" />
              <img
                src={`${data.image.base}.jpg`}
                alt={data.image.alt}
                loading="lazy"
                decoding="async"
                width={data.image.intrinsic.w}
                height={data.image.intrinsic.h}
                // object-contain, nie cover — brief zabrania kadrowania ciała (P1).
                className="h-auto w-full object-contain"
              />
            </picture>

            {/* Etykiety PRZED/PO wymagane przez P1 i AN2. Zdjęcia są złożone
                pionowo: górna połowa = przed, dolna = po. */}
            <span className="absolute left-3 top-3 rounded bg-black/70 px-2.5 py-1 text-[11px] font-bold tracking-[0.14em] text-tcs-text">
              PRZED
            </span>
            <span className="absolute bottom-3 left-3 rounded bg-black/70 px-2.5 py-1 text-[11px] font-bold tracking-[0.14em] text-tcs-text">
              PO
            </span>
          </div>
          <figcaption className="mt-3 text-[13px] leading-relaxed text-tcs-text-muted">
            {data.image.caption}
          </figcaption>
        </figure>

        {/* --- Treść: 56% na desktopie --- */}
        <div className="lg:w-[56%]">
          <p className="text-[16px] leading-relaxed text-tcs-text sm:text-[17px]">
            {data.transformation}
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-tcs-border bg-tcs-border">
            {data.metrics.map((m) => (
              <div key={m.label} className="bg-tcs-surface px-4 py-5 text-center sm:px-5">
                <dt className="sr-only">{m.label}</dt>
                <dd>
                  <span className="block text-[24px] font-extrabold tracking-[-0.02em] text-tcs-gold sm:text-[28px]">
                    {m.value}
                  </span>
                  <span className="mt-1 block text-[12px] text-tcs-text-muted sm:text-[13px]">
                    {m.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-3 text-[12px] leading-relaxed text-tcs-text-muted sm:text-[13px]">
            {proof.metricsNote}
          </p>

          <div className="mt-8 space-y-5">
            {[
              { label: "Punkt startowy", text: data.start },
              { label: "Przeszkoda", text: data.obstacle },
              { label: "Mechanizm", text: data.mechanism },
              { label: "Rezultat", text: data.outcome },
            ].map((block) => (
              <div key={block.label}>
                <h4 className="text-[11px] font-bold tracking-[0.16em] text-tcs-text-muted">
                  {block.label.toUpperCase()}
                </h4>
                <p className="mt-1.5 text-[15px] leading-relaxed text-tcs-text-muted sm:text-[16px]">
                  {block.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

/** Sekcja Dowód — nagłówek z P + dwa moduły (P1, Q1). */
export function ProofSection() {
  return (
    <section id="dowod" className="bg-tcs-bg-alt py-16 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
        <div className="mx-auto mb-12 max-w-[46rem] text-center sm:mb-16">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-tcs-gold sm:text-xs">
            {proof.eyebrow}
          </p>
          <h2 className="mt-4 text-[28px] font-extrabold leading-tight tracking-[-0.02em] text-tcs-text sm:text-[38px] lg:text-[44px]">
            {proof.headline}
          </h2>
          <p className="mx-auto mt-5 max-w-[58ch] text-[16px] leading-relaxed text-tcs-text-muted sm:text-[18px]">
            {proof.supporting}
          </p>
        </div>

        <div className="space-y-14 sm:space-y-20">
          <CaseStudyModule data={boleslaw} />
          <CaseStudyModule data={oskar} flip />
        </div>
      </div>
    </section>
  );
}
