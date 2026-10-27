import { proof, boleslaw, oskar, type CaseStudy } from "@/content/landing";

/**
 * Moduł pojedynczego case study — sekcje P1 i Q1.
 *
 * Zwarta karta na półprzezroczystym tle (poprawki 26.10.2026): zdjęcie
 * w wąskiej kolumnie, metryki w jednym rzędzie, historia w siatce 2x2.
 * Kolejność w DOM jest zawsze logiczna — odwracamy tylko kolumny flexem.
 */
function CaseStudyModule({ data, flip }: { data: CaseStudy; flip?: boolean }) {
  const srcSet = (ext: string) =>
    data.image.widths.map((w) => `${data.image.base}-${w}.${ext} ${w}w`).join(", ");

  return (
    <article className="rounded-[18px] border border-tcs-border/70 bg-tcs-bg/75 p-5 backdrop-blur-sm sm:p-7">
      {/* Imię i nagłówek na całą szerokość karty, nad zdjęciem (poprawki 26.10.2026). */}
      <header className="mb-5">
        <p className="text-[10px] font-semibold tracking-[0.18em] text-tcs-gold sm:text-[11px]">
          {data.eyebrow}
        </p>
        <h3 className="mt-2 text-[20px] font-bold leading-snug tracking-[-0.015em] text-tcs-text sm:text-[26px]">
          {data.headline}
        </h3>
      </header>

      <div
        className={[
          "flex flex-col gap-6 md:gap-8",
          flip ? "md:flex-row-reverse" : "md:flex-row",
        ].join(" ")}
      >
        {/* --- Zdjęcie: wąska kolumna, na mobile ograniczona szerokość --- */}
        <figure className="mx-auto w-full max-w-[300px] md:mx-0 md:w-[26%] md:max-w-none md:shrink-0">
          <div className="relative overflow-hidden rounded-[12px] border border-tcs-border bg-tcs-surface">
            <picture>
              <source type="image/avif" srcSet={srcSet("avif")} sizes="(min-width: 768px) 26vw, 300px" />
              <source type="image/webp" srcSet={srcSet("webp")} sizes="(min-width: 768px) 26vw, 300px" />
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

            {/* Etykiety PRZED/PO (P1, AN2): górna połowa = przed, dolna = po. */}
            <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-bold tracking-[0.14em] text-tcs-text">
              PRZED
            </span>
            <span className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-bold tracking-[0.14em] text-tcs-text">
              PO
            </span>
          </div>
          <figcaption className="mt-2 text-[11px] leading-relaxed text-tcs-text-muted">
            {data.image.caption}
          </figcaption>
        </figure>

        {/* --- Treść --- */}
        <div className="min-w-0 flex-1">
          <p className="text-[14px] leading-relaxed text-tcs-text sm:text-[15px]">
            {data.transformation}
          </p>

          <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-[12px] border border-tcs-border bg-tcs-border sm:grid-cols-4">
            {data.metrics.map((m) => (
              <div key={m.label} className="bg-tcs-surface px-3 py-3 text-center">
                <dt className="sr-only">{m.label}</dt>
                <dd>
                  <span className="block text-[19px] font-extrabold tracking-[-0.02em] text-tcs-gold sm:text-[21px]">
                    {m.value}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-tcs-text-muted sm:text-[12px]">
                    {m.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-2 text-[11px] leading-relaxed text-tcs-text-muted">{proof.metricsNote}</p>

          <div className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { label: "Punkt startowy", text: data.start },
              { label: "Przeszkoda", text: data.obstacle },
              { label: "Mechanizm", text: data.mechanism },
              { label: "Rezultat", text: data.outcome },
            ].map((block) => (
              <div key={block.label}>
                <h4 className="text-[10px] font-bold tracking-[0.16em] text-tcs-gold/90 sm:text-[11px]">
                  {block.label.toUpperCase()}
                </h4>
                <p className="mt-1 text-[14px] leading-relaxed text-tcs-text-muted">{block.text}</p>
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
    <section id="dowod" className="py-10 sm:py-14">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8">
        <div className="mx-auto mb-6 text-center sm:mb-8">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-tcs-gold sm:text-[11px]">
            {proof.eyebrow}
          </p>
          <h2 className="mt-3 text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-tcs-text sm:text-[28px] lg:text-[32px]">
            {proof.headline}
          </h2>
          <p className="mx-auto mt-3 text-[14px] leading-relaxed text-tcs-text-muted sm:text-[16px]">
            {proof.supporting}
          </p>
        </div>

        <div className="space-y-5 sm:space-y-6">
          <CaseStudyModule data={boleslaw} />
          <CaseStudyModule data={oskar} flip />
        </div>
      </div>
    </section>
  );
}
