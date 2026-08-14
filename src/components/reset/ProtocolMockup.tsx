import Image from "next/image";

/**
 * Mockup Protokołu (brief sekcja 13).
 * Realna okładka finalnego PDF-a, a za nią bardzo subtelnie dwie strony środka —
 * bez generycznego mockupu ebooka i bez dominowania nad CTA.
 */
export function ProtocolMockup({ priority = false }: { priority?: boolean }) {
  return (
    <div
      className="relative mx-auto w-full max-w-[300px] sm:max-w-[360px] lg:max-w-[420px]"
      aria-hidden={false}
    >
      {/* Poświata pod dokumentem — buduje głębię, nie rozjaśnia treści. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-4 bottom-2 top-10 rounded-full bg-primary/20 blur-3xl"
      />

      {/* Strony środka wachlarzem za okładką. */}
      <Image
        src="/brand/protokol-strona-3.webp"
        alt=""
        aria-hidden
        width={700}
        height={990}
        sizes="(max-width: 640px) 40vw, 240px"
        className="absolute left-[14%] top-[5%] w-[86%] rotate-[7deg] rounded-lg border border-white/10 opacity-40 shadow-card"
      />
      <Image
        src="/brand/protokol-strona-2.webp"
        alt=""
        aria-hidden
        width={700}
        height={990}
        sizes="(max-width: 640px) 40vw, 240px"
        className="absolute left-[8%] top-[2.5%] w-[90%] rotate-[3.5deg] rounded-lg border border-white/10 opacity-70 shadow-card"
      />

      {/* Okładka — bohater wizualny sekcji. */}
      <Image
        src="/brand/protokol-okladka.webp"
        alt="Okładka 7 dniowego Protokołu Resetu — The Control System"
        width={1200}
        height={1698}
        priority={priority}
        sizes="(max-width: 640px) 75vw, (max-width: 1024px) 45vw, 420px"
        className="relative w-full rounded-xl border border-white/15 shadow-elegant"
      />
    </div>
  );
}
